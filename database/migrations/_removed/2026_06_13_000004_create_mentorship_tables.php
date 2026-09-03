<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('mentor_profiles')) {
            Schema::create('mentor_profiles', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->text('bio')->nullable();
                $table->string('expertise')->nullable();
                $table->string('availability_status')->default('available');
                $table->string('meeting_mode')->nullable();
                $table->string('meeting_link')->nullable();
                $table->json('skills')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('mentorship_requests')) {
            Schema::create('mentorship_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
                $table->foreignId('mentor_id')->nullable()->constrained('users')->onDelete('set null');
                $table->string('status')->default('pending');
                $table->text('goals')->nullable();
                $table->text('reason')->nullable();
                $table->text('admin_notes')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('mentorship_sessions')) {
            Schema::create('mentorship_sessions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('request_id')->constrained('mentorship_requests')->onDelete('cascade');
                $table->foreignId('mentor_id')->constrained('users')->onDelete('cascade');
                $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
                $table->timestamp('scheduled_at')->nullable();
                $table->string('status')->default('scheduled');
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('mentorship_goals')) {
            Schema::create('mentorship_goals', function (Blueprint $table) {
                $table->id();
                $table->foreignId('request_id')->constrained('mentorship_requests')->onDelete('cascade');
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('status')->default('open');
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('mentorship_action_points')) {
            Schema::create('mentorship_action_points', function (Blueprint $table) {
                $table->id();
                $table->foreignId('goal_id')->constrained('mentorship_goals')->onDelete('cascade');
                $table->string('title');
                $table->text('description')->nullable();
                $table->boolean('is_completed')->default(false);
                $table->timestamps();
            });
        }
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
