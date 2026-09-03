<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseSection;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class CourseController extends Controller
{
    // List all courses (Catalog)
    public function index()
    {
        $courses = Course::where('is_published', true)->get();
        return Inertia::render('Course/Index', [
            'courses' => $courses,
            'canCreate' => auth()->user()?->hasRole(['admin', 'instructor'])
        ]);
    }

    // Show single course (Enrolled view or preview)
    public function show(Course $course)
    {
        $course->load(['sections.lessons']);

        return Inertia::render('Course/Show', [
            'course' => $course,
            'canAccess' => auth()->user()->can('view', $course),
            'canDownloadCertificate' => auth()->user() ? $course->isCompletedBy(auth()->user()) : false,
        ]);
    }

    // Instructor: Create Course
    public function create()
    {
        return Inertia::render('Course/Create');
    }

    // Instructor: Store Course
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'thumbnail' => 'nullable|image|max:2048', // 2MB max
        ]);

        $thumbnailPath = null;
        if ($request->hasFile('thumbnail')) {
            $thumbnailPath = '/storage/' . $request->file('thumbnail')->store('thumbnails', 'public');
        }

        $course = auth()->user()->courses()->create([
            'title' => $validated['title'],
            'slug' => Str::slug($validated['title']) . '-' . uniqid(),
            'description' => $validated['description'],
            'price' => $validated['price'] ?? 0.00,
            'thumbnail' => $thumbnailPath,
        ]);

        return redirect()->route('courses.edit', $course);
    }

    public function edit(Course $course)
    {
        $course->load('sections.lessons');
        return Inertia::render('Course/Edit', [
            'course' => $course
        ]);
    }

    public function update(Request $request, Course $course)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'thumbnail' => 'nullable|image|max:2048',
            'is_published' => 'boolean'
        ]);

        if ($request->hasFile('thumbnail')) {
            $validated['thumbnail'] = '/storage/' . $request->file('thumbnail')->store('thumbnails', 'public');
        }

        $course->update($validated);
        return back();
    }
}
