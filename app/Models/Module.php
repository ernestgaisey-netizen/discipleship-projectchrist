<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Module extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id', 'title', 'order_index', 'duration_minutes',
        'scripture_refs', 'content_html', 'content_text',
        'video_url', 'audio_url', 'material_url', 'material_path', 'is_published',
    ];

    protected function casts(): array
    {
        return [
            'scripture_refs' => 'array',
            'is_published'   => 'boolean',
        ];
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function exam()
    {
        return $this->hasOne(Exam::class);
    }

    public function progress()
    {
        return $this->hasMany(ModuleProgress::class);
    }

    public function previousModule(): ?self
    {
        return self::where('course_id', $this->course_id)
            ->where('order_index', $this->order_index - 1)
            ->first();
    }

    public function nextModule(): ?self
    {
        return self::where('course_id', $this->course_id)
            ->where('order_index', $this->order_index + 1)
            ->first();
    }

    // The module title plus any content-specific subheadings (h2/h3), minus generic
    // scaffolding labels like "Introduction" or "Application" that every module repeats
    // and that wouldn't mean anything as a shared "topic" across different lessons.
    // Used as the topic vocabulary for exam questions — both what AI generation is
    // asked to pick from, and the fallback topic for untagged existing questions.
    public function candidateTopics(): array
    {
        $generic = ['background', 'introduction', 'key notes', 'conclusion', 'questions', 'application', 'summary', 'overview'];

        preg_match_all('/<h[23][^>]*>(.*?)<\/h[23]>/is', $this->content_html ?? '', $matches);
        $subtitles = collect($matches[1] ?? [])
            ->map(fn ($h) => trim(strip_tags($h)))
            ->map(fn ($h) => preg_replace('/^module\s+\d+\s*:\s*/i', '', $h)) // "MODULE 1: X" → "X"
            ->filter(fn ($h) => $h !== ''
                && !in_array(mb_strtolower($h), $generic, true)
                && mb_strtolower($h) !== mb_strtolower($this->title))
            ->unique()
            ->values();

        return collect([$this->title])->merge($subtitles)->unique()->values()->all();
    }
}
