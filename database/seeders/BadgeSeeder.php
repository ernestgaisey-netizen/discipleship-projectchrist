<?php

namespace Database\Seeders;

use App\Models\Badge;
use Illuminate\Database\Seeder;

class BadgeSeeder extends Seeder
{
    public function run(): void
    {
        $badges = [
            [
                'name'        => 'First Steps',
                'description' => 'Completed your first module',
                'icon'        => '👣',
                'color'       => '#2D7DD2',
                'criteria'    => 'Complete module 1 of any course',
            ],
            [
                'name'        => 'Scripture Scholar',
                'description' => 'Achieved a perfect score on an exam',
                'icon'        => '📖',
                'color'       => '#16A34A',
                'criteria'    => 'Score 100% on any exam',
            ],
            [
                'name'        => 'Faithful Student',
                'description' => 'Maintained a 7-day learning streak',
                'icon'        => '🔥',
                'color'       => '#F97316',
                'criteria'    => 'Log in and engage for 7 consecutive days',
            ],
            [
                'name'        => 'Course Graduate',
                'description' => 'Completed an entire course',
                'icon'        => '🎓',
                'color'       => '#7C3AED',
                'criteria'    => 'Complete all modules in a course',
            ],
            [
                'name'        => 'All Courses Completed',
                'description' => 'Completed all available courses',
                'icon'        => '🏆',
                'color'       => '#EAB308',
                'criteria'    => 'Complete every published course',
            ],
            [
                'name'        => 'Community Builder',
                'description' => 'Made 10 community contributions',
                'icon'        => '🤝',
                'color'       => '#0891B2',
                'criteria'    => 'Post 10 community interactions',
            ],
            [
                'name'        => 'Disciple Maker',
                'description' => 'Completed the Discipleship Foundations course',
                'icon'        => '✝️',
                'color'       => '#0D1F35',
                'criteria'    => 'Complete the Discipleship Foundations course',
            ],
        ];

        foreach ($badges as $badge) {
            Badge::firstOrCreate(['name' => $badge['name']], $badge);
        }

        $this->command->info('Badges seeded: ' . count($badges) . ' badges');
    }
}
