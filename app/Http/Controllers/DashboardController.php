<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Course;

class DashboardController extends Controller
{
    public function index()
    {
        $enrolledCourses = auth()->user()->enrolments()->with('course')->get()
            ->map(function ($enrolment) {
                $enrolment->course->is_completed = $enrolment->course->isCompletedBy(auth()->user());
                return $enrolment;
            });

        $createdCourses = [];
        if (auth()->user()->hasRole(['admin', 'instructor'])) {
            $createdCourses = Course::where('user_id', auth()->id())->get();
        }

        return Inertia::render('Dashboard', [
            'enrolledCourses' => $enrolledCourses,
            'createdCourses' => $createdCourses
        ]);
    }
}
