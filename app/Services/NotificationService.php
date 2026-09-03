<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    public static function send(
        int $userId,
        string $title,
        string $body = '',
        string $type = 'info',
        array $metadata = []
    ): Notification {
        return Notification::create([
            'user_id'  => $userId,
            'audience' => 'user',
            'title'    => $title,
            'body'     => $body,
            'type'     => $type,
            'metadata' => $metadata ?: null,
        ]);
    }

    public static function broadcast(
        string $title,
        string $body = '',
        string $type = 'announcement',
        string $audience = 'all',
        array $metadata = []
    ): Notification {
        return Notification::create([
            'user_id'  => null,
            'audience' => $audience,
            'title'    => $title,
            'body'     => $body,
            'type'     => $type,
            'metadata' => $metadata ?: null,
        ]);
    }

    public static function examPassed(int $userId, string $moduleTitle, string $courseTitle): void
    {
        self::send($userId, '🎉 Exam Passed!',
            "Congratulations! You passed the exam for \"{$moduleTitle}\" in {$courseTitle}.",
            'exam_passed'
        );
    }

    public static function moduleUnlocked(int $userId, string $moduleTitle): void
    {
        self::send($userId, '🔓 New Module Unlocked',
            "\"{$moduleTitle}\" is now available for you to study.",
            'module_unlocked'
        );
    }

    public static function courseCompleted(int $userId, string $courseTitle): void
    {
        self::send($userId, '🏆 Course Completed!',
            "You have completed \"{$courseTitle}\". Your certificate is ready.",
            'course_completed'
        );
    }

    public static function certificateIssued(int $userId, string $courseTitle, string $code): void
    {
        self::send($userId, '📜 Certificate Issued',
            "Your certificate for \"{$courseTitle}\" has been issued. Code: {$code}",
            'certificate_issued',
            ['certificate_code' => $code]
        );
    }

    public static function badgeAwarded(int $userId, string $badgeName): void
    {
        self::send($userId, '🏅 Badge Awarded',
            "You earned the \"{$badgeName}\" badge!",
            'badge_awarded'
        );
    }

    public static function mentorshipAssigned(int $studentId, string $mentorName): void
    {
        self::send($studentId, '👤 Mentor Assigned',
            "{$mentorName} has been assigned as your mentor.",
            'mentorship_assigned'
        );
    }

    public static function sessionReminder(int $userId, string $title, string $withName, \DateTimeInterface $scheduledAt): void
    {
        self::send($userId, '⏰ Upcoming Mentorship Session',
            "\"{$title}\" with {$withName} starts at " . $scheduledAt->format('g:i A') . '.',
            'session_reminder'
        );
    }

    public static function welcome(int $userId, string $name): void
    {
        self::send($userId, '✝️ Welcome to DisciplePath',
            "Welcome, {$name}! Begin your discipleship journey today.",
            'welcome'
        );
    }

    public static function postModerated(int $userId, string $title, bool $approved): void
    {
        self::send($userId,
            $approved ? '✅ Post Approved' : '❌ Post Rejected',
            $approved
                ? "Your post \"{$title}\" is now live in the community."
                : "Your post \"{$title}\" was not approved for the community feed.",
            $approved ? 'post_approved' : 'post_rejected'
        );
    }

    public static function commentModerated(int $userId, string $postTitle, bool $approved): void
    {
        self::send($userId,
            $approved ? '✅ Comment Approved' : '❌ Comment Rejected',
            $approved
                ? "Your comment on \"{$postTitle}\" is now visible."
                : "Your comment on \"{$postTitle}\" was not approved.",
            $approved ? 'comment_approved' : 'comment_rejected'
        );
    }

    public static function newReply(int $postAuthorId, string $postTitle, string $replierName): void
    {
        self::send($postAuthorId, '💬 New Reply',
            "{$replierName} replied to your post \"{$postTitle}\".",
            'community_reply'
        );
    }
}
