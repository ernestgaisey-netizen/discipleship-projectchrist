<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'audience', 'title', 'body', 'type', 'metadata', 'read_at',
    ];

    protected $appends = ['is_read'];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'read_at'  => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // `read_at` (nullable timestamp) is the real column — this exposes the
    // boolean the frontend expects without storing redundant state.
    protected function isRead(): Attribute
    {
        return Attribute::make(get: fn () => $this->read_at !== null);
    }
}
