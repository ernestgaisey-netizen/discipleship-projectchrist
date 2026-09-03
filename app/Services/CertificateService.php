<?php

namespace App\Services;

use App\Models\Certificate;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Str;

class CertificateService
{
    public static function issue(int $userId, int $courseId): ?Certificate
    {
        // Idempotent — don't duplicate
        $existing = Certificate::where('user_id', $userId)->where('course_id', $courseId)->first();
        if ($existing) return $existing;

        $user   = User::findOrFail($userId);
        $course = Course::findOrFail($courseId);

        if (!$course->certificate_enabled) return null;

        $code = strtoupper(Str::random(16));
        $issuedAt = now();

        $cert = Certificate::create([
            'user_id'          => $userId,
            'course_id'        => $courseId,
            'certificate_code' => $code,
            'issued_at'        => $issuedAt,
        ]);

        // Generate PDF
        try {
            $pdf = Pdf::loadView('certificates.disciplepath', [
                'student_name' => $user->name,
                'course_title' => $course->title,
                'issued_at'    => $issuedAt->format('F j, Y'),
                'cert_code'    => $code,
            ])->setPaper('a4', 'landscape');

            $filename  = "certificates/cert_{$code}.pdf";
            $path      = storage_path("app/public/{$filename}");
            $dir       = dirname($path);
            if (!is_dir($dir)) mkdir($dir, 0755, true);
            $pdf->save($path);

            $cert->update(['certificate_url' => "/storage/{$filename}"]);
        } catch (\Exception $e) {
            \App\Models\ExceptionLog::create([
                'source'  => 'certificate',
                'message' => $e->getMessage(),
                'user_id' => $userId,
            ]);
        }

        // Update enrollment record
        Enrollment::where('user_id', $userId)->where('course_id', $courseId)
            ->update(['certificate_id' => $code, 'certificate_url' => $cert->certificate_url]);

        // Notifications & badges
        NotificationService::certificateIssued($userId, $course->title, $code);
        BadgeService::awardForCourseCompletion($userId, $courseId);

        return $cert;
    }
}
