<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_questions', function (Blueprint $table) {
            $table->enum('difficulty', ['easy', 'medium', 'hard'])->default('medium')->after('type');
            // Free-text topic tag within the exam's question bank. Questions that share a topic
            // are eligible to be picked as an adaptive follow-up to one another. Nullable because
            // existing questions aren't tagged yet — untagged questions just never trigger a
            // topic-based follow-up and fall back to the normal balanced pick.
            $table->string('topic', 100)->nullable()->after('difficulty');
        });
    }

    public function down(): void
    {
        Schema::table('exam_questions', function (Blueprint $table) {
            $table->dropColumn(['difficulty', 'topic']);
        });
    }
};
