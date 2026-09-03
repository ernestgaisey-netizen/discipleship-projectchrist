<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mentorship_sessions', function (Blueprint $table) {
            $table->enum('status', ['scheduled', 'completed', 'cancelled'])
                  ->default('scheduled')
                  ->after('title');
            $table->text('description')->nullable()->after('status');
            $table->unsignedSmallInteger('duration_minutes')->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('mentorship_sessions', function (Blueprint $table) {
            $table->dropColumn(['status', 'description', 'duration_minutes']);
        });
    }
};
