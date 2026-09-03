<?php

use App\Http\Controllers\Api\V1\AdminController;
use App\Http\Controllers\Api\V1\AiController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CertificateController;
use App\Http\Controllers\Api\V1\CommunityController;
use App\Http\Controllers\Api\V1\CourseController;
use App\Http\Controllers\Api\V1\EnrollmentController;
use App\Http\Controllers\Api\V1\ExamController;
use App\Http\Controllers\Api\V1\FileController;
use App\Http\Controllers\Api\V1\MentorshipController;
use App\Http\Controllers\Api\V1\MfaController;
use App\Http\Controllers\Api\V1\ModuleController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\ProgressController;
use Illuminate\Support\Facades\Route;

// ── Health check (no auth) ────────────────────────────────────────────────────
Route::get('/health', [FileController::class, 'health']);
Route::get('/v1/stats', [FileController::class, 'publicStats']);

Route::prefix('v1')->group(function () {

    // ── Public: certificate verification ─────────────────────────────────────
    Route::get('/certificates/verify/{code}', [CertificateController::class, 'verify']);

    // ── Auth (unauthenticated) — rate-limited ─────────────────────────────────
    Route::prefix('auth')->middleware(['throttle:10,1'])->group(function () {
        Route::post('/register',        [AuthController::class, 'register']);
        Route::post('/login',           [AuthController::class, 'login']);
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('/reset-password',  [AuthController::class, 'resetPassword']);
    });

    // MFA verify-login has its own independent throttle (not stacked with auth group)
    Route::post('/auth/mfa/verify-login', [MfaController::class, 'verifyLogin'])
         ->middleware(['throttle:5,1']);

    // ── Public: browse courses ────────────────────────────────────────────────
    Route::get('/courses',      [CourseController::class, 'index']);
    Route::get('/courses/{id}', [CourseController::class, 'show']);

    // ── Public: community read (write/like/report stay auth-only) ─────────────
    Route::get('/community/posts',      [CommunityController::class, 'posts']);
    Route::get('/community/posts/{id}', [CommunityController::class, 'showPost']);

    // ── Authenticated routes ──────────────────────────────────────────────────
    Route::middleware(['auth:sanctum', 'active'])->group(function () {

        // Auth profile
        Route::prefix('auth')->group(function () {
            Route::post('/logout',          [AuthController::class, 'logout']);
            Route::get('/me',               [AuthController::class, 'me']);
            Route::patch('/profile',        [AuthController::class, 'updateProfile']);
            Route::post('/change-password', [AuthController::class, 'changePassword']);

            // MFA
            Route::prefix('mfa')->group(function () {
                Route::get('/setup',    [MfaController::class, 'setup']);
                Route::post('/enable',  [MfaController::class, 'enable']);
                Route::post('/disable', [MfaController::class, 'disable']);
            });
        });

        // File uploads
        Route::post('/files/avatar',  [FileController::class, 'uploadAvatar']);
        Route::get('/files/{path}',   [FileController::class, 'serveProtected'])->where('path', '.*');

        // Enrollments
        Route::post('/courses/{courseId}/enroll',  [EnrollmentController::class, 'enroll']);
        Route::get('/courses/{courseId}/enrollment', [EnrollmentController::class, 'status']);
        Route::delete('/courses/{courseId}/unenroll', [EnrollmentController::class, 'unenroll']);
        Route::get('/my-enrollments', [EnrollmentController::class, 'myEnrollments']);

        // Modules
        Route::get('/modules/{id}', [ModuleController::class, 'show']);

        // Progress
        Route::post('/progress/{moduleId}/start',    [ProgressController::class, 'start']);
        Route::post('/progress/{moduleId}/complete', [ProgressController::class, 'complete']);
        Route::patch('/progress/{moduleId}/notes',   [ProgressController::class, 'saveNotes']);
        Route::get('/progress/course/{courseId}',    [ProgressController::class, 'courseProgress']);
        Route::get('/progress/dashboard',            [ProgressController::class, 'dashboard']);

        // Exams
        Route::get('/exams/module/{moduleId}',    [ExamController::class, 'getByModule']);
        Route::post('/exams/{examId}/answer',     [ExamController::class, 'answerQuestion']);
        Route::post('/exams/{examId}/back',       [ExamController::class, 'stepBackQuestion']);
        Route::post('/exams/{examId}/finish',     [ExamController::class, 'finishExam']);
        Route::get('/exams/{examId}/attempts',    [ExamController::class, 'attempts']);

        // Certificates
        Route::get('/certificates',       [CertificateController::class, 'index']);
        Route::get('/certificates/{id}/download', [CertificateController::class, 'download']);

        // Notifications
        Route::get('/notifications',              [NotificationController::class, 'index']);
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::patch('/notifications/{id}/read',  [NotificationController::class, 'markRead']);
        Route::post('/notifications/read-all',    [NotificationController::class, 'markAllRead']);
        Route::delete('/notifications/{id}',      [NotificationController::class, 'destroy']);

        // Community (GET routes are public above; write/interact routes require auth)
        Route::post('/community/posts',           [CommunityController::class, 'createPost']);
        Route::patch('/community/posts/{id}',     [CommunityController::class, 'updatePost']);
        Route::delete('/community/posts/{id}',    [CommunityController::class, 'deletePost']);
        Route::post('/community/posts/{id}/comments', [CommunityController::class, 'addComment']);
        Route::delete('/community/comments/{id}', [CommunityController::class, 'deleteComment']);
        Route::post('/community/{type}/{id}/like', [CommunityController::class, 'toggleLike'])->where('type', 'post|comment');
        Route::post('/community/report',          [CommunityController::class, 'report']);

        // Mentorship
        Route::get('/mentors',                     [MentorshipController::class, 'mentors']);
        Route::get('/mentorship/my-profile',       [MentorshipController::class, 'myProfile']);
        Route::put('/mentorship/my-profile',       [MentorshipController::class, 'upsertProfile']);
        Route::get('/mentorship/my-mentees',       [MentorshipController::class, 'myMentees']);
        Route::post('/mentorship/request',         [MentorshipController::class, 'requestMentorship']);
        Route::get('/mentorship/my-requests',      [MentorshipController::class, 'myRequests']);
        Route::get('/mentorship/sessions',         [MentorshipController::class, 'sessions']);
        Route::post('/mentorship/sessions',        [MentorshipController::class, 'createSession']);
        Route::post('/mentorship/sessions/{id}/complete', [MentorshipController::class, 'completeSession']);
        Route::get('/mentorship/requests/{requestId}/messages', [MentorshipController::class, 'messages']);
        Route::post('/mentorship/requests/{requestId}/messages', [MentorshipController::class, 'sendMessage']);
        Route::get('/mentorship/goals/{requestId}', [MentorshipController::class, 'goals']);
        Route::post('/mentorship/goals',           [MentorshipController::class, 'createGoal']);
        Route::patch('/mentorship/goals/{id}',     [MentorshipController::class, 'updateGoal']);
        Route::post('/mentorship/goals/{goalId}/action-points', [MentorshipController::class, 'addActionPoint']);
        Route::post('/mentorship/action-points/{id}/complete', [MentorshipController::class, 'completeActionPoint']);

        // AI (for students)
        Route::get('/ai/recommendations',         [AiController::class, 'recommendations']);
        Route::get('/ai/summarize/{moduleId}',    [AiController::class, 'summarizeModule']);

        // ── Admin-only routes ─────────────────────────────────────────────────
        Route::middleware('role:admin,pastor')->group(function () {

            // Dashboard & stats
            Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);
            Route::get('/admin/stats',     [AdminController::class, 'stats']);

            // Users
            Route::get('/admin/users',              [AdminController::class, 'users']);
            Route::get('/admin/users/{id}',         [AdminController::class, 'showUser']);
            Route::post('/admin/users',             [AdminController::class, 'createUser']);
            Route::patch('/admin/users/{id}',       [AdminController::class, 'updateUser']);
            Route::post('/admin/users/{id}/deactivate',  [AdminController::class, 'deactivateUser']);
            Route::post('/admin/users/{id}/reactivate',  [AdminController::class, 'reactivateUser']);
            Route::delete('/admin/users/{id}',           [AdminController::class, 'deleteUser']);

            // Courses
            Route::post('/courses',           [CourseController::class, 'store']);
            Route::patch('/courses/{id}',     [CourseController::class, 'update']);
            Route::delete('/courses/{id}',    [CourseController::class, 'destroy']);
            Route::post('/courses/{id}/thumbnail', [CourseController::class, 'uploadThumbnail']);

            // Modules
            Route::post('/courses/{courseId}/modules', [ModuleController::class, 'store']);
            Route::post('/modules/extract-content',    [ModuleController::class, 'extractContent']);
            Route::patch('/modules/{id}',              [ModuleController::class, 'update']);
            Route::delete('/modules/{id}',             [ModuleController::class, 'destroy']);
            Route::post('/modules/{id}/duplicate',     [ModuleController::class, 'duplicate']);
            Route::patch('/modules/{id}/reorder',      [ModuleController::class, 'reorder']);
            Route::post('/modules/{id}/material',      [ModuleController::class, 'uploadMaterial']);
            Route::get('/materials/{filename}',        [ModuleController::class, 'downloadMaterial']);

            // Exam question bank
            Route::get('/exams/bank/{moduleId}',        [ExamController::class, 'questionBank']);
            Route::post('/exams/questions',             [ExamController::class, 'storeQuestion']);
            Route::patch('/exams/questions/{id}',       [ExamController::class, 'updateQuestion']);
            Route::delete('/exams/questions/{id}',      [ExamController::class, 'destroyQuestion']);
            Route::post('/exams/questions/{id}/approve', [ExamController::class, 'approveQuestion']);
            Route::post('/exams/questions/{id}/reject',  [ExamController::class, 'rejectQuestion']);

            // AI admin tools
            Route::post('/ai/generate-questions',      [AiController::class, 'generateQuestions']);
            Route::post('/ai/generate-course',         [AiController::class, 'generateCourse']);

            // Certificates
            Route::post('/certificates/issue',         [CertificateController::class, 'issue']);

            // Community moderation
            Route::get('/admin/community/stats',           [AdminController::class, 'communityStats']);
            Route::get('/admin/community/pending',         [AdminController::class, 'pendingContent']);
            Route::post('/admin/community/posts/{id}/moderate', [AdminController::class, 'moderatePost']);
            Route::post('/admin/community/comments/{id}/moderate', [AdminController::class, 'moderateComment']);

            // Mentorship admin
            Route::get('/mentorship/pending-requests',     [MentorshipController::class, 'pendingRequests']);
            Route::post('/mentorship/requests/{id}/assign', [MentorshipController::class, 'assignMentor']);
            Route::get('/mentorship/all-sessions',         [MentorshipController::class, 'allSessions']);

            // Notifications (broadcast)
            Route::post('/notifications/broadcast',    [NotificationController::class, 'broadcast']);

            // Badges
            Route::get('/badges',            [AdminController::class, 'badges']);
            Route::post('/badges',           [AdminController::class, 'createBadge']);
            Route::patch('/badges/{id}',     [AdminController::class, 'updateBadge']);
            Route::delete('/badges/{id}',    [AdminController::class, 'deleteBadge']);

            // Audit & exception logs
            Route::get('/admin/audit-logs',        [AdminController::class, 'auditLogs']);
            Route::get('/admin/exception-logs',    [AdminController::class, 'exceptionLogs']);
            Route::post('/admin/exception-logs/{id}/resolve', [AdminController::class, 'resolveException']);
        });
    });
});
