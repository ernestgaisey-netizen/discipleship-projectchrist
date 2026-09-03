<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * DisciplePath Core Schema — Users, Courses, Modules, Exams, Questions
 * Run: php artisan migrate:fresh --seed
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── USERS ──────────────────────────────────────────────────────────────
        Schema::create('dp_users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->enum('role', ['student', 'admin', 'pastor', 'mentor'])->default('student');
            $table->string('sub_role')->nullable()->comment('super_admin|user_admin|content_admin|course_admin|community_admin|mentor_admin');
            $table->string('avatar_url', 500)->nullable();
            $table->string('phone', 30)->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('mfa_enabled')->default(false);
            $table->string('mfa_secret')->nullable();
            $table->unsignedInteger('streak_days')->default(0);
            $table->timestamp('last_active_at')->nullable();
            $table->rememberToken();
            $table->timestamps();

            $table->index('role');
            $table->index('is_active');
        });

        // ── PERSONAL ACCESS TOKENS (Sanctum) ──────────────────────────────────
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        // ── COURSES ────────────────────────────────────────────────────────────
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('subtitle', 500)->nullable();
            $table->text('description')->nullable();
            $table->string('category', 100)->nullable();
            $table->enum('level', ['beginner', 'intermediate', 'advanced'])->default('beginner');
            $table->unsignedInteger('duration_weeks')->default(4);
            $table->string('thumbnail_url', 500)->nullable();
            $table->string('emoji', 10)->nullable()->default('📖');
            $table->string('gradient', 255)->nullable();
            $table->string('accent_color', 20)->nullable();
            $table->string('badge_name', 255)->nullable();
            $table->json('objectives')->nullable();
            $table->json('target_audience')->nullable();
            $table->json('prerequisites')->nullable();
            $table->string('instructor_name', 255)->nullable();
            $table->string('intro_video_url', 500)->nullable();
            $table->boolean('certificate_enabled')->default(true);
            $table->boolean('is_published')->default(false);
            $table->unsignedInteger('order_index')->default(0);
            $table->unsignedBigInteger('created_by');
            $table->timestamps();

            $table->foreign('created_by')->references('id')->on('dp_users');
            $table->index('is_published');
            $table->index('order_index');
            // Fulltext index — MySQL/MariaDB only (SQLite skips this)
            if (DB::getDriverName() !== 'sqlite') {
                $table->fullText(['title', 'description'], 'ft_courses_search');
            }
        });

        // ── MODULES ────────────────────────────────────────────────────────────
        Schema::create('modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->string('title');
            $table->unsignedInteger('order_index')->default(1);
            $table->unsignedInteger('duration_minutes')->default(30);
            $table->json('scripture_refs')->nullable()->comment('Array of Bible references');
            $table->longText('content_html')->nullable();
            $table->longText('content_text')->nullable();
            $table->string('video_url', 500)->nullable();
            $table->string('audio_url', 500)->nullable();
            $table->string('material_url', 500)->nullable()->comment('Public URL if stored publicly');
            $table->string('material_path', 500)->nullable()->comment('Private storage path');
            $table->boolean('is_published')->default(false);
            $table->timestamps();

            $table->index('course_id');
            $table->index(['course_id', 'order_index']);
        });

        // ── EXAMS ──────────────────────────────────────────────────────────────
        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->unique()->constrained('modules')->cascadeOnDelete();
            $table->string('title')->nullable();
            $table->unsignedTinyInteger('pass_mark')->default(70)->comment('Percentage 0-100');
            $table->unsignedInteger('time_limit_secs')->default(600);
            $table->unsignedTinyInteger('max_attempts')->default(3)->comment('0 = unlimited');
            $table->boolean('randomize_qs')->default(true);
            $table->boolean('show_answers')->default(true)->comment('Show correct answers after submit');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // ── EXAM QUESTIONS ─────────────────────────────────────────────────────
        Schema::create('exam_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->enum('type', ['mcq', 'true_false', 'short_answer'])->default('mcq');
            $table->text('question_text');
            $table->json('options')->nullable()->comment('MCQ options array');
            $table->json('correct_answer')->comment('Index for MCQ, bool for TF, keywords[] for short');
            $table->text('explanation')->nullable();
            $table->unsignedTinyInteger('points')->default(1);
            $table->unsignedInteger('order_index')->default(0);
            $table->boolean('ai_generated')->default(false);
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('approved');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->foreign('created_by')->references('id')->on('dp_users')->nullOnDelete();
            $table->foreign('reviewed_by')->references('id')->on('dp_users')->nullOnDelete();
            $table->index('exam_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_questions');
        Schema::dropIfExists('exams');
        Schema::dropIfExists('modules');
        Schema::dropIfExists('courses');
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('dp_users');
    }
};
