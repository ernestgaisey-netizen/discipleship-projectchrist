<?php

namespace Database\Seeders;

use App\Models\MentorProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Passwords: use environment variables when set, otherwise generate random
        // After deployment, change all passwords immediately via /profile → Security
        $adminPw   = env('SEED_ADMIN_PASSWORD',   Str::random(16) . '!A1');
        $contentPw = env('SEED_CONTENT_PASSWORD',  Str::random(16) . '!C1');
        $mentorPw  = env('SEED_MENTOR_PASSWORD',   Str::random(16) . '!M1');
        $studentPw = env('SEED_STUDENT_PASSWORD',  Str::random(16) . '!S1');

        User::firstOrCreate(['email' => 'admin@projectchrist.org'], [
            'name'              => 'System Administrator',
            'password'          => Hash::make($adminPw),
            'role'              => 'admin',
            'sub_role'          => 'super_admin',
            'is_active'         => true,
            'email_verified_at' => now(),
        ]);

        User::firstOrCreate(['email' => 'content@projectchrist.org'], [
            'name'              => 'Content Manager',
            'password'          => Hash::make($contentPw),
            'role'              => 'admin',
            'sub_role'          => 'content_admin',
            'is_active'         => true,
            'email_verified_at' => now(),
        ]);

        $mentor = User::firstOrCreate(['email' => 'mentor@projectchrist.org'], [
            'name'              => 'Pastor Emmanuel',
            'password'          => Hash::make($mentorPw),
            'role'              => 'mentor',
            'is_active'         => true,
            'email_verified_at' => now(),
        ]);

        MentorProfile::firstOrCreate(['user_id' => $mentor->id], [
            'bio'                  => 'Pastor and discipleship coach with over 15 years of experience walking alongside new believers.',
            'expertise'            => ['Prayer & Devotion', 'Marriage & Family', 'Discipleship Foundations'],
            'availability_status'  => 'available',
            'meeting_mode'         => 'online',
            'status'               => 'approved',
            'approved_at'          => now(),
        ]);

        User::firstOrCreate(['email' => 'student@projectchrist.org'], [
            'name'              => 'John Believer',
            'password'          => Hash::make($studentPw),
            'role'              => 'student',
            'is_active'         => true,
            'email_verified_at' => now(),
            'streak_days'        => 7,
        ]);

        $this->command->info('Users seeded: 1 super-admin, 1 content-admin, 1 mentor, 1 student');
        $this->command->warn('⚠ Set SEED_*_PASSWORD in .env before seeding on production, then change all passwords after first login.');
    }
}
