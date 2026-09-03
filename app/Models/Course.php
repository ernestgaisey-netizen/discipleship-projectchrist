<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'subtitle', 'description', 'category', 'level',
        'duration_weeks', 'thumbnail_url', 'emoji', 'gradient', 'accent_color',
        'badge_name', 'objectives', 'target_audience', 'prerequisites',
        'instructor_name', 'intro_video_url', 'certificate_enabled',
        'is_published', 'order_index', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'objectives'          => 'array',
            'target_audience'     => 'array',
            'prerequisites'       => 'array',
            'certificate_enabled' => 'boolean',
            'is_published'        => 'boolean',
        ];
    }

    public function modules()
    {
        return $this->hasMany(Module::class)->orderBy('order_index');
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    public function badges()
    {
        return $this->hasMany(Badge::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function certificates()
    {
        return $this->hasMany(Certificate::class);
    }
}
