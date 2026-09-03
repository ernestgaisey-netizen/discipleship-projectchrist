<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use App\Models\ExceptionLog;

class AnthropicService
{
    private string $apiKey;
    private string $model;
    private string $workspaceId;
    private string $baseUrl = 'https://api.anthropic.com/v1';

    public function __construct()
    {
        $this->apiKey      = config('services.anthropic.key', env('ANTHROPIC_API_KEY', ''));
        $this->model       = config('services.anthropic.model', env('ANTHROPIC_MODEL', 'claude-sonnet-5'));
        $this->workspaceId = config('services.anthropic.workspace_id', env('ANTHROPIC_WORKSPACE_ID', ''));
    }

    private function chat(string $prompt, int $maxTokens = 2000): string
    {
        $headers = [
            'x-api-key'         => $this->apiKey,
            'anthropic-version' => '2023-06-01',
            'content-type'      => 'application/json',
        ];
        // Identity-linked API keys (issued to a specific workspace) require this
        // header on every request; standard console-generated keys ignore it.
        if ($this->workspaceId !== '') {
            $headers['anthropic-workspace-id'] = $this->workspaceId;
        }

        $response = Http::withHeaders($headers)->timeout(60)->post("{$this->baseUrl}/messages", [
            'model'      => $this->model,
            'max_tokens' => $maxTokens,
            'messages'   => [['role' => 'user', 'content' => $prompt]],
        ]);

        if (!$response->successful()) {
            throw new \RuntimeException('Anthropic API error: ' . $response->body());
        }

        return $response->json('content.0.text', '');
    }

    public function generateQuestionBank(string $moduleTitle, string $contentText, int $count = 30, array $topics = []): array
    {
        $text = mb_substr(strip_tags($contentText), 0, 4000);
        $topics = $topics ?: [$moduleTitle];
        $topicList = implode(', ', array_map(fn ($t) => "\"{$t}\"", $topics));

        $prompt = <<<PROMPT
You are an expert biblical educator creating exam questions for a discipleship learning platform.

Module: {$moduleTitle}
Content: {$text}

Generate exactly {$count} exam questions. Include a mix of:
- Multiple choice (type: "mcq") — provide 4 options, correct_answer is the 0-based index
- True/False (type: "true_false") — correct_answer is true or false
- Short answer (type: "short_answer") — correct_answer is an array of 3-5 keyword strings

For every question, also set:
- "difficulty": "easy", "medium", or "hard" — how hard the question is to answer correctly
- "topic": pick the single best match from this exact list (copy it verbatim, do not invent a new one): {$topicList}

Return ONLY a valid JSON array, no other text:
[
  {
    "type": "mcq",
    "question_text": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "explanation": "Why this is correct",
    "points": 1,
    "difficulty": "medium",
    "topic": "one of the topics listed above"
  },
  {
    "type": "true_false",
    "question_text": "Statement here",
    "correct_answer": true,
    "explanation": "Brief explanation",
    "points": 1,
    "difficulty": "easy",
    "topic": "one of the topics listed above"
  },
  {
    "type": "short_answer",
    "question_text": "Explain...",
    "correct_answer": ["keyword1", "keyword2", "keyword3"],
    "explanation": "Key concepts expected",
    "points": 2,
    "difficulty": "hard",
    "topic": "one of the topics listed above"
  }
]

Focus on theological concepts, scripture references, and key teachings from the content.
PROMPT;

        try {
            $raw = $this->chat($prompt, 4000);
            // Extract JSON array from response
            preg_match('/\[[\s\S]*\]/m', $raw, $matches);
            $json = $matches[0] ?? $raw;
            return json_decode($json, true) ?? [];
        } catch (\Exception $e) {
            $this->logError('generate_question_bank', $e->getMessage());
            throw $e;
        }
    }

