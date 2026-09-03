<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── AUDIT LOGS ─────────────────────────────────────────────────────────
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('action', 80);
            $table->text('description')->nullable();
            $table->string('severity', 20)->default('info')->comment('info|warning|critical');
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('dp_users')->nullOnDelete();
            $table->index(['action', 'created_at']);
            $table->index('user_id');
        });

        // ── EXCEPTION LOGS ────────────────────────────────────────────────────
        Schema::create('exception_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('severity', 20)->default('error');
            $table->string('source', 50)->default('api')->comment('api|ai|email|upload|frontend');
            $table->text('message');
            $table->longText('stack_trace')->nullable();
            $table->string('url', 500)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('dp_users')->nullOnDelete();
            $table->index(['severity', 'created_at']);
        });

        // password_reset_tokens, cache, cache_locks, jobs, job_batches,
        // failed_jobs, sessions are all created by 0001_01_01_000000–000002.
    }

    public function down(): void
    {
        Schema::dropIfExists('exception_logs');
        Schema::dropIfExists('audit_logs');
    }
};
