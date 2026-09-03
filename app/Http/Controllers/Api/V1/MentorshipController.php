<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\MentorProfile;
use App\Models\MentorshipActionPoint;
use App\Models\MentorshipGoal;
use App\Models\MentorshipMessage;
use App\Models\MentorshipRequest;
use App\Models\MentorshipSession;
use App\Models\Module;
use App\Models\ModuleProgress;
use App\Services\AuditLogService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MentorshipController extends Controller
{
    // ── Mentor profiles ───────────────────────────────────────────────────────

    public function mentors(Request $request): JsonResponse
    {
        $mentors = MentorProfile::with('user:id,name,avatar_url')
            ->where('status', 'approved')
            ->where('availability_status', 'available')
            ->get();

        return response()->json(['success' => true, 'data' => $mentors]);
    }

    public function myProfile(Request $request): JsonResponse
    {
        $profile = MentorProfile::where('user_id', $request->user()->id)->first();
        return response()->json(['success' => true, 'data' => $profile]);
    }

    public function upsertProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'bio'                => ['nullable', 'string'],
            'specializations'    => ['nullable', 'array'],
            'max_mentees'        => ['nullable', 'integer', 'min:1', 'max:20'],
            'is_available'       => ['nullable', 'boolean'],
            'meeting_preference' => ['nullable', 'in:online,in_person,both'],
        ]);

        $profile = MentorProfile::updateOrCreate(
            ['user_id' => $request->user()->id],
            $validated
        );

        return response()->json(['success' => true, 'data' => $profile]);
    }

    // ── Mentorship requests ───────────────────────────────────────────────────

    public function requestMentorship(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'preferred_mentor_id' => ['nullable', 'exists:dp_users,id'],
            'message'             => ['nullable', 'string', 'max:1000'],
            'goals'               => ['nullable', 'string', 'max:1000'],
        ]);

        // One live engagement at a time — past requests (completed/rejected) stay in
        // the table as history and never block a new request.
        $existing = MentorshipRequest::where('student_id', $request->user()->id)
            ->whereIn('status', ['pending', 'approved', 'active'])
            ->first();

        if ($existing) {
            return response()->json(['success' => false, 'message' => 'You already have an active or pending mentorship engagement.'], 409);
        }

        $mentorRequest = MentorshipRequest::create([
            'student_id'          => $request->user()->id,
            'preferred_mentor_id' => $validated['preferred_mentor_id'] ?? null,
            // DB columns are `reason`/`learning_goals` — the request body uses friendlier names.
            'reason'              => $validated['message'] ?? null,
            'learning_goals'      => $validated['goals'] ?? null,
            'status'              => 'pending',
        ]);

        AuditLogService::log('MENTORSHIP_REQUESTED', "Student #{$request->user()->id} requested mentorship", 'info', $request->user()->id, ['mentorship_request_id' => $mentorRequest->id], $request);

        return response()->json(['success' => true, 'data' => $mentorRequest, 'message' => 'Mentorship request submitted.'], 201);
    }

    public function myRequests(Request $request): JsonResponse
    {
        $requests = MentorshipRequest::with(['preferredMentor:id,name', 'assignedMentor:id,name,avatar_url'])
            ->where('student_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['success' => true, 'data' => $requests]);
    }

    // ── Admin: all sessions across all mentors ────────────────────────────────

    public function allSessions(Request $request): JsonResponse
    {
        $query = MentorshipSession::with([
            'mentor:id,name,email',
            'student:id,name,email',
        ])->orderByDesc('scheduled_at');

        if ($request->status)    $query->where('status',    $request->status);
        if ($request->mentor_id) $query->where('mentor_id', $request->mentor_id);

        $sessions = $query->get();

        return response()->json(['success' => true, 'data' => $sessions]);
    }

    // ── Admin: pending requests ───────────────────────────────────────────────

    public function pendingRequests(Request $request): JsonResponse
    {
        $requests = MentorshipRequest::with(['student:id,name,email', 'preferredMentor:id,name'])
            ->where('status', 'pending')
            ->orderBy('created_at')
            ->get();

        // Flag requesters who are themselves an approved mentor — useful context for
        // whoever assigns the request (e.g. a junior/senior mentor pairing).
        $requesterMentorIds = MentorProfile::where('status', 'approved')
            ->whereIn('user_id', $requests->pluck('student_id'))
            ->pluck('user_id')->flip();

        $requests->each(function ($r) use ($requesterMentorIds) {
            $r->requester_is_mentor = $requesterMentorIds->has($r->student_id);
        });

        return response()->json(['success' => true, 'data' => $requests]);
    }

    public function assignMentor(Request $request, int $requestId): JsonResponse
    {
        $mentorRequest = MentorshipRequest::findOrFail($requestId);

        // Approve-only / reject — admin reviewing before a mentor is matched, no mentor_id yet.
        if ($request->filled('status') && !$request->filled('mentor_id')) {
            $validated = $request->validate([
                'status'      => ['required', 'in:approved,rejected'],
                'admin_notes' => ['nullable', 'string', 'max:1000'],
            ]);

            $mentorRequest->update([
                'status'      => $validated['status'],
                'admin_notes' => $validated['admin_notes'] ?? null,
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);

            AuditLogService::log(
                $validated['status'] === 'approved' ? 'MENTORSHIP_REQUEST_APPROVED' : 'MENTORSHIP_REQUEST_REJECTED',
                "Mentorship request #{$requestId} marked {$validated['status']}",
                'info', $request->user()->id, ['mentorship_request_id' => $requestId], $request
            );

            return response()->json(['success' => true, 'data' => $mentorRequest->fresh(), 'message' => "Request {$validated['status']}."]);
        }

        $validated = $request->validate([
            'mentor_id' => ['required', 'exists:dp_users,id'],
        ]);

        if ($validated['mentor_id'] === $mentorRequest->student_id) {
            AuditLogService::log('MENTOR_ASSIGN_BLOCKED', "Blocked self-mentor assignment attempt on request #{$requestId}", 'warning', $request->user()->id, ['mentorship_request_id' => $requestId], $request);
            return response()->json(['success' => false, 'message' => 'A student cannot be assigned as their own mentor.'], 422);
        }

        $hasApprovedProfile = MentorProfile::where('user_id', $validated['mentor_id'])
            ->where('status', 'approved')->exists();
        if (!$hasApprovedProfile) {
            return response()->json(['success' => false, 'message' => 'That user is not an approved mentor.'], 422);
        }

        $mentorRequest->update([
            'assigned_mentor_id' => $validated['mentor_id'],
            'status'             => 'active',
            'assigned_at'        => now(),
        ]);

        AuditLogService::log('MENTOR_ASSIGNED', "Mentor #{$validated['mentor_id']} assigned to student #{$mentorRequest->student_id}", 'info', $request->user()->id, ['mentorship_request_id' => $requestId, 'mentor_id' => $validated['mentor_id']], $request);

        NotificationService::mentorshipAssigned($mentorRequest->student_id, $validated['mentor_id']);

        return response()->json(['success' => true, 'data' => $mentorRequest->fresh(), 'message' => 'Mentor assigned.']);
    }

    // ── Sessions ──────────────────────────────────────────────────────────────

    // ── Mentor: my mentees' discipleship progress ─────────────────────────────
    // So a mentor isn't preparing for a session blind — session prep currently
    // has to happen entirely through conversation with no visibility into where
    // the student actually is in their coursework.

    public function myMentees(Request $request): JsonResponse
    {
        $mentorId = $request->user()->id;

        $requests = MentorshipRequest::with('student:id,name,email,avatar_url')
            ->where('assigned_mentor_id', $mentorId)
            ->where('status', 'active')
            ->get();

        $studentIds = $requests->pluck('student_id');
        $enrollments = Enrollment::whereIn('user_id', $studentIds)
            ->with('course:id,title,emoji')
            ->get()
            ->groupBy('user_id');

        $mentees = $requests->map(function ($r) use ($enrollments) {
            $courses = ($enrollments[$r->student_id] ?? collect())->map(function ($e) {
                $moduleIds = Module::where('course_id', $e->course_id)->where('is_published', true)->pluck('id');
                $completed = ModuleProgress::where('user_id', $e->user_id)
                    ->where('status', 'completed')
                    ->whereIn('module_id', $moduleIds)
                    ->count();
                $total = $moduleIds->count();

                return [
                    'course_id'         => $e->course_id,
                    'course_title'      => $e->course->title ?? '',
                    'course_emoji'      => $e->course->emoji ?? '📖',
                    'total_modules'     => $total,
                    'completed_modules' => $completed,
                    'percentage'        => $total > 0 ? round(($completed / $total) * 100) : 0,
                    'is_completed'      => $e->completed_at !== null,
                ];
            })->values();

            return [
                'request_id'   => $r->id,
                'student_id'   => $r->student_id,
                'student_name' => $r->student->name ?? 'Unknown',
                'avatar_url'   => $r->student->avatar_url ?? null,
                'assigned_at'  => $r->assigned_at,
                'goals'        => $r->learning_goals,
                'courses'      => $courses,
            ];
        });

        return response()->json(['success' => true, 'data' => $mentees]);
    }

    public function sessions(Request $request): JsonResponse
    {
        $userId  = $request->user()->id;
        $sessions = MentorshipSession::where(fn($q) => $q->where('student_id', $userId)->orWhere('mentor_id', $userId))
            ->with(['student:id,name', 'mentor:id,name'])
            ->orderByDesc('scheduled_at')
            ->get();

        return response()->json(['success' => true, 'data' => $sessions]);
    }

    public function createSession(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'                 => ['required', 'string', 'max:255'],
            'description'           => ['nullable', 'string'],
            'mentorship_request_id' => ['nullable', 'exists:mentorship_requests,id'],
            'student_id'            => ['nullable', 'exists:dp_users,id'],
            'scheduled_at'          => ['required', 'date'],
            'start_at'              => ['nullable', 'date'],
            'end_at'                => ['nullable', 'date'],
            'duration_minutes'      => ['nullable', 'integer', 'min:15', 'max:480'],
            'meeting_link'          => ['nullable', 'string', 'max:500'],
            'notes'                 => ['nullable', 'string'],
        ]);

        // Derive scheduled_at from start_at if provided
        $scheduledAt = $validated['start_at'] ?? $validated['scheduled_at'];

        $session = MentorshipSession::create(array_merge($validated, [
            'mentor_id'    => $request->user()->id,
            'student_id'   => $validated['student_id'] ?? $request->user()->id,
            'scheduled_at' => $scheduledAt,
            'status'       => 'scheduled',
        ]));

        return response()->json(['success' => true, 'data' => $session, 'message' => 'Session scheduled.'], 201);
    }

    public function completeSession(Request $request, int $id): JsonResponse
    {
        $session = MentorshipSession::findOrFail($id);
        $request->validate([
            'notes'           => ['nullable', 'string'],
            'mentor_feedback' => ['nullable', 'string'],
        ]);

        $session->update([
            'status'           => 'completed',
            'completed_at'     => now(),
            'notes'            => $request->notes,
            'mentor_feedback'  => $request->mentor_feedback,
        ]);

        return response()->json(['success' => true, 'data' => $session->fresh()]);
    }

    // ── Messages ──────────────────────────────────────────────────────────────
    // Simple async thread between a student and their mentor, scoped to one
    // mentorship engagement — the gap noted alongside session scheduling: no
    // way to communicate between sessions or leave a note before one.

    private function authorizeThread(int $requestId, int $userId): MentorshipRequest
    {
        $mentorshipRequest = MentorshipRequest::findOrFail($requestId);
        if ($mentorshipRequest->student_id !== $userId && $mentorshipRequest->assigned_mentor_id !== $userId) {
            abort(403, 'You are not part of this mentorship engagement.');
        }
        return $mentorshipRequest;
    }

    public function messages(Request $request, int $requestId): JsonResponse
    {
        $userId = $request->user()->id;
        $this->authorizeThread($requestId, $userId);

        $messages = MentorshipMessage::with('sender:id,name,avatar_url')
            ->where('mentorship_request_id', $requestId)
            ->orderBy('created_at')
            ->get();

        // Mark the other party's messages as read now that this user has opened the thread.
        MentorshipMessage::where('mentorship_request_id', $requestId)
            ->where('sender_id', '!=', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['success' => true, 'data' => $messages]);
    }

    public function sendMessage(Request $request, int $requestId): JsonResponse
    {
        $userId = $request->user()->id;
        $mentorshipRequest = $this->authorizeThread($requestId, $userId);

        $validated = $request->validate(['body' => ['required', 'string', 'max:2000']]);

        $message = MentorshipMessage::create([
            'mentorship_request_id' => $requestId,
            'sender_id'             => $userId,
            'body'                  => $validated['body'],
        ]);

        $recipientId = $userId === $mentorshipRequest->student_id
            ? $mentorshipRequest->assigned_mentor_id
            : $mentorshipRequest->student_id;

        if ($recipientId) {
            NotificationService::send($recipientId, '💬 New Mentorship Message',
                "{$request->user()->name}: " . \Illuminate\Support\Str::limit($validated['body'], 100),
                'mentorship_message'
            );
        }

        return response()->json(['success' => true, 'data' => $message->load('sender:id,name,avatar_url')], 201);
    }

    // ── Goals ─────────────────────────────────────────────────────────────────

    public function goals(Request $request, int $requestId): JsonResponse
    {
        $goals = MentorshipGoal::where('mentorship_request_id', $requestId)
            ->with('actionPoints')
            ->get();

        return response()->json(['success' => true, 'data' => $goals]);
    }

    public function createGoal(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'mentorship_request_id' => ['required', 'exists:mentorship_requests,id'],
            'title'                 => ['required', 'string', 'max:255'],
            'description'           => ['nullable', 'string'],
            'target_date'           => ['nullable', 'date'],
        ]);

        $goal = MentorshipGoal::create($validated);

        return response()->json(['success' => true, 'data' => $goal, 'message' => 'Goal created.'], 201);
    }

    public function updateGoal(Request $request, int $id): JsonResponse
    {
        $goal = MentorshipGoal::findOrFail($id);
        $goal->update($request->validate([
            'title'       => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'status'      => ['sometimes', 'in:pending,in_progress,completed'],
            'target_date' => ['sometimes', 'nullable', 'date'],
        ]));

        return response()->json(['success' => true, 'data' => $goal->fresh()]);
    }

    // ── Action Points ─────────────────────────────────────────────────────────

    public function addActionPoint(Request $request, int $goalId): JsonResponse
    {
        MentorshipGoal::findOrFail($goalId);
        $validated = $request->validate([
            'description' => ['required', 'string'],
            'due_date'    => ['nullable', 'date'],
        ]);

        $ap = MentorshipActionPoint::create(array_merge($validated, ['goal_id' => $goalId]));

        return response()->json(['success' => true, 'data' => $ap], 201);
    }

    public function completeActionPoint(Request $request, int $id): JsonResponse
    {
        $ap = MentorshipActionPoint::findOrFail($id);
        $ap->update(['completed_at' => now()]);

        return response()->json(['success' => true, 'data' => $ap->fresh()]);
    }
}
