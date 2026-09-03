<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Module;
use App\Models\ModuleProgress;
use App\Services\AuditLogService;
use App\Services\BadgeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgressController extends Controller
{
    // ── Mark module started ───────────────────────────────────────────────────

    public function start(Request $request, int $moduleId): JsonResponse
    {
        $userId = $request->user()->id;

        $progress = ModuleProgress::firstOrCreate(
            ['user_id' => $userId, 'module_id' => $moduleId],
            ['status' => 'not_started']
        );

        if ($progress->status === 'not_started') {
            $progress->update(['status' => 'in_progress', 'started_at' => now()]);
        }

        return response()->json(['success' => true, 'data' => $progress->fresh()]);
    }

    // ── Mark module complete ──────────────────────────────────────────────────

    public function complete(Request $request, int $moduleId): JsonResponse
    {
        $userId = $request->user()->id;
        $request->validate(['time_spent' => ['nullable', 'integer', 'min:0']]);

        $progress = ModuleProgress::where('user_id', $userId)
            ->where('module_id', $moduleId)
            ->first();

        if (!$progress) {
            return response()->json(['success' => false, 'message' => 'Module progress not found. Start the module first.'], 404);
        }

        $progress->update([
            'status'       => 'completed',
            'completed_at' => $progress->completed_at ?? now(),
            'time_spent'   => $request->time_spent,
        ]);

        AuditLogService::log('MODULE_COMPLETED', "Module #{$moduleId}", 'info', $userId, ['module_id' => $moduleId], $request);
        BadgeService::awardForModuleCompletion($userId);

        return response()->json(['success' => true, 'data' => $progress->fresh()]);
    }

    // ── Course progress summary ───────────────────────────────────────────────

    public function courseProgress(Request $request, int $courseId): JsonResponse
    {
        $userId     = $request->user()->id;
        $course     = Course::with('modules:id,title,order_index,is_published')->findOrFail($courseId);
        $enrollment = Enrollment::where('user_id', $userId)->where('course_id', $courseId)->first();

        if (!$enrollment) {
            return response()->json(['success' => false, 'message' => 'Not enrolled in this course.'], 403);
        }

        $publishedModules = $course->modules->where('is_published', true)->values();
        $moduleIds        = $publishedModules->pluck('id');

        $progressMap = ModuleProgress::where('user_id', $userId)
            ->whereIn('module_id', $moduleIds)
            ->get()
            ->keyBy('module_id');

        $modules = $publishedModules->map(function ($module) use ($progressMap) {
            $p = $progressMap[$module->id] ?? null;
            return [
                'module_id'   => $module->id,
                'title'       => $module->title,
                'order_index' => $module->order_index,
                'status'      => $p?->status ?? 'not_started',
                'started_at'  => $p?->started_at,
                'completed_at' => $p?->completed_at,
            ];
        });

        $totalModules     = $publishedModules->count();
        $completedModules = $progressMap->where('status', 'completed')->count();
        $percentage       = $totalModules > 0 ? round(($completedModules / $totalModules) * 100) : 0;

        return response()->json([
            'success' => true,
            'data'    => [
                'course_id'        => $courseId,
                'total_modules'    => $totalModules,
                'completed_modules' => $completedModules,
                'percentage'       => $percentage,
                'is_completed'     => $enrollment->completed_at !== null,
                'completed_at'     => $enrollment->completed_at,
                'modules'          => $modules,
            ],
        ]);
    }

    // ── Overall student dashboard stats ───────────────────────────────────────

    public function dashboard(Request $request): JsonResponse
    {
        $userId      = $request->user()->id;
        $enrollments = Enrollment::where('user_id', $userId)->with('course:id,title,emoji,gradient')->get();

        $totalCourses     = $enrollments->count();
        $completedCourses = $enrollments->whereNotNull('completed_at')->count();
        $totalCompleted   = ModuleProgress::where('user_id', $userId)->where('status', 'completed')->count();

        // Per-course module totals/completed in two grouped queries instead of one
        // round-trip per enrolled course (that's what MyLearningPage used to do itself).
        $courseIds = $enrollments->pluck('course_id');

        $totalByCourse = Module::whereIn('course_id', $courseIds)
            ->where('is_published', true)
            ->selectRaw('course_id, count(*) as total')
            ->groupBy('course_id')
            ->pluck('total', 'course_id');

        $completedByCourse = ModuleProgress::join('modules', 'modules.id', '=', 'module_progress.module_id')
            ->where('module_progress.user_id', $userId)
            ->where('module_progress.status', 'completed')
            ->whereIn('modules.course_id', $courseIds)
            ->where('modules.is_published', true)
            ->selectRaw('modules.course_id as course_id, count(*) as completed')
            ->groupBy('modules.course_id')
            ->pluck('completed', 'course_id');

        $enrollments->each(function ($e) use ($totalByCourse, $completedByCourse) {
            $total     = $totalByCourse[$e->course_id] ?? 0;
            $completed = $completedByCourse[$e->course_id] ?? 0;
            $e->total_modules     = $total;
            $e->completed_modules = $completed;
            $e->progress_percentage = $total > 0 ? round(($completed / $total) * 100) : 0;
        });

        return response()->json([
            'success' => true,
            'data'    => [
                'enrolled_courses'  => $totalCourses,
                'completed_courses' => $completedCourses,
                'modules_completed' => $totalCompleted,
                'streak_days'       => $request->user()->streak_days,
                'enrollments'       => $enrollments,
            ],
        ]);
    }

    // ── Save / update personal notes for a module ─────────────────────────────

    public function saveNotes(Request $request, int $moduleId): JsonResponse
    {
        $request->validate(['notes' => ['nullable', 'string', 'max:10000']]);

        ModuleProgress::updateOrCreate(
            ['user_id' => $request->user()->id, 'module_id' => $moduleId],
            ['notes_text' => $request->input('notes', '')]
        );

        return response()->json(['success' => true, 'message' => 'Notes saved.']);
    }
}
