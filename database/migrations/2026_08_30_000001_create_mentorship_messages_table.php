<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mentorship_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mentorship_request_id')->constrained('mentorship_requests')->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('dp_users')->cascadeOnDelete();
            $table->text('body');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['mentorship_request_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mentorship_messages');
    }
};
