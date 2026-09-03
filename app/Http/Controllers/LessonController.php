<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Lesson;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LessonController extends Controller
{
    public function show(Course $course, CourseSection $section, Lesson $lesson)
    {
        // Check enrolment or access policy
        // User must be enrolled or lesson free

        return Inertia::render('Lesson/Show', [
            'course' => $course,
            'lesson' => $lesson,
            'isCompleted' => auth()->check() ? auth()->user()->completedLessons()->where('lesson_id', $lesson->id)->exists() : false,
            'previous' => $section->lessons()->where('order', '<', $lesson->order)->orderBy('order', 'desc')->first(),
            'next' => $section->lessons()->where('order', '>', $lesson->order)->orderBy('order')->first(),
        ]);
    }

    public function complete(Request $request, Lesson $lesson)
    {
        // Mark lesson complete for user
        auth()->user()->completedLessons()->syncWithoutDetaching([$lesson->id => ['completed_at' => now()]]);
        return back();
    }

    public function store(Request $request, Course $course, CourseSection $section)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:video,text,pdf',
            'content' => 'nullable|string', // For text
            'video_url' => 'nullable|url', // For video
            'file' => 'nullable|file|mimes:pdf,mp4,mov,avi|max:51200', // 50MB max
            'is_free' => 'boolean'
        ]);

        $data = [
            'course_section_id' => $section->id,
            'title' => $validated['title'],
            'type' => $validated['type'],
            'content' => $validated['content'] ?? null,
            'video_url' => $validated['video_url'] ?? null,
            'is_free' => $request->boolean('is_free', false),
            'order' => $section->lessons()->max('order') + 1,
            'slug' => \Illuminate\Support\Str::slug($validated['title']) . '-' . uniqid(),
        ];

        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('course_content', 'public');
            if ($validated['type'] === 'pdf') {
                $data['file_path'] = '/storage/' . $path;
            }
            // If we supported hosting video files locally, we'd map it here too.
            // For now, video_url is mainly for embeds, but let's allow local video too if needed.
        }

        Lesson::create($data);

        return back()->with('success', 'Lesson created successfully.');
    }

    public function update(Request $request, Course $course, CourseSection $section, Lesson $lesson)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:video,text,pdf',
            'content' => 'nullable|string',
            'video_url' => 'nullable|url',
            'is_free' => 'boolean'
        ]);

        $lesson->update([
            'title' => $validated['title'],
            'type' => $validated['type'],
            'content' => $validated['content'] ?? null,
            'video_url' => $validated['video_url'] ?? null,
            'is_free' => $request->boolean('is_free', false),
        ]);

        return back()->with('success', 'Lesson updated successfully.');
    }

    public function destroy(Course $course, CourseSection $section, Lesson $lesson)
    {
        $lesson->delete();
        return back()->with('success', 'Lesson deleted.');
    }
}