    /**
     * Draft a full course — meta fields plus a set of modules with lesson content —
     * from a short admin prompt. Returned as data to pre-fill the create-course form;
     * nothing is saved until the admin reviews it and clicks Create Course.
     */
    public function generateCourse(string $prompt, int $moduleCount = 5): array
    {
        $moduleCount = max(1, min(16, $moduleCount));

        $aiPrompt = <<<PROMPT
You are an expert Christian discipleship curriculum designer building a course for a
discipleship learning platform.

Course brief from the admin: {$prompt}

Design a complete course with exactly {$moduleCount} modules. Return ONLY valid JSON,
no other text, in exactly this shape:

{
  "title": "Course title",
  "subtitle": "One-sentence subtitle",
  "description": "2-3 sentence description of the course",
  "category": "Short category label, e.g. Discipleship, Prayer, Leadership",
  "level": "beginner",
  "duration_weeks": {$moduleCount},
  "objectives": "What students will learn — one sentence",
  "target_audience": "Who this course is for — one sentence",
  "prerequisites": "Any prerequisites, or \\"None\\" if there are none",
  "modules": [
    {
      "title": "Module title",
      "duration_minutes": 45,
      "scripture_refs": ["Book 1:1", "Book 2:2"],
      "objectives": "What this module teaches — one sentence",
      "instructor_notes": "A short private note for instructors teaching this module",
      "content": "<h2>Introduction</h2><p>...</p><h3>Key Teaching</h3><p>...</p><blockquote>A relevant scripture quote — Reference</blockquote><h3>Application</h3><p>...</p>"
    }
  ]
}

Rules for "content": semantic HTML only (h2, h3, p, ul, li, blockquote, strong, em) —
no inline styles, no <html>/<body> wrapper, no markdown. Each module's content should
be substantial (roughly 300-500 words) and include at least one blockquote with a
scripture reference. "level" must be exactly one of: beginner, intermediate, advanced.
PROMPT;

        try {
            $raw = $this->chat($aiPrompt, 8000);
            preg_match('/\{[\s\S]*\}/m', $raw, $matches);
            $json = $matches[0] ?? $raw;
            $course = json_decode($json, true);

            if (!is_array($course) || empty($course['title'])) {
                throw new \RuntimeException('AI returned an unparseable course structure.');
            }

            return $course;
        } catch (\Exception $e) {
            $this->logError('generate_course', $e->getMessage());
            throw $e;
        }
    }

    public function generateQuiz(string $moduleTitle, string $contentText, int $count = 5): array
    {
        $text = mb_substr(strip_tags($contentText), 0, 2000);

        $prompt = <<<PROMPT
Generate exactly {$count} exam questions for this discipleship module.
Module: {$moduleTitle}
Content: {$text}

Return ONLY valid JSON array (mix of mcq and true_false):
[{"type":"mcq","question":"...","options":["A","B","C","D"],"correct_answer":0,"explanation":"...","points":1}]
PROMPT;

        try {
            $raw = $this->chat($prompt, 1500);
            preg_match('/\[[\s\S]*\]/m', $raw, $matches);
            return json_decode($matches[0] ?? '[]', true) ?? [];
        } catch (\Exception $e) {
            $this->logError('generate_quiz', $e->getMessage());
            throw $e;
        }
    }

    public function getCourseRecommendations(array $completedTitles, array $availableCourses): array
    {
        if (empty($availableCourses)) return [];

        $prompt = "A discipleship student completed: " . implode(', ', $completedTitles) . ".
Available courses: " . json_encode(array_map(fn($c) => ['id' => $c['id'], 'title' => $c['title'], 'level' => $c['level']], $availableCourses)) . ".
Recommend the best 2 courses. Return ONLY JSON: [{\"id\":1,\"reason\":\"...\"}]";

        try {
            $raw = $this->chat($prompt, 400);
            preg_match('/\[[\s\S]*\]/m', $raw, $matches);
            return json_decode($matches[0] ?? '[]', true) ?? [];
        } catch (\Exception $e) {
            $this->logError('recommendations', $e->getMessage());
            return [];
        }
    }

    public function summarizeModule(string $moduleTitle, string $contentText): string
    {
        $text = mb_substr(strip_tags($contentText), 0, 3000);

        $prompt = "Summarize this discipleship module in 5 key bullet points for a study guide. Include relevant scripture references.
Module: {$moduleTitle}
Content: {$text}";

        try {
            return $this->chat($prompt, 600);
        } catch (\Exception $e) {
            $this->logError('summarize_module', $e->getMessage());
            throw $e;
        }
    }

    public function gradeShortAnswer(string $question, array $keywords, string $studentAnswer): array
    {
        $prompt = <<<PROMPT
You are grading a biblical discipleship exam short answer question.
Question: {$question}
Expected key concepts: {$this->jsonSafe($keywords)}
Student answer: {$studentAnswer}

Respond ONLY with valid JSON: {"correct": true/false, "score": 0.0-1.0, "note": "brief feedback"}
PROMPT;

        try {
            $raw = $this->chat($prompt, 200);
            preg_match('/\{[\s\S]*\}/m', $raw, $matches);
            $result = json_decode($matches[0] ?? '{}', true);
            return $result ?: ['correct' => false, 'score' => 0.0, 'note' => 'Unable to grade'];
        } catch (\Exception $e) {
            // Fallback: keyword matching
            $matchCount = count(array_filter($keywords, fn($kw) =>
                stripos($studentAnswer, $kw) !== false
            ));
            $score = count($keywords) > 0 ? $matchCount / count($keywords) : 0;
            return ['correct' => $score >= 0.5, 'score' => $score, 'note' => 'Graded by keyword matching'];
        }
    }

    private function jsonSafe(mixed $value): string
    {
        return json_encode($value, JSON_UNESCAPED_UNICODE);
    }

    private function logError(string $source, string $message): void
    {
        ExceptionLog::create([
            'source'    => 'ai',
            'severity'  => 'error',
            'message'   => "[{$source}] {$message}",
            'user_id'   => optional(request()->user())->id,
            'url'       => request()->fullUrl(),
            'ip_address' => request()->ip(),
        ]);
    }
}
