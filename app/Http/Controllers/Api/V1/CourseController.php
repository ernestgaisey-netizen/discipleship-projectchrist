<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CourseController extends Controller
{
    // ── List courses ──────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $user    = $request->user() ?? auth('sanctum')->user();
        $isAdmin = $user && $user->isAdmin();

        $query = Course::with(['creator:id,name'])
            ->withCount(['modules', 'enrollments']);

        if (!$isAdmin) {
            $query->where('is_published', true);
        }

        $courses = $query->orderBy('order_index')->get();

        // Attach user's enrollment status
        if ($user) {
            $enrolled = Enrollment::where('user_id', $user->id)
                ->pluck('completed_at', 'course_id');

            $courses = $courses->map(function ($course) use ($enrolled) {
                $course->is_enrolled = isset($enrolled[$course->id]);
                $course->is_completed = isset($enrolled[$course->id]) && $enrolled[$course->id] !== null;
                return $course;
            });
        }

        return response()->json(['success' => true, 'data' => $courses]);
    }

    // ── Single course with modules ─────────────────────────────────────────────

    public function show(Request $request, int $id): JsonResponse
    {
        // This is a public route so $request->user() returns null even with a valid token.
        // auth('sanctum')->user() processes the Bearer token without requiring the middleware.
        $user    = $request->user() ?? auth('sanctum')->user();
        $isAdmin = $user && $user->isAdmin();

        $course = Course::with(['modules' => function ($q) use ($isAdmin) {
            // Admins see all modules (including drafts); students see published only
            if (!$isAdmin) {
                $q->where('is_published', true);
            }
            $q->orderBy('order_index');
        }, 'creator:id,name'])->findOrFail($id);

        if (!$course->is_published && (!$user || !$user->isAdmin())) {
            return response()->json(['success' => false, 'message' => 'Course not found.'], 404);
        }

        $enrollment = null;
        $completedModuleIds = [];

        if ($user) {
            $enrollment = Enrollment::where('user_id', $user->id)->where('course_id', $id)->first();
            if ($enrollment) {
                $completedModuleIds = \App\Models\ModuleProgress::where('user_id', $user->id)
                    ->whereIn('module_id', $course->modules->pluck('id'))
                    ->where('status', 'completed')
                    ->pluck('module_id')
                    ->toArray();
            }
        }

        // Pre-load exam question counts for all modules in one query
        $moduleIds    = $course->modules->pluck('id');
        $examQCounts  = \App\Models\Exam::whereIn('module_id', $moduleIds)
            ->withCount('questions')
            ->get()
            ->keyBy('module_id');

        $modulesData = $course->modules->map(function ($module, $index) use ($course, $enrollment, $completedModuleIds, $user, $examQCounts) {
            $isCompleted = in_array($module->id, $completedModuleIds);
            $isLocked    = !$enrollment || ($index > 0 && !in_array(
                $course->modules[$index - 1]->id ?? null,
                $completedModuleIds
            ));
            $isCurrent   = $enrollment && !$isCompleted && !$isLocked;

            $examRecord = $examQCounts->get($module->id);

            return array_merge($module->toArray(), [
                'is_completed'        => $isCompleted,
                'is_locked'           => $index === 0 ? !$enrollment : $isLocked,
                'is_current'          => $isCurrent,
                'exam_questions_count' => $examRecord ? $examRecord->questions_count : 0,
                'has_exam'            => $examRecord !== null,
            ]);
        });

        return response()->json([
            'success' => true,
            'data'    => array_merge($course->toArray(), [
                'modules'    => $modulesData,
                'enrollment' => $enrollment,
            ]),
        ]);
    }

    // ── Create course (admin) ─────────────────────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'               => ['required', 'string', 'max:255'],
            'subtitle'            => ['nullable', 'string', 'max:500'],
            'description'         => ['nullable', 'string'],
            'category'            => ['nullable', 'string', 'max:100'],
            'level'               => ['required', 'in:beginner,intermediate,advanced'],
            'duration_weeks'      => ['nullable', 'integer', 'min:1'],
            'emoji'               => ['nullable', 'string', 'max:10'],
            'gradient'            => ['nullable', 'string', 'max:255'],
            'accent_color'        => ['nullable', 'string', 'max:20'],
            'badge_name'          => ['nullable', 'string', 'max:255'],
            'objectives'          => ['nullable', 'array'],
            'target_audience'     => ['nullable', 'array'],
            'prerequisites'       => ['nullable', 'array'],
            'instructor_name'     => ['nullable', 'string', 'max:255'],
            'intro_video_url'     => ['nullable', 'url', 'max:500'],
            'certificate_enabled' => ['nullable', 'boolean'],
            'is_published'        => ['nullable', 'boolean'],
        ]);

        $validated['created_by'] = $request->user()->id;
        $course = Course::create($validated);

        AuditLogService::log('COURSE_CREATED', "Course: {$course->title}", 'info', $request->user()->id, ['course_id' => $course->id], $request);

        return response()->json(['success' => true, 'data' => $course, 'message' => 'Course created.'], 201);
    }

    // ── Update course (admin) ──────────────────────────────────────────────────

    public function update(Request $request, int $id): JsonResponse
    {
        $course = Course::findOrFail($id);
        $validated = $request->validate([
            'title'               => ['sometimes', 'string', 'max:255'],
            'subtitle'            => ['sometimes', 'nullable', 'string', 'max:500'],
            'description'         => ['sometimes', 'nullable', 'string'],
            'category'            => ['sometimes', 'nullable', 'string', 'max:100'],
            'level'               => ['sometimes', 'in:beginner,intermediate,advanced'],
            'duration_weeks'      => ['sometimes', 'nullable', 'integer'],
            'emoji'               => ['sometimes', 'nullable', 'string'],
            'gradient'            => ['sometimes', 'nullable', 'string'],
            'accent_color'        => ['sometimes', 'nullable', 'string'],
            'badge_name'          => ['sometimes', 'nullable', 'string'],
            'objectives'          => ['sometimes', 'nullable', 'array'],
            'target_audience'     => ['sometimes', 'nullable', 'array'],
            'prerequisites'       => ['sometimes', 'nullable', 'array'],
            'instructor_name'     => ['sometimes', 'nullable', 'string'],
            'intro_video_url'     => ['sometimes', 'nullable', 'url'],
            'certificate_enabled' => ['sometimes', 'boolean'],
            'is_published'        => ['sometimes', 'boolean'],
            'order_index'         => ['sometimes', 'integer'],
        ]);

        $course->update($validated);
        AuditLogService::log('COURSE_EDITED', "Course: {$course->title}", 'info', $request->user()->id, ['course_id' => $course->id], $request);

        return response()->json(['success' => true, 'data' => $course->fresh(), 'message' => 'Course updated.']);
    }

    // ── Delete course (admin) ─────────────────────────────────────────────────

    public function destroy(Request $request, int $id): JsonResponse
    {
        $course = Course::findOrFail($id);
        $title  = $course->title;
        $course->delete();

        AuditLogService::log('COURSE_DELETED', "Course: {$title}", 'warning', $request->user()->id, ['course_id' => $id], $request);

        return response()->json(['success' => true, 'message' => 'Course deleted.']);
    }

    // ── Upload thumbnail ──────────────────────────────────────────────────────

    public function uploadThumbnail(Request $request, int $id): JsonResponse
    {
        $course = Course::findOrFail($id);
        $request->validate([
            'thumbnail' => ['required', 'image', 'mimes:jpeg,png,webp,gif', 'max:2048'],
        ]);

        $path = $request->file('thumbnail')->store('thumbnails', 'public');
        $url  = '/storage/' . $path;

        $course->update(['thumbnail_url' => $url]);

        return response()->json(['success' => true, 'data' => ['thumbnail_url' => $url]]);
    }
}
