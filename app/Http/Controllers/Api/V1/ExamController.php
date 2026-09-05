<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\ExamQuestion;
use App\Models\Module;
use App\Services\AdaptiveExamService;
use App\Services\AuditLogService;
use App\Services\ExamGradingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExamController extends Controller
{
    public function __construct(
        private ExamGradingService $grader,
        private AdaptiveExamService $adaptive,
    ) {}

    // ── Get exam by module ID — starts or resumes the adaptive session ────────

    public function getByModule(Request $request, int $moduleId): JsonResponse
    {
        $user   = $request->user();
        $module = Module::findOrFail($moduleId);

        // Must be enrolled
        $enrolled = Enrollment::where('user_id', $user->id)
            ->where('course_id', $module->course_id)->exists();
        if (!$enrolled) {
            return response()->json(['success' => false, 'message' => 'You are not enrolled in this course.'], 403);
        }

        $exam = Exam::where('module_id', $moduleId)->where('is_active', true)->first();
        if (!$exam) {
            return response()->json(['success' => false, 'message' => 'No active exam for this module.'], 404);
        }

        // Check attempts
        $attemptCount = ExamAttempt::where('user_id', $user->id)->where('exam_id', $exam->id)->count();
        $alreadyPassed = ExamAttempt::where('user_id', $user->id)->where('exam_id', $exam->id)->where('passed', true)->exists();

        if ($exam->max_attempts > 0 && $attemptCount >= $exam->max_attempts && !$alreadyPassed) {
            return response()->json([
                'success' => false,
                'message' => "Maximum attempts ({$exam->max_attempts}) reached.",
                'code'    => 'MAX_ATTEMPTS_REACHED',
            ], 429);
        }

        $session = $this->adaptive->startOrResume($exam, $user->id);

        return response()->json([
            'success' => true,
            'data'    => [
                'exam_id'         => $exam->id,
                'title'           => $exam->title,
                'pass_mark'       => $exam->pass_mark,
                'time_limit'      => $exam->time_limit_secs,
                'max_attempts'    => $exam->max_attempts,
                'attempts_used'   => $attemptCount,
                'already_passed'  => $alreadyPassed,
                'total_questions' => $session['total_questions'],
                'current_index'   => $session['current_index'],
                'question'        => $session['question'],
                'is_follow_up'    => $session['is_follow_up'] ?? false,
            ],
        ]);
    }

    // ── Answer the current question, get the next one (or the final result) ──

    public function answerQuestion(Request $request, int $examId): JsonResponse
    {
        $validated = $request->validate([
            'question_id' => ['required', 'integer'],
            'answer'      => ['present'],
        ]);

        $exam = Exam::with('module')->findOrFail($examId);
        $user = $request->user();

        $next = $this->adaptive->recordAnswerAndAdvance($exam, $user->id, $validated['question_id'], $validated['answer']);

        if ($next === null) {
            return $this->finalize($exam, $user->id);
        }

        return response()->json(['success' => true, 'data' => array_merge(['done' => false], $next)]);
    }

    // ── Step back to the previous question to change its answer ──────────────

    public function stepBackQuestion(Request $request, int $examId): JsonResponse
    {
        $exam = Exam::findOrFail($examId);
        $prev = $this->adaptive->stepBack($exam, $request->user()->id);

        if ($prev === null) {
            return response()->json(['success' => false, 'message' => 'Already at the first question.'], 400);
        }

        return response()->json(['success' => true, 'data' => array_merge(['done' => false], $prev)]);
    }

    // ── Force-finish now (e.g. the timer ran out) with whatever's been answered ──

    public function finishExam(Request $request, int $examId): JsonResponse
    {
        $exam = Exam::with('module')->findOrFail($examId);
        return $this->finalize($exam, $request->user()->id);
    }

    private function finalize(Exam $exam, int $userId): JsonResponse
    {
        $answers      = $this->adaptive->answers($userId, $exam->id);
        $questionIds  = $this->adaptive->questionSequence($userId, $exam->id);

        if (empty($questionIds)) {
            return response()->json(['success' => false, 'message' => 'No exam session in progress.'], 404);
        }

        $result = $this->grader->grade($exam, $userId, $answers, null, $questionIds);
        $this->adaptive->clearSession($userId, $exam->id);

        return response()->json(['success' => true, 'data' => array_merge(['done' => true], $result)]);
    }

    // ── Attempt history ───────────────────────────────────────────────────────

    public function attempts(Request $request, int $examId): JsonResponse
    {
        $attempts = ExamAttempt::where('user_id', $request->user()->id)
            ->where('exam_id', $examId)
            ->orderBy('attempt_number')
            ->get(['id', 'attempt_number', 'score', 'passed', 'time_taken_secs', 'submitted_at']);

        return response()->json(['success' => true, 'data' => $attempts]);
    }

    // ── Question bank (admin) ─────────────────────────────────────────────────

    public function questionBank(Request $request, int $moduleId): JsonResponse
    {
        $exam = Exam::with('module')->where('module_id', $moduleId)->first();
        if (!$exam) {
            return response()->json(['success' => false, 'message' => 'No exam found.'], 404);
        }

        $questions = $exam->questions()->with('creator:id,name')->get();

        return response()->json(['success' => true, 'data' => [
            'exam'      => $exam,
            'questions' => $questions,
            'topics'    => $exam->module->candidateTopics(),
        ]]);
    }

    // ── Create question ───────────────────────────────────────────────────────

    public function storeQuestion(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'exam_id'       => ['required', 'exists:exams,id'],
            'type'          => ['required', 'in:mcq,true_false,short_answer'],
            'difficulty'    => ['nullable', 'in:easy,medium,hard'],
            'topic'         => ['nullable', 'string', 'max:100'],
            'question_text' => ['required', 'string'],
            'options'       => ['nullable', 'array'],
            'correct_answer' => ['required'],
            'explanation'   => ['nullable', 'string'],
            'points'        => ['nullable', 'integer', 'min:1'],
            'order_index'   => ['nullable', 'integer'],
        ]);

        $exam = Exam::with('module')->findOrFail($validated['exam_id']);
        $validated['difficulty'] ??= 'medium';
        $validated['topic']      ??= $exam->module->title;
        $validated['created_by'] = $request->user()->id;
        $validated['status']     = 'approved';
        $question = ExamQuestion::create($validated);

        return response()->json(['success' => true, 'data' => $question, 'message' => 'Question created.'], 201);
    }

    // ── Update question ───────────────────────────────────────────────────────

    public function updateQuestion(Request $request, int $id): JsonResponse
    {
        $question  = ExamQuestion::findOrFail($id);
        $validated = $request->validate([
            'type'          => ['sometimes', 'in:mcq,true_false,short_answer'],
            'difficulty'    => ['sometimes', 'in:easy,medium,hard'],
            'topic'         => ['sometimes', 'nullable', 'string', 'max:100'],
            'question_text' => ['sometimes', 'string'],
            'options'       => ['sometimes', 'nullable', 'array'],
            'correct_answer' => ['sometimes'],
            'explanation'   => ['sometimes', 'nullable', 'string'],
            'points'        => ['sometimes', 'integer'],
            'order_index'   => ['sometimes', 'integer'],
            'status'        => ['sometimes', 'in:pending,approved,rejected'],
        ]);

        $question->update($validated);

        return response()->json(['success' => true, 'data' => $question->fresh()]);
    }

    // ── Delete question ───────────────────────────────────────────────────────

    public function destroyQuestion(Request $request, int $id): JsonResponse
    {
        ExamQuestion::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Question deleted.']);
    }

    // ── Approve AI question ───────────────────────────────────────────────────

    public function approveQuestion(Request $request, int $id): JsonResponse
    {
        $question = ExamQuestion::findOrFail($id);
        $question->update([
            'status'      => 'approved',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        AuditLogService::log('QUESTION_APPROVED', "Q#{$id}", 'info', $request->user()->id, [], $request);

        return response()->json(['success' => true, 'message' => 'Question approved.']);
    }

    // ── Reject AI question ────────────────────────────────────────────────────

    public function rejectQuestion(Request $request, int $id): JsonResponse
    {
        $question = ExamQuestion::findOrFail($id);
        $question->update([
            'status'      => 'rejected',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        AuditLogService::log('QUESTION_REJECTED', "Q#{$id}", 'warning', $request->user()->id, [], $request);

        return response()->json(['success' => true, 'message' => 'Question rejected.']);
    }
}
