<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MentorshipGoal extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id', 'mentor_id', 'title', 'description',
        'status', 'due_date', 'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'due_date'     => 'date',
            'completed_at' => 'datetime',
        ];
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function mentor()
    {
        return $this->belongsTo(User::class, 'mentor_id');
    }

    public function actionPoints()
    {
        return $this->hasMany(MentorshipActionPoint::class, 'mentorship_goal_id');
    }
}
