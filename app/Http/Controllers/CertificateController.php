<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Inertia\Inertia;

class CertificateController extends Controller
{
    public function download(Course $course)
    {
        $user = auth()->user();

        if (!$course->isCompletedBy($user)) {
            return back()->with('error', 'You must complete all lessons to download the certificate.');
        }

        $pdf = Pdf::loadView('certificates.course_completion', [
            'course' => $course,
            'user' => $user,
            'date' => now()->format('F j, Y'),
        ]);

        return $pdf->download('Certificate-' . $course->slug . '.pdf');
    }
}
