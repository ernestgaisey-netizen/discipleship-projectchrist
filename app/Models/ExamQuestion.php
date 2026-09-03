<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExamQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_id', 'type', 'difficulty', 'topic', 'question_text', 'options', 'correct_answer',
        'explanation', 'points', 'order_index', 'ai_generated', 'status',
        'created_by', 'reviewed_by', 'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'options'        => 'array',
            'correct_answer' => 'array',
            'ai_generated'   => 'boolean',
            'reviewed_at'    => 'datetime',
        ];
    }

    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function withoutAnswer(): array
    {
        return [
            'id'          => $this->id,
            'type'        => $this->type,
            'question_text' => $this->question_text,
            'options'     => $this->options,
            'points'      => $this->points,
        ];
    }
}
