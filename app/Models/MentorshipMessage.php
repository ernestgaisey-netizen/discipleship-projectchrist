<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MentorshipMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'mentorship_request_id', 'sender_id', 'body', 'read_at',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function request()
    {
        return $this->belongsTo(MentorshipRequest::class, 'mentorship_request_id');
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
