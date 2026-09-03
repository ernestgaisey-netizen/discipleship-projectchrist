<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MentorshipSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'mentor_id', 'student_id', 'mentorship_request_id',
        'title', 'status', 'description', 'duration_minutes',
        'notes', 'meeting_link', 'scheduled_at', 'completed_at', 'reminder_sent_at',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at'     => 'datetime',
            'completed_at'     => 'datetime',
            'reminder_sent_at' => 'datetime',
        ];
    }

    public function mentor()
    {
        return $this->belongsTo(User::class, 'mentor_id');
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function request()
    {
        return $this->belongsTo(MentorshipRequest::class, 'mentorship_request_id');
    }
}
