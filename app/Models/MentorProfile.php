<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MentorProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'bio', 'expertise', 'availability_status',
        'meeting_mode', 'meeting_link', 'status', 'approved_by', 'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'expertise'   => 'array',
            'approved_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function isAvailable(): bool
    {
        return $this->availability_status === 'available' && $this->status === 'approved';
    }
}
