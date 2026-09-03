<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── COMMUNITY POSTS ───────────────────────────────────────────────────
        Schema::create('community_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('dp_users')->cascadeOnDelete();
            $table->string('title');
            $table->text('body');
            $table->enum('category', ['general', 'question', 'discussion', 'announcement', 'resource', 'prayer', 'testimony'])->default('general');
            $table->enum('status', ['pending', 'approved', 'rejected', 'hidden'])->default('approved');
            $table->enum('visibility', ['public', 'members'])->default('members');
            $table->unsignedBigInteger('accepted_comment_id')->nullable();
            $table->boolean('is_pinned')->default(false);
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index('category');
        });

        // ── COMMUNITY COMMENTS ─────────────────────────────────────────────────
        Schema::create('community_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained('community_posts')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('dp_users')->cascadeOnDelete();
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->text('body');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('approved');
            $table->boolean('is_accepted')->default(false);
            $table->timestamps();

            $table->foreign('parent_id')->references('id')->on('community_comments')->nullOnDelete();
            $table->index('post_id');
        });

        // ── COMMUNITY LIKES (polymorphic — posts & comments) ───────────────────
        Schema::create('community_likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('dp_users')->cascadeOnDelete();
            $table->morphs('likeable'); // likeable_type + likeable_id
            $table->timestamps();

            $table->unique(['user_id', 'likeable_type', 'likeable_id']);
        });

        // ── COMMUNITY REPORTS (polymorphic) ───────────────────────────────────
        Schema::create('community_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('dp_users')->cascadeOnDelete();
            $table->morphs('reportable'); // reportable_type + reportable_id
            $table->string('reason', 500)->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'reportable_type', 'reportable_id']);
        });

        // Add foreign key constraint after community_comments table exists
        Schema::table('community_posts', function (Blueprint $table) {
            $table->foreign('accepted_comment_id')->references('id')->on('community_comments')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('community_posts', function (Blueprint $table) {
            $table->dropForeign(['accepted_comment_id']);
        });
        Schema::dropIfExists('community_reports');
        Schema::dropIfExists('community_likes');
        Schema::dropIfExists('community_comments');
        Schema::dropIfExists('community_posts');
    }
};
