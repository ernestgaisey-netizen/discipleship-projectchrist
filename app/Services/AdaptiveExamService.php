<?php

namespace App\Services;

use App\Models\Exam;
use App\Models\ExamQuestion;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

/**
 * Drives one question at a time instead of handing over the whole session up front,
 * so each next question can depend on how the previous one was answered:
 *   - ~40% of the time, the next question is a same-topic follow-up, made harder if
 *     the student just got it right or easier if they got it wrong.
 *   - Otherwise the next question is a normal pick, weighted toward whichever
 *     difficulty tier is underrepresented so far, to keep the session mixed.
 *
 * In-progress state lives in cache (not the database) — nothing is "attempted" in the
 * ExamAttempt sense until the session finishes and ExamGradingService::grade() runs,
 * so an abandoned session just expires and never shows up as a used attempt.
 */
class AdaptiveExamService
{
    private const FOLLOW_UP_CHANCE = 0.40;
    private const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'];

    private function cacheKey(int $userId, int $examId): string
    {
        return "exam_session:{$userId}:{$examId}";
    }

    public function getSession(int $userId, int $examId): ?array
    {
        return Cache::get($this->cacheKey($userId, $examId));
    }

    private function saveSession(int $userId, int $examId, array $session, int $timeLimitSecs): void
    {
        Cache::put($this->cacheKey($userId, $examId), $session, $timeLimitSecs + 300);
    }

    public function clearSession(int $userId, int $examId): void
    {
        Cache::forget($this->cacheKey($userId, $examId));
    }

    /**
     * Start a fresh session, or hand back the question already in progress if one exists.
     */
    public function startOrResume(Exam $exam, int $userId): array
    {
        $existing = $this->getSession($userId, $exam->id);
        if ($existing) {
            return $this->currentQuestionPayload($exam, $existing);
        }

        $pool = $exam->approvedQuestions()->get();

        $first = $exam->randomize_qs
            ? $this->pickBalanced($pool, collect())
            : $pool->sortBy('order_index')->first();

        $session = [
            'question_sequence' => $first ? [$first->id] : [],
            'answers'            => [],
            'started_at'         => now()->timestamp,
        ];
        $this->saveSession($userId, $exam->id, $session, $exam->time_limit_secs);

        return $this->currentQuestionPayload($exam, $session);
    }

    /**
     * Record the answer to the current question, then either return the next question
     * or, if this was the last one, return null (caller finalizes via ExamGradingService).
     */
    public function recordAnswerAndAdvance(Exam $exam, int $userId, int $questionId, $answer): ?array
    {
        $session = $this->getSession($userId, $exam->id);
        if (!$session) return null;

        $sequence = $session['question_sequence'];
        $currentQuestionId = end($sequence);
        if ($currentQuestionId !== $questionId) {
            // Client is out of sync with the server's session — ignore the stray answer.
            return $this->currentQuestionPayload($exam, $session);
        }

        $session['answers'][$questionId] = $answer;

        if (count($sequence) >= $exam->questions_per_session) {
            $this->saveSession($userId, $exam->id, $session, $exam->time_limit_secs);
            return null; // caller finalizes
        }

        $pool = $exam->approvedQuestions()->get();
        $prevQuestion = $pool->firstWhere('id', $questionId);
        $wasCorrect   = $prevQuestion ? $this->isCorrect($prevQuestion, $answer) : false;

        $isFollowUp = false;
        if ($exam->randomize_qs) {
            $next = $this->pickNext($pool, collect($sequence), $prevQuestion, $wasCorrect, $isFollowUp);
        } else {
            $next = $pool->sortBy('order_index')->whereNotIn('id', $sequence)->first();
        }

        if ($next) {
            $session['question_sequence'][] = $next->id;
            // Not shown as a topic/difficulty value (that would let a student game the
            // pick) — just whether this question follows up on the one just answered,
            // so the adaptive behavior is visible without revealing how it decides.
            $session['followups'][$next->id] = $isFollowUp;
        }

        $this->saveSession($userId, $exam->id, $session, $exam->time_limit_secs);

        return $this->currentQuestionPayload($exam, $session);
    }

