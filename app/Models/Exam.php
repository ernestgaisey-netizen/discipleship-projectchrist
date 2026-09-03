<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Exam extends Model
{
    use HasFactory;

    protected $fillable = [
        'module_id', 'title', 'pass_mark', 'time_limit_secs',
        'max_attempts', 'randomize_qs', 'questions_per_session', 'show_answers', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'randomize_qs' => 'boolean',
            'show_answers' => 'boolean',
            'is_active'    => 'boolean',
        ];
    }

    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    public function questions()
    {
        return $this->hasMany(ExamQuestion::class)->orderBy('order_index');
    }

    public function approvedQuestions()
    {
        return $this->hasMany(ExamQuestion::class)->where('status', 'approved')->orderBy('order_index');
    }

    public function attempts()
    {
        return $this->hasMany(ExamAttempt::class);
    }
}
