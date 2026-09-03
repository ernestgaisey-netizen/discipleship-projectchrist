<?php

namespace App\Console\Commands;

use App\Models\Exam;
use App\Models\ExamQuestion;
use Illuminate\Console\Command;

class TagQuestionTopics extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:tag-question-topics';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'One-off: give every untagged exam question a topic, defaulting to its module title. Leaves already-tagged questions untouched.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $exams = Exam::with('module')->get();
        $tagged = 0;

        foreach ($exams as $exam) {
            if (!$exam->module) continue;

            $count = ExamQuestion::where('exam_id', $exam->id)
                ->whereNull('topic')
                ->update(['topic' => $exam->module->title]);

            if ($count > 0) {
                $this->line("{$exam->module->title}: tagged {$count} question(s)");
                $tagged += $count;
            }
        }

        $this->info("Done. {$tagged} question(s) tagged.");
        $this->line('Note: this only sets the coarse module-title topic. For finer sub-topics '
            . '(e.g. specific sections of a lesson), tag individual questions via the admin question bank editor.');

        return self::SUCCESS;
    }
}
