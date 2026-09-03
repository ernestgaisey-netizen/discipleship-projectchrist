<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── MENTOR PROFILES ───────────────────────────────────────────────────
        Schema::create('mentor_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('dp_users')->cascadeOnDelete();
            $table->text('bio')->nullable();
            $table->json('expertise')->nullable()->comment('Array of expertise areas');
            $table->enum('availability_status', ['available', 'busy', 'unavailable'])->default('available');
            $table->enum('meeting_mode', ['online', 'in_person', 'both'])->default('online');
            $table->string('meeting_link', 500)->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            $table->foreign('approved_by')->references('id')->on('dp_users')->nullOnDelete();
        });

        // ── MENTORSHIP REQUESTS ───────────────────────────────────────────────
        Schema::create('mentorship_requests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('preferred_mentor_id')->nullable();
            $table->unsignedBigInteger('assigned_mentor_id')->nullable();
            $table->text('reason')->nullable();
            $table->text('learning_goals')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'active', 'completed'])->default('pending');
            $table->text('admin_notes')->nullable();
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->foreign('student_id')->references('id')->on('dp_users')->cascadeOnDelete();
            $table->foreign('preferred_mentor_id')->references('id')->on('dp_users')->nullOnDelete();
            $table->foreign('assigned_mentor_id')->references('id')->on('dp_users')->nullOnDelete();
            $table->foreign('reviewed_by')->references('id')->on('dp_users')->nullOnDelete();
        });

        // ── MENTORSHIP SESSIONS ───────────────────────────────────────────────
        Schema::create('mentorship_sessions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('mentor_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('mentorship_request_id')->nullable();
            $table->string('title');
            $table->text('notes')->nullable();
            $table->string('meeting_link', 500)->nullable();
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->foreign('mentor_id')->references('id')->on('dp_users')->cascadeOnDelete();
            $table->foreign('student_id')->references('id')->on('dp_users')->cascadeOnDelete();
            $table->foreign('mentorship_request_id')->references('id')->on('mentorship_requests')->nullOnDelete();
        });

        // ── MENTORSHIP GOALS ──────────────────────────────────────────────────
        Schema::create('mentorship_goals', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('mentor_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('status', ['active', 'completed', 'cancelled'])->default('active');
            $table->date('due_date')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->foreign('student_id')->references('id')->on('dp_users')->cascadeOnDelete();
            $table->foreign('mentor_id')->references('id')->on('dp_users')->cascadeOnDelete();
        });

        // ── MENTORSHIP ACTION POINTS ──────────────────────────────────────────
        Schema::create('mentorship_action_points', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mentorship_goal_id')->constrained('mentorship_goals')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->boolean('is_completed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mentorship_action_points');
        Schema::dropIfExists('mentorship_goals');
        Schema::dropIfExists('mentorship_sessions');
        Schema::dropIfExists('mentorship_requests');
        Schema::dropIfExists('mentor_profiles');
    }
};
