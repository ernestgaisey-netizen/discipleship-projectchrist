<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            BadgeSeeder::class,
            CourseSeeder::class,
            ExamSeeder::class,
        ]);

        $this->command->info('DisciplePath seeded successfully.');
    }
}
