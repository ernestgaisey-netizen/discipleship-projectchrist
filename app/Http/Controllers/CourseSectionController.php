<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseSection;
use Illuminate\Http\Request;

class CourseSectionController extends Controller
{
    public function store(Request $request, Course $course)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
        ]);

        $course->sections()->create([
            'title' => $validated['title'],
            'order' => $course->sections()->max('order') + 1
        ]);

        return back()->with('success', 'Section created successfully.');
    }

    public function update(Request $request, Course $course, CourseSection $section)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
        ]);

        $section->update($validated);

        return back()->with('success', 'Section updated successfully.');
    }

    public function destroy(Course $course, CourseSection $section)
    {
        $section->delete();
        return back()->with('success', 'Section deleted successfully.');
    }
}
