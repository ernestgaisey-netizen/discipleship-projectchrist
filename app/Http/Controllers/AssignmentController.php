<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AssignmentController extends Controller
{
    public function show(Course $course, Assignment $assignment)
    {
        $submission = AssignmentSubmission::where('assignment_id', $assignment->id)
            ->where('user_id', auth()->id())
            ->first();

        return Inertia::render('Assignment/Show', [
            'course' => $course,
            'assignment' => $assignment,
            'submission' => $submission
        ]);
    }

    public function submit(Request $request, Assignment $assignment)
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf,doc,docx,zip|max:2048',
            'notes' => 'nullable|string'
        ]);

        $path = $request->file('file')->store('submissions');

        AssignmentSubmission::updateOrCreate(
            ['assignment_id' => $assignment->id, 'user_id' => auth()->id()],
            [
                'file_path' => $path,
                'notes' => $request->notes,
                'graded_at' => null // Reset grade on new submission
            ]
        );

        return back()->with('success', 'Assignment submitted successfully.');
    }
}
