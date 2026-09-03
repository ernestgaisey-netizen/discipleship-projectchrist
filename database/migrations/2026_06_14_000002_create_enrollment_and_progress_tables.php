<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── ENROLLMENTS ────────────────────────────────────────────────────────
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('dp_users')->cascadeOnDelete();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->timestamp('enrolled_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->string('certificate_id')->nullable();
            $table->string('certificate_url', 500)->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'course_id']);
            $table->index('user_id');
            $table->index('course_id');
        });

        // ── MODULE PROGRESS ────────────────────────────────────────────────────
        Schema::create('module_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('dp_users')->cascadeOnDelete();
            $table->foreignId('module_id')->constrained('modules')->cascadeOnDelete();
            $table->enum('status', ['not_started', 'in_progress', 'completed'])->default('not_started');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->unsignedInteger('time_spent')->nullable()->comment('seconds');
            $table->text('notes_text')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'module_id']);
            $table->index('user_id');
        });

        // ── EXAM ATTEMPTS ──────────────────────────────────────────────────────
        Schema::create('exam_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('dp_users')->cascadeOnDelete();
            $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->unsignedTinyInteger('attempt_number')->default(1);
            $table->decimal('score', 5, 2)->default(0);
            $table->unsignedInteger('points_earned')->default(0);
            $table->unsignedInteger('points_total')->default(0);
            $table->boolean('passed')->default(false);
            $table->json('answers')->comment('{ questionId: answer }');
            $table->unsignedInteger('time_taken_secs')->nullable();
            $table->text('ai_grade_notes')->nullable();
            $table->timestamp('submitted_at')->useCurrent();
            $table->timestamps();

            $table->index(['user_id', 'exam_id']);
            $table->index('passed');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_attempts');
        Schema::dropIfExists('module_progress');
        Schema::dropIfExists('enrollments');
    }
};
