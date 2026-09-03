<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QuizController extends Controller
{
    public function show(Course $course, Quiz $quiz)
    {
        $quiz->load('questions');
        return Inertia::render('Quiz/Show', [
            'course' => $course,
            'quiz' => $quiz
        ]);
    }

    public function start(Request $request, Quiz $quiz)
    {
        // Create attempt
        $attempt = QuizAttempt::create([
            'quiz_id' => $quiz->id,
            'user_id' => auth()->id(),
            'status' => 'in_progress'
        ]);

        return redirect()->route('quizzes.attempt', [$quiz, $attempt]);
    }

    public function attempt(Quiz $quiz, QuizAttempt $attempt)
    {
        if ($attempt->status === 'completed') {
            return redirect()->route('quizzes.results', [$quiz, $attempt]);
        }

        $quiz->load('questions');
        return Inertia::render('Quiz/Attempt', [
            'quiz' => $quiz,
            'attempt' => $attempt
        ]);
    }

    public function submit(Request $request, Quiz $quiz, QuizAttempt $attempt)
    {
        $answers = $request->input('answers');
        // Grading logic here (simple version)
        $score = 0;
        $totalPoints = 0;

        foreach ($quiz->questions as $question) {
            $totalPoints += $question->points;
            if (isset($answers[$question->id]) && $answers[$question->id] == $question->correct_answer) {
                $score += $question->points;
            }
        }

        $attempt->update([
            'score' => $score,
            'status' => 'completed',
            'completed_at' => now()
        ]);

        return redirect()->route('quizzes.results', [$quiz, $attempt]);
    }

    public function results(Quiz $quiz, QuizAttempt $attempt)
    {
        return Inertia::render('Quiz/Results', [
            'quiz' => $quiz,
            'attempt' => $attempt,
            'score' => $attempt->score
        ]);
    }
}
