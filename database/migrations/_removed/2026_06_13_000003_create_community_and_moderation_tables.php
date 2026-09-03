<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('community_posts')) {
            Schema::create('community_posts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->string('title');
                $table->text('body')->nullable();
                $table->string('category')->default('general');
                $table->string('visibility')->default('public');
                $table->boolean('is_published')->default(true);
                $table->boolean('is_question')->default(false);
                $table->boolean('is_answered')->default(false);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('community_comments')) {
            Schema::create('community_comments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('post_id')->constrained('community_posts')->onDelete('cascade');
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->text('comment');
                $table->boolean('is_accepted')->default(false);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('community_likes')) {
            Schema::create('community_likes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('post_id')->constrained('community_posts')->onDelete('cascade');
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->timestamps();
                $table->unique(['post_id', 'user_id']);
            });
        }

        if (! Schema::hasTable('community_reports')) {
            Schema::create('community_reports', function (Blueprint $table) {
                $table->id();
                $table->foreignId('post_id')->constrained('community_posts')->onDelete('cascade');
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->string('reason');
                $table->text('details')->nullable();
                $table->string('status')->default('pending');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('community_reports');
        Schema::dropIfExists('community_likes');
        Schema::dropIfExists('community_comments');
        Schema::dropIfExists('community_posts');
    }
};
