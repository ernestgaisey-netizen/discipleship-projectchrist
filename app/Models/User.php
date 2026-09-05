<?php

namespace App\Models;

use Illuminate\Auth\Notifications\ResetPassword as ResetPasswordNotification;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'dp_users';

    protected $fillable = [
        'name', 'email', 'password', 'role', 'sub_role',
        'avatar_url', 'phone', 'email_verified_at', 'is_active',
        'mfa_enabled', 'mfa_secret', 'streak_days', 'last_active_at',
    ];

    protected $hidden = [
        'password', 'remember_token', 'mfa_secret',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_active_at'    => 'datetime',
            'password'          => 'hashed',
            'is_active'         => 'boolean',
            'mfa_enabled'       => 'boolean',
        ];
    }

    // Consecutive-day activity streak. Called on every successful login. Same
    // calendar day as last_active_at: no change (already counted today).
    // Exactly one day later: streak continues. Any bigger gap (or first-ever
    // login): streak resets to 1.
    public function recordDailyActivity(): void
    {
        $today    = now()->toDateString();
        $lastDate = $this->last_active_at?->toDateString();

        if ($lastDate !== $today) {
            $wasYesterday = $lastDate === now()->subDay()->toDateString();
            $this->streak_days = $wasYesterday ? $this->streak_days + 1 : 1;
        }

        $this->last_active_at = now();
        $this->save();
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    public function moduleProgress()
    {
        return $this->hasMany(ModuleProgress::class);
    }

    public function examAttempts()
    {
        return $this->hasMany(ExamAttempt::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }

    public function communityPosts()
    {
        return $this->hasMany(CommunityPost::class);
    }

    public function communityComments()
    {
        return $this->hasMany(CommunityComment::class);
    }

    public function mentorProfile()
    {
        return $this->hasOne(MentorProfile::class);
    }

    public function mentorshipRequestsAsStudent()
    {
        return $this->hasMany(MentorshipRequest::class, 'student_id');
    }

    public function mentorshipSessionsAsMentor()
    {
        return $this->hasMany(MentorshipSession::class, 'mentor_id');
    }

    public function mentorshipSessionsAsStudent()
    {
        return $this->hasMany(MentorshipSession::class, 'student_id');
    }

    public function badges()
    {
        return $this->belongsToMany(Badge::class, 'user_badges')
            ->withPivot('awarded_at')->withTimestamps();
    }

    public function certificates()
    {
        return $this->hasMany(Certificate::class);
    }

    public function sendPasswordResetNotification($token): void
    {
        $url = rtrim(config('app.url'), '/') . '/reset-password'
             . '?token=' . $token
             . '&email=' . urlencode($this->email);

        // Point the reset link at the React SPA instead of a Laravel blade route.
        ResetPasswordNotification::createUrlUsing(fn () => $url);

        $this->notify(new ResetPasswordNotification($token));
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'admin' && $this->sub_role === 'super_admin';
    }

    public function isMentor(): bool
    {
        return $this->role === 'mentor';
    }

    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }

    public function canManageContent(): bool
    {
        if ($this->role !== 'admin') return false;
        return in_array($this->sub_role, ['super_admin', 'content_admin', 'course_admin']);
    }
}
