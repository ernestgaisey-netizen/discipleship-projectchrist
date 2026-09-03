<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExamAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'exam_id', 'attempt_number', 'score',
        'points_earned', 'points_total', 'passed', 'answers',
        'time_taken_secs', 'ai_grade_notes', 'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'passed'       => 'boolean',
            'answers'      => 'array',
            'submitted_at' => 'datetime',
            'score'        => 'decimal:2',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }
}
