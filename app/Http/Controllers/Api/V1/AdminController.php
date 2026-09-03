<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Badge;
use App\Models\Certificate;
use App\Models\CommunityComment;
use App\Models\CommunityPost;
use App\Models\CommunityReport;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\ExamAttempt;
use App\Models\ExceptionLog;
use App\Models\User;
use App\Services\AuditLogService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class AdminController extends Controller
{
    // ── Dashboard overview ────────────────────────────────────────────────────

    public function dashboard(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => [
                'total_users'       => User::count(),
                'total_students'    => User::where('role', 'student')->count(),
                'total_admins'      => User::where('role', 'admin')->count(),
                'total_courses'     => Course::count(),
                'published_courses' => Course::where('is_published', true)->count(),
                'total_enrollments' => Enrollment::count(),
                'completed_courses' => Enrollment::whereNotNull('completed_at')->count(),
                'total_certificates' => Certificate::count(),
                'pending_posts'     => CommunityPost::where('status', 'pending')->count(),
                'pending_comments'  => CommunityComment::where('status', 'pending')->count(),
            ],
        ]);
    }

    // ── Users ─────────────────────────────────────────────────────────────────

    public function users(Request $request): JsonResponse
    {
        $query = User::query();
        if ($request->role)   $query->where('role', $request->role);
        if ($request->search) $query->where(fn($q) => $q->where('name', 'like', "%{$request->search}%")->orWhere('email', 'like', "%{$request->search}%"));
        if ($request->active !== null) $query->where('is_active', (bool)$request->active);

        $users = $query->orderByDesc('created_at')->paginate(20);

        return response()->json(['success' => true, 'data' => $users]);
    }

    public function showUser(Request $request, int $id): JsonResponse
    {
        $user = User::with(['enrollments.course:id,title', 'badges.badge:id,name,icon'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $user]);
    }

    public function createUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'min:2', 'max:100'],
            'email'    => ['required', 'email', 'unique:dp_users,email'],
            'password' => ['required', Rules\Password::min(6)],
            'role'     => ['required', 'in:student,admin,pastor,mentor'],
            'sub_role' => ['nullable', 'in:super_admin,user_admin,content_admin,course_admin,community_admin,mentor_admin'],
        ]);

        $validated['password']  = Hash::make($validated['password']);
        $validated['is_active'] = true;

        $user = User::create($validated);
        AuditLogService::log('ADMIN_USER_CREATED', "Created user: {$user->email}", 'info', $request->user()->id, ['target_user' => $user->id], $request);

        return response()->json(['success' => true, 'data' => $user, 'message' => 'User created.'], 201);
    }

    public function updateUser(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name'      => ['sometimes', 'string', 'max:100'],
            'email'     => ['sometimes', 'email', "unique:dp_users,email,{$id}"],
            'role'      => ['sometimes', 'in:student,admin,pastor,mentor'],
            'sub_role'  => ['sometimes', 'nullable', 'in:super_admin,user_admin,content_admin,course_admin,community_admin,mentor_admin'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $user->update($validated);
        AuditLogService::log('ADMIN_USER_UPDATED', "Updated user: {$user->email}", 'info', $request->user()->id, ['target_user' => $id], $request);

        return response()->json(['success' => true, 'data' => $user->fresh()]);
    }

    public function deactivateUser(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        if ($user->id === $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Cannot deactivate your own account.'], 400);
        }
        $user->update(['is_active' => false]);
        $user->tokens()->delete();

        AuditLogService::log('USER_DEACTIVATED', "Deactivated: {$user->email}", 'warning', $request->user()->id, ['target_user' => $id], $request);

        return response()->json(['success' => true, 'message' => 'User deactivated.']);
    }

    public function reactivateUser(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->update(['is_active' => true]);

        AuditLogService::log('USER_REACTIVATED', "Reactivated: {$user->email}", 'info', $request->user()->id, ['target_user' => $id], $request);

        return response()->json(['success' => true, 'message' => 'User reactivated.']);
    }

    public function deleteUser(Request $request, int $id): JsonResponse
    {
        $target = User::findOrFail($id);

        if ($target->id === $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'You cannot delete your own account.'], 403);
        }

        $email = $target->email;
        $target->delete();

        AuditLogService::log('USER_DELETED', "Deleted user: {$email}", 'critical', $request->user()->id, ['deleted_email' => $email], $request);

        return response()->json(['success' => true, 'message' => 'User deleted.']);
    }

    // ── Badges ────────────────────────────────────────────────────────────────

    public function badges(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => Badge::withCount('userBadges')->get()]);
    }

    public function createBadge(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'icon'        => ['nullable', 'string', 'max:50'],
            'color'       => ['nullable', 'string', 'max:30'],
            'criteria'    => ['nullable', 'string'],
            'course_id'   => ['nullable', 'exists:courses,id'],
        ]);

        $badge = Badge::create($validated);

        return response()->json(['success' => true, 'data' => $badge, 'message' => 'Badge created.'], 201);
    }

    public function updateBadge(Request $request, int $id): JsonResponse
    {
        $badge = Badge::findOrFail($id);
        $badge->update($request->validate([
            'name'        => ['sometimes', 'string', 'max:100'],
            'description' => ['sometimes', 'nullable', 'string'],
            'icon'        => ['sometimes', 'nullable', 'string'],
            'color'       => ['sometimes', 'nullable', 'string'],
            'criteria'    => ['sometimes', 'nullable', 'string'],
        ]));

        return response()->json(['success' => true, 'data' => $badge->fresh()]);
    }

    public function deleteBadge(Request $request, int $id): JsonResponse
    {
        Badge::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Badge deleted.']);
    }

    // ── Community moderation ──────────────────────────────────────────────────

    public function communityStats(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => [
                'total_posts'          => CommunityPost::count(),
                'total_comments'       => CommunityComment::count(),
                'active_students'      => CommunityPost::where('created_at', '>=', now()->subDays(30))
                                              ->distinct('user_id')->count('user_id'),
                // community_reports has no status/resolution column — it's an append-only log,
                // so every row is effectively unactioned.
                'pending_reports'      => CommunityReport::count(),
                'unanswered_questions' => CommunityPost::where('category', 'question')
                                              ->where('status', 'approved')
                                              ->doesntHave('comments')
                                              ->count(),
            ],
        ]);
    }

    public function pendingContent(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => [
                'posts'    => CommunityPost::with('author:id,name')->where('status', 'pending')->get(),
                'comments' => CommunityComment::with('author:id,name', 'post:id,title')->where('status', 'pending')->get(),
            ],
        ]);
    }

    public function moderatePost(Request $request, int $id): JsonResponse
    {
        $request->validate(['action' => ['required', 'in:approve,reject']]);
        $post     = CommunityPost::findOrFail($id);
        $approved = $request->action === 'approve';
        $post->update(['status' => $approved ? 'approved' : 'rejected']);

        NotificationService::postModerated($post->user_id, $post->title, $approved);
        AuditLogService::log("POST_{$request->action}", "Post #{$id}", 'info', $request->user()->id, [], $request);

        return response()->json(['success' => true, 'message' => "Post {$request->action}d."]);
    }

    public function moderateComment(Request $request, int $id): JsonResponse
    {
        $request->validate(['action' => ['required', 'in:approve,reject']]);
        $comment  = CommunityComment::with('post:id,title')->findOrFail($id);
        $approved = $request->action === 'approve';
        $comment->update(['status' => $approved ? 'approved' : 'rejected']);

        NotificationService::commentModerated($comment->user_id, $comment->post->title ?? 'a post', $approved);
        AuditLogService::log("COMMENT_{$request->action}", "Comment #{$id}", 'info', $request->user()->id, [], $request);

        return response()->json(['success' => true, 'message' => "Comment {$request->action}d."]);
    }

    // ── Audit logs ────────────────────────────────────────────────────────────

    public function auditLogs(Request $request): JsonResponse
    {
        $query = AuditLog::with('user:id,name,email')->orderByDesc('created_at');
        if ($request->user_id)  $query->where('user_id', $request->user_id);
        if ($request->action)   $query->where('action', 'like', "%{$request->action}%");
        if ($request->severity) $query->where('severity', $request->severity);

        return response()->json(['success' => true, 'data' => $query->paginate(30)]);
    }

    // ── Exception logs ────────────────────────────────────────────────────────

    public function exceptionLogs(Request $request): JsonResponse
    {
        $logs = ExceptionLog::orderByDesc('created_at')
            ->when($request->source, fn($q) => $q->where('source', $request->source))
            ->when($request->resolved !== null, fn($q) => $q->where('is_resolved', (bool)$request->resolved))
            ->paginate(20);

        return response()->json(['success' => true, 'data' => $logs]);
    }

    public function resolveException(Request $request, int $id): JsonResponse
    {
        ExceptionLog::findOrFail($id)->update([
            'is_resolved' => true,
            'resolved_at' => now(),
            'resolved_by' => $request->user()->id,
        ]);

        return response()->json(['success' => true, 'message' => 'Exception marked as resolved.']);
    }

    // ── Platform stats ────────────────────────────────────────────────────────

    public function stats(): JsonResponse
    {
        // Overall pass rate
        $attemptStats = ExamAttempt::selectRaw('count(*) as total, SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) as passed_count')->first();
        $overallPassRate = $attemptStats->total > 0
            ? round(($attemptStats->passed_count / $attemptStats->total) * 100)
            : 0;

        // Per-course exam pass rates
        $courses = Course::withCount('enrollments')->get(['id', 'title', 'emoji']);
        $coursePassRates = $courses->map(function ($c) {
            $exams   = \App\Models\Exam::whereIn('module_id', \App\Models\Module::where('course_id', $c->id)->pluck('id'))->pluck('id');
            $stats   = ExamAttempt::whereIn('exam_id', $exams)
                ->selectRaw('count(*) as total, SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) as passed_count')
                ->first();
            $rate = ($stats->total > 0) ? round(($stats->passed_count / $stats->total) * 100) : 0;
            return ['id' => $c->id, 'title' => $c->title, 'emoji' => $c->emoji, 'pass_rate' => $rate, 'enrollments' => $c->enrollments_count];
        });

        // Monthly enrollments — last 6 months
        $monthly = [];
        for ($i = 5; $i >= 0; $i--) {
            $date  = now()->subMonths($i);
            $count = Enrollment::whereYear('enrolled_at', $date->year)
                ->whereMonth('enrolled_at', $date->month)->count();
            $monthly[] = ['month' => $date->format('M'), 'count' => $count];
        }

        // Daily activity (enrollments + exam attempts) — last 35 days
        $heatmap = [];
        for ($i = 34; $i >= 0; $i--) {
            $date    = now()->subDays($i)->toDateString();
            $enrols  = Enrollment::whereDate('enrolled_at', $date)->count();
            $exams   = ExamAttempt::whereDate('submitted_at', $date)->count();
            $heatmap[] = ['date' => $date, 'count' => $enrols + $exams];
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'overall_pass_rate'   => $overallPassRate,
                'total_attempts'      => $attemptStats->total,
                'course_pass_rates'   => $coursePassRates,
                'monthly_enrollments' => $monthly,
                'activity_heatmap'    => $heatmap,
                'users_by_role'       => User::selectRaw('role, count(*) as count')->groupBy('role')->get(),
            ],
        ]);
    }
}
