<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\ExamQuestion;
use App\Models\Module;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FileController extends Controller
{
    // ── Health check (no auth) ────────────────────────────────────────────────

    public function health(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => [
                'status'  => 'ok',
                'service' => 'DisciplePath API',
                'version' => '1.0.0',
                'time'    => now()->toIso8601String(),
            ],
        ]);
    }

    // ── Public platform stats for the homepage ────────────────────────────────

    public function publicStats(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => [
                'active_disciples'  => Enrollment::count(),
                'total_modules'     => Module::where('is_published', true)->count(),
                'exam_questions'    => ExamQuestion::where('status', 'approved')->count(),
            ],
        ]);
    }

    // ── Upload user avatar ────────────────────────────────────────────────────

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpeg,png,webp,gif', 'max:1024'],
        ]);

        $path = $request->file('avatar')->store('avatars', 'public');
        $url  = '/storage/' . $path;

        $request->user()->update(['avatar_url' => $url]);

        return response()->json(['success' => true, 'data' => ['avatar_url' => $url]]);
    }

    // ── Serve protected file ──────────────────────────────────────────────────
    // Used for non-public files (materials, etc.) with auth gate

    public function serveProtected(Request $request, string $path): \Symfony\Component\HttpFoundation\BinaryFileResponse|JsonResponse
    {
        $fullPath = Storage::disk('local')->path($path);

        if (!file_exists($fullPath)) {
            return response()->json(['success' => false, 'message' => 'File not found.'], 404);
        }

        return response()->download($fullPath);
    }
}
