<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mentorship_requests', function (Blueprint $table) {
            $table->timestamp('assigned_at')->nullable()->after('assigned_mentor_id');
        });
    }

    public function down(): void
    {
        Schema::table('mentorship_requests', function (Blueprint $table) {
            $table->dropColumn('assigned_at');
        });
    }
};
