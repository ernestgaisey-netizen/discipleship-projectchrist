<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrolment;
use Illuminate\Http\Request;

class EnrolmentController extends Controller
{
    public function store(Request $request, Course $course)
    {
        // Check if already enrolled
        if ($course->enrolments()->where('user_id', auth()->id())->exists()) {
            return back()->with('error', 'Already enrolled');
        }

        Enrolment::create([
            'user_id' => auth()->id(),
            'course_id' => $course->id,
            'status' => 'active'
        ]);

        return redirect()->route('courses.show', $course)->with('success', 'Enrolled successfully');
    }
}
