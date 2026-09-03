<?php

namespace App\Services;

use App\Models\Badge;
use App\Models\UserBadge;

class BadgeService
{
    public static function awardForCourseCompletion(int $userId, int $courseId): void
    {
        // Award course-specific badge if one exists
        $badge = Badge::where('course_id', $courseId)->first();
        if ($badge) {
            self::award($userId, $badge->id, $badge->name);
        }

        // Award all-courses badge if every published course is completed
        $totalPublished = \App\Models\Course::where('is_published', true)->count();
        $completed = \App\Models\Enrollment::where('user_id', $userId)
            ->whereNotNull('completed_at')->count();

        if ($completed >= $totalPublished && $totalPublished > 0) {
            $allBadge = Badge::where('name', 'All Courses Completed')->first();
            if ($allBadge) {
                self::award($userId, $allBadge->id, $allBadge->name);
            }
        }
    }

    public static function awardForModuleCompletion(int $userId): void
    {
        $firstModuleCompleted = \App\Models\ModuleProgress::where('user_id', $userId)
            ->where('status', 'completed')->count() === 1;

        if ($firstModuleCompleted) {
            $badge = Badge::where('name', 'First Steps')->first();
            if ($badge) {
                self::award($userId, $badge->id, $badge->name);
            }
        }
    }

    public static function awardForPerfectScore(int $userId): void
    {
        $badge = Badge::where('name', 'Scripture Scholar')->first();
        if ($badge) {
            self::award($userId, $badge->id, $badge->name);
        }
    }

    public static function awardForStreak(int $userId, int $days): void
    {
        if ($days >= 7) {
            $badge = Badge::where('name', 'Faithful Student')->first();
            if ($badge) {
                self::award($userId, $badge->id, $badge->name);
            }
        }
    }

    public static function awardForCommunityContributions(int $userId, int $count): void
    {
        if ($count >= 10) {
            $badge = Badge::where('name', 'Community Builder')->first();
            if ($badge) {
                self::award($userId, $badge->id, $badge->name);
            }
        }
    }

    private static function award(int $userId, int $badgeId, string $badgeName): void
    {
        $exists = UserBadge::where('user_id', $userId)->where('badge_id', $badgeId)->exists();
        if (!$exists) {
            UserBadge::create([
                'user_id'    => $userId,
                'badge_id'   => $badgeId,
                'awarded_at' => now(),
            ]);
            NotificationService::badgeAwarded($userId, $badgeName);
        }
    }
}
