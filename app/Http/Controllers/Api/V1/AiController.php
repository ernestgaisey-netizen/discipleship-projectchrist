<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamQuestion;
use App\Models\Module;
use App\Services\AnthropicService;
use App\Services\AuditLogService;
use App\Services\ExceptionLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiController extends Controller
{
    public function __construct(private AnthropicService $ai) {}

    // ── Generate question bank for a module ───────────────────────────────────

    public function generateQuestions(Request $request): JsonResponse
    {
        $request->validate([
            'module_id' => ['required', 'exists:modules,id'],
            'count'     => ['nullable', 'integer', 'min:5', 'max:50'],
        ]);

        $module = Module::findOrFail($request->module_id);
        $exam   = Exam::where('module_id', $module->id)->first();

        if (!$exam) {
            return response()->json(['success' => false, 'message' => 'No exam found for this module. Create an exam first.'], 404);
        }

        try {
            $topics = $module->candidateTopics();

            $questions = $this->ai->generateQuestionBank(
                $module->title,
                $module->content_text ?? strip_tags($module->content_html ?? ''),
                $request->count ?? 30,
                $topics
            );

            $saved = 0;
            foreach ($questions as $q) {
                // Skip malformed entries rather than let one bad row from the model fail the whole batch.
                if (empty($q['question_text'])) continue;

                // Guard against the model returning a topic outside the list it was given.
                $topic = in_array($q['topic'] ?? null, $topics, true) ? $q['topic'] : $module->title;

                ExamQuestion::create([
                    'exam_id'        => $exam->id,
                    'type'           => $q['type'] ?? 'mcq',
                    'difficulty'     => in_array($q['difficulty'] ?? null, ['easy', 'medium', 'hard'], true) ? $q['difficulty'] : 'medium',
                    'topic'          => $topic,
                    'question_text'  => $q['question_text'],
                    'options'        => $q['options'] ?? null,
                    'correct_answer' => $q['correct_answer'],
                    'explanation'    => $q['explanation'] ?? null,
                    'points'         => $q['points'] ?? 1,
                    'ai_generated'   => true,
                    'status'         => 'pending',
                    'created_by'     => $request->user()->id,
                ]);
                $saved++;
            }

            AuditLogService::log(
                'AI_QUESTIONS_GENERATED',
                "{$saved} questions for Module: {$module->title}",
                'info',
                $request->user()->id,
                ['module_id' => $module->id, 'exam_id' => $exam->id, 'count' => $saved],
                $request
            );

            return response()->json([
                'success' => true,
                'data'    => ['generated' => $saved, 'status' => 'pending'],
                'message' => "{$saved} questions generated. Pending admin review before use.",
            ]);
        } catch (\Throwable $e) {
            ExceptionLogService::capture($e, 'ai', ['module_id' => $module->id]);
            return response()->json(['success' => false, 'message' => 'AI question generation failed. Please try again.'], 500);
        }
    }

    // ── Draft a full course (meta + modules) from a prompt ────────────────────
    // Nothing is saved here — this just returns data to pre-fill the admin's
    // "Create New Course" form, same review-before-commit pattern as question generation.

    public function generateCourse(Request $request): JsonResponse
    {
        $request->validate([
            'prompt'       => ['required', 'string', 'max:1000'],
            'module_count' => ['nullable', 'integer', 'min:1', 'max:16'],
        ]);

        try {
            $course = $this->ai->generateCourse($request->prompt, $request->module_count ?? 5);

            AuditLogService::log(
                'AI_COURSE_GENERATED',
                "Prompt: " . \Illuminate\Support\Str::limit($request->prompt, 150),
                'info',
                $request->user()->id,
                ['module_count' => count($course['modules'] ?? [])],
                $request
            );

            return response()->json(['success' => true, 'data' => $course]);
        } catch (\Throwable $e) {
            ExceptionLogService::capture($e, 'ai', ['prompt' => $request->prompt]);
            return response()->json(['success' => false, 'message' => 'AI course generation failed. Please try again.'], 500);
        }
    }

    // ── Get course recommendations ─────────────────────────────────────────────

    public function recommendations(Request $request): JsonResponse
    {
        $user = $request->user();

        try {
            $recs = $this->ai->getCourseRecommendations($user->name, $user->role);
            return response()->json(['success' => true, 'data' => $recs]);
        } catch (\Throwable $e) {
            ExceptionLogService::capture($e, 'ai', []);
            return response()->json(['success' => false, 'message' => 'Could not generate recommendations.'], 500);
        }
    }

    // ── Summarize module content ───────────────────────────────────────────────

    public function summarizeModule(Request $request, int $moduleId): JsonResponse
    {
        $module = Module::findOrFail($moduleId);
        $text   = $module->content_text ?? strip_tags($module->content_html ?? '');

        if (strlen($text) < 100) {
            return response()->json(['success' => false, 'message' => 'Module content too short to summarize.'], 400);
        }

        try {
            $summary = $this->ai->summarizeModule($module->title, $text);
            return response()->json(['success' => true, 'data' => ['summary' => $summary]]);
        } catch (\Throwable $e) {
            ExceptionLogService::capture($e, 'ai', ['module_id' => $moduleId]);
            return response()->json(['success' => false, 'message' => 'Summary generation failed.'], 500);
        }
    }
}
