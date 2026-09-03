<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\ModuleProgress;
use App\Services\AuditLogService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    // ── Enroll ────────────────────────────────────────────────────────────────

    public function enroll(Request $request, int $courseId): JsonResponse
    {
        $course = Course::where('id', $courseId)->where('is_published', true)->firstOrFail();
        $userId = $request->user()->id;

        $existing = Enrollment::where('user_id', $userId)->where('course_id', $courseId)->first();
        if ($existing) {
            return response()->json(['success' => false, 'message' => 'Already enrolled.', 'data' => $existing], 409);
        }

        $enrollment = Enrollment::create([
            'user_id'     => $userId,
            'course_id'   => $courseId,
            'enrolled_at' => now(),
        ]);

        // Unlock module 1 progress
        $firstModule = $course->modules()->where('order_index', 1)->where('is_published', true)->first();
        if ($firstModule) {
            ModuleProgress::firstOrCreate(
                ['user_id' => $userId, 'module_id' => $firstModule->id],
                ['status' => 'not_started']
            );
        }

        AuditLogService::log('ENROLLED', "Course: {$course->title}", 'info', $userId, ['course_id' => $courseId], $request);

        return response()->json([
            'success' => true,
            'data'    => $enrollment,
            'message' => "You have enrolled in {$course->title}.",
        ], 201);
    }

    // ── My enrollments ────────────────────────────────────────────────────────

    public function myEnrollments(Request $request): JsonResponse
    {
        $enrollments = Enrollment::with(['course:id,title,subtitle,emoji,gradient,level,thumbnail_url,is_published'])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('enrolled_at')
            ->get();

        return response()->json(['success' => true, 'data' => $enrollments]);
    }

    // ── Enrollment status for a course ────────────────────────────────────────

    public function status(Request $request, int $courseId): JsonResponse
    {
        $enrollment = Enrollment::where('user_id', $request->user()->id)
            ->where('course_id', $courseId)
            ->first();

        return response()->json([
            'success' => true,
            'data'    => [
                'enrolled'     => $enrollment !== null,
                'completed'    => $enrollment && $enrollment->completed_at !== null,
                'enrolled_at'  => $enrollment?->enrolled_at,
                'completed_at' => $enrollment?->completed_at,
            ],
        ]);
    }

    // ── Unenroll ──────────────────────────────────────────────────────────────

    public function unenroll(Request $request, int $courseId): JsonResponse
    {
        $enrollment = Enrollment::where('user_id', $request->user()->id)
            ->where('course_id', $courseId)
            ->first();

        if (!$enrollment) {
            return response()->json(['success' => false, 'message' => 'Not enrolled.'], 404);
        }

        $enrollment->delete();

        // Remove module progress for this course
        $course = Course::findOrFail($courseId);
        $moduleIds = $course->modules()->pluck('id');
        ModuleProgress::where('user_id', $request->user()->id)
            ->whereIn('module_id', $moduleIds)->delete();

        AuditLogService::log('UNENROLLED', "Course: {$courseId}", 'warning', $request->user()->id, ['course_id' => $courseId], $request);

        return response()->json(['success' => true, 'message' => 'Unenrolled successfully.']);
    }
}
