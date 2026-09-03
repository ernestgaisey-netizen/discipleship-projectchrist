<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MentorshipActionPoint extends Model
{
    use HasFactory;

    protected $fillable = [
        'mentorship_goal_id', 'title', 'description', 'is_completed', 'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'is_completed' => 'boolean',
            'completed_at' => 'datetime',
        ];
    }

    public function goal()
    {
        return $this->belongsTo(MentorshipGoal::class, 'mentorship_goal_id');
    }
}