    /**
     * Step back to the previous question so its answer can be changed. Discards the
     * current (unanswered) question and whatever answer was given to the one before it —
     * the next pick after they re-answer may differ, which is the point.
     */
    public function stepBack(Exam $exam, int $userId): ?array
    {
        $session = $this->getSession($userId, $exam->id);
        if (!$session || count($session['question_sequence']) <= 1) return null;

        array_pop($session['question_sequence']);
        $prevQuestionId = end($session['question_sequence']);
        $previousAnswer = $session['answers'][$prevQuestionId] ?? null;
        unset($session['answers'][$prevQuestionId]);

        $this->saveSession($userId, $exam->id, $session, $exam->time_limit_secs);

        $payload = $this->currentQuestionPayload($exam, $session);
        $payload['previous_answer'] = $previousAnswer;
        return $payload;
    }

    public function currentQuestionPayload(Exam $exam, array $session): array
    {
        $sequence = $session['question_sequence'];
        $currentId = end($sequence);
        $question  = $currentId ? ExamQuestion::find($currentId) : null;

        return [
            'current_index'   => max(0, count($sequence) - 1),
            'total_questions' => $exam->questions_per_session,
            'question'        => $question?->withoutAnswer(),
            'is_follow_up'    => $session['followups'][$currentId] ?? false,
        ];
    }

    public function answers(int $userId, int $examId): array
    {
        return $this->getSession($userId, $examId)['answers'] ?? [];
    }

    public function questionSequence(int $userId, int $examId): array
    {
        return $this->getSession($userId, $examId)['question_sequence'] ?? [];
    }

    // ── Question selection ──────────────────────────────────────────────────────

    private function pickNext(Collection $pool, Collection $used, ?ExamQuestion $prev, bool $prevCorrect, bool &$isFollowUp = false): ?ExamQuestion
    {
        $isFollowUp = false;
        $unused = $pool->whereNotIn('id', $used);
        if ($unused->isEmpty()) return null;

        if ($prev && $prev->topic && (mt_rand(1, 100) / 100) <= self::FOLLOW_UP_CHANCE) {
            $sameTopic = $unused->where('topic', $prev->topic);
            if ($sameTopic->isNotEmpty()) {
                $target     = $this->shiftDifficulty($prev->difficulty, $prevCorrect);
                $candidates = $sameTopic->where('difficulty', $target);
                $isFollowUp = true;
                return ($candidates->isNotEmpty() ? $candidates : $sameTopic)->random();
            }
            // No unused question shares this topic — fall through to a normal balanced pick.
        }

        return $this->pickBalanced($unused, $used, $pool);
    }

    private function shiftDifficulty(string $current, bool $wasCorrect): string
    {
        $i = array_search($current, self::DIFFICULTY_ORDER);
        $i = $i === false ? 1 : $i;
        $i = $wasCorrect ? min(2, $i + 1) : max(0, $i - 1);
        return self::DIFFICULTY_ORDER[$i];
    }

    /**
     * Pick from whichever difficulty tier is least represented among the questions
     * already used this session, so the mix stays balanced across easy/medium/hard.
     */
    private function pickBalanced(Collection $candidates, Collection $usedIds, ?Collection $fullPool = null): ?ExamQuestion
    {
        if ($candidates->isEmpty()) return null;

        $usedQuestions = $fullPool ? $fullPool->whereIn('id', $usedIds) : collect();
        $usedCounts    = array_fill_keys(self::DIFFICULTY_ORDER, 0);
        foreach ($usedQuestions as $q) {
            $usedCounts[$q->difficulty] = ($usedCounts[$q->difficulty] ?? 0) + 1;
        }

        $tiersByPreference = collect(self::DIFFICULTY_ORDER)->sortBy(fn ($tier) => $usedCounts[$tier]);
        foreach ($tiersByPreference as $tier) {
            $inTier = $candidates->where('difficulty', $tier);
            if ($inTier->isNotEmpty()) return $inTier->random();
        }

        return $candidates->random();
    }

    private function isCorrect(ExamQuestion $q, $answer): bool
    {
        $correct = $q->correct_answer;

        return match ($q->type) {
            'mcq'         => (int) $answer === (int) (is_array($correct) ? ($correct[0] ?? $correct) : $correct),
            'true_false'  => filter_var($answer, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE)
                              === (bool) (is_array($correct) ? ($correct[0] ?? $correct) : $correct),
            // Short-answer correctness needs AI grading, too slow to call mid-exam just to
            // pick a follow-up direction — treat as "not clearly right" so the next question
            // stays gentle rather than escalating on a guess.
            default       => false,
        };
    }
}
