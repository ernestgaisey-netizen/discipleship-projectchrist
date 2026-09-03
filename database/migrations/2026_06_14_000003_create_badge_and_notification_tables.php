<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── BADGES ────────────────────────────────────────────────────────────
        Schema::create('badges', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('description', 500)->nullable();
            $table->string('icon', 10)->default('🏅');
            $table->string('color', 20)->default('#1B4F8A');
            $table->foreignId('course_id')->nullable()->constrained('courses')->nullOnDelete();
            $table->string('criteria', 500)->nullable();
            $table->timestamps();
        });

        // ── USER BADGES ────────────────────────────────────────────────────────
        Schema::create('user_badges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('dp_users')->cascadeOnDelete();
            $table->foreignId('badge_id')->constrained('badges')->cascadeOnDelete();
            $table->timestamp('awarded_at')->useCurrent();
            $table->timestamps();

            $table->unique(['user_id', 'badge_id']);
        });

        // ── NOTIFICATIONS ──────────────────────────────────────────────────────
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable()->comment('NULL = broadcast to all');
            $table->string('audience', 50)->default('user')->comment('user|all|role:student|etc.');
            $table->string('title');
            $table->text('body')->nullable();
            $table->string('type', 80)->default('info');
            $table->json('metadata')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('dp_users')->nullOnDelete();
            $table->index(['user_id', 'read_at']);
        });

        // ── CERTIFICATES ──────────────────────────────────────────────────────
        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('dp_users')->cascadeOnDelete();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->string('certificate_code', 32)->unique();
            $table->timestamp('issued_at')->useCurrent();
            $table->string('certificate_url', 500)->nullable();
            $table->timestamps();

            $table->index('certificate_code');
            $table->unique(['user_id', 'course_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificates');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('user_badges');
        Schema::dropIfExists('badges');
    }
};
