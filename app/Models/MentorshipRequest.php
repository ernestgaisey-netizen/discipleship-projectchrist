<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MentorshipRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id', 'preferred_mentor_id', 'assigned_mentor_id',
        'reason', 'learning_goals', 'status', 'admin_notes',
        'reviewed_by', 'reviewed_at', 'assigned_at',
    ];

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
            'assigned_at' => 'datetime',
        ];
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function preferredMentor()
    {
        return $this->belongsTo(User::class, 'preferred_mentor_id');
    }

    public function assignedMentor()
    {
        return $this->belongsTo(User::class, 'assigned_mentor_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function sessions()
    {
        return $this->hasMany(MentorshipSession::class, 'mentorship_request_id');
    }

    public function messages()
    {
        return $this->hasMany(MentorshipMessage::class, 'mentorship_request_id');
    }
}
