<?php

namespace App\Services;

use App\Models\Enrollment;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\Module;
use App\Models\ModuleProgress;

class ExamGradingService
{
    private AnthropicService $ai;

    public function __construct(AnthropicService $ai)
    {
        $this->ai = $ai;
    }

    /**
     * Grade the submitted exam and handle all downstream effects.
     */
    public function grade(Exam $exam, int $userId, array $answers, ?int $timeTaken = null, ?array $questionIds = null): array
    {
        // Only grade the specific questions that were shown this session.
        // This prevents the 10-of-30 bank issue where unseen questions score 0.
        $allQuestions = $exam->approvedQuestions()->get();
        $questions    = $questionIds
            ? $allQuestions->whereIn('id', $questionIds)->values()
            : $allQuestions;

        $totalPoints  = 0;
        $earnedPoints = 0;
        $feedback     = [];

        foreach ($questions as $q) {
            $totalPoints += $q->points;
            $userAnswer  = $answers[$q->id] ?? $answers[(string) $q->id] ?? null;
            $correct     = $q->correct_answer;
            $isCorrect   = false;
            $scoreRatio  = 0.0;
            $aiNote      = null;

            switch ($q->type) {
                case 'mcq':
                    // correct_answer stored as [index] or just the index value
                    $correctIndex = is_array($correct) ? ($correct[0] ?? $correct) : $correct;
                    $isCorrect    = (int) $userAnswer === (int) $correctIndex;
                    $scoreRatio   = $isCorrect ? 1.0 : 0.0;
                    break;

                case 'true_false':
                    $correctBool = is_array($correct) ? ($correct[0] ?? $correct) : $correct;
                    $userBool    = filter_var($userAnswer, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                    $isCorrect   = $userBool === (bool) $correctBool;
                    $scoreRatio  = $isCorrect ? 1.0 : 0.0;
                    break;

                case 'short_answer':
                    $keywords    = is_array($correct) ? $correct : [$correct];
                    $answerText  = (string) ($userAnswer ?? '');
                    $gradeResult = $this->ai->gradeShortAnswer($q->question_text, $keywords, $answerText);
                    $scoreRatio  = $gradeResult['score'] ?? 0.0;
                    $isCorrect   = $scoreRatio >= 0.7;
                    $aiNote      = $gradeResult['note'] ?? null;
                    break;
            }

            $earned = round($q->points * $scoreRatio);
            $earnedPoints += $earned;

            // No per-question feedback sent back — students retake blind.
            // Store ai_note internally if needed for future review features.
            $feedbackItem = ['question_id' => $q->id];

            $feedback[] = $feedbackItem;
        }

        $score        = $totalPoints > 0 ? round(($earnedPoints / $totalPoints) * 100, 2) : 0;
        $passed       = $score >= $exam->pass_mark;
        $attemptCount = ExamAttempt::where('user_id', $userId)->where('exam_id', $exam->id)->count();
        $attemptNumber = $attemptCount + 1;

        // Save attempt
        ExamAttempt::create([
            'user_id'        => $userId,
            'exam_id'        => $exam->id,
            'attempt_number' => $attemptNumber,
            'score'          => $score,
            'points_earned'  => $earnedPoints,
            'points_total'   => $totalPoints,
            'passed'         => $passed,
            'answers'        => $answers,
            'time_taken_secs' => $timeTaken,
            'submitted_at'   => now(),
        ]);

        $nextModuleUnlocked = false;
        $courseCompleted    = false;

        if ($passed) {
            $nextModuleUnlocked = $this->processPass($exam, $userId);
            $courseCompleted    = $this->checkCourseCompletion($exam->module, $userId);

            // Award perfect score badge
            if ($score == 100) {
                BadgeService::awardForPerfectScore($userId);
            }

            // Notifications
            $module = $exam->module;
            NotificationService::examPassed($userId, $module->title, $module->course->title ?? '');

            if ($nextModuleUnlocked) {
                $next = $module->nextModule();
                if ($next) {
                    NotificationService::moduleUnlocked($userId, $next->title);
                }
            }

            if ($courseCompleted) {
                $course = $module->course;
                NotificationService::courseCompleted($userId, $course->title);
                if ($course->certificate_enabled) {
                    CertificateService::issue($userId, $course->id);
                }
            }
        }

        $attemptsRemaining = $exam->max_attempts > 0
            ? max(0, $exam->max_attempts - $attemptNumber)
            : null;

        $nextModule = $nextModuleUnlocked ? $exam->module->nextModule() : null;

        return [
            'score'                => $score,
            'points_earned'        => $earnedPoints,
            'points_total'         => $totalPoints,
            'passed'               => $passed,
            'pass_mark'            => $exam->pass_mark,
            'attempt_number'       => $attemptNumber,
            'attempts_remaining'   => $attemptsRemaining,
            'next_module_unlocked' => $nextModuleUnlocked,
            'next_module_id'       => $nextModule?->id,
            'course_id'            => $exam->module->course_id,
            'course_completed'     => $courseCompleted,
            'message'              => $passed
                ? '🎉 Congratulations! You passed.'
                : "You scored {$score}%. You need {$exam->pass_mark}% to pass." .
                  ($attemptsRemaining === 0 ? ' No more attempts available.' : ' Please review the material and try again.'),
        ];
    }

    private function processPass(Exam $exam, int $userId): bool
    {
        $module = $exam->module;

        // Mark current module complete
        ModuleProgress::updateOrCreate(
            ['user_id' => $userId, 'module_id' => $module->id],
            ['status' => 'completed', 'completed_at' => now()]
        );

        // Determine if next module exists
        $nextModule = $module->nextModule();
        return $nextModule !== null;
    }

    private function checkCourseCompletion(Module $module, int $userId): bool
    {
        $course         = $module->course;
        $totalModules   = $course->modules()->where('is_published', true)->count();
        $completedCount = ModuleProgress::where('user_id', $userId)
            ->whereIn('module_id', $course->modules()->pluck('id'))
            ->where('status', 'completed')
            ->count();

        if ($completedCount >= $totalModules) {
            Enrollment::where('user_id', $userId)
                ->where('course_id', $course->id)
                ->whereNull('completed_at')
                ->update(['completed_at' => now()]);
            return true;
        }

        return false;
    }
}
