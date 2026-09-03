<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Enrollment;
use App\Services\CertificateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CertificateController extends Controller
{
    // ── My certificates ───────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $certs = Certificate::with('course:id,title,emoji')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('issued_at')
            ->get();

        return response()->json(['success' => true, 'data' => $certs]);
    }

    // ── Verify certificate (public) ───────────────────────────────────────────

    public function verify(Request $request, string $code): JsonResponse
    {
        $cert = Certificate::with(['user:id,name', 'course:id,title'])
            ->where('certificate_code', strtoupper($code))
            ->first();

        if (!$cert) {
            return response()->json(['success' => false, 'message' => 'Certificate not found or invalid.'], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'valid'            => true,
                'holder'           => $cert->user?->name,
                'course'           => $cert->course?->title,
                'issued_at'        => $cert->issued_at,
                'certificate_code' => $cert->certificate_code,
            ],
        ]);
    }

    // ── Download PDF ──────────────────────────────────────────────────────────

    public function download(Request $request, int $id): \Symfony\Component\HttpFoundation\BinaryFileResponse|JsonResponse
    {
        $cert = Certificate::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if (!$cert->pdf_path || !Storage::disk('local')->exists($cert->pdf_path)) {
            // Regenerate if missing
            $enrollment = Enrollment::where('user_id', $cert->user_id)->where('course_id', $cert->course_id)->first();
            if (!$enrollment) {
                return response()->json(['success' => false, 'message' => 'Cannot regenerate certificate.'], 404);
            }
            CertificateService::issue($cert->user_id, $cert->course_id);
            $cert = $cert->fresh();
        }

        $path = Storage::disk('local')->path($cert->pdf_path);
        if (!file_exists($path)) {
            return response()->json(['success' => false, 'message' => 'Certificate file not available.'], 404);
        }

        return response()->download($path, "DisciplePath-Certificate-{$cert->certificate_code}.pdf");
    }

    // ── Issue manually (admin) ────────────────────────────────────────────────

    public function issue(Request $request): JsonResponse
    {
        $request->validate([
            'user_id'   => ['required', 'exists:dp_users,id'],
            'course_id' => ['required', 'exists:courses,id'],
        ]);

        $cert = CertificateService::issue($request->user_id, $request->course_id);

        return response()->json(['success' => true, 'data' => $cert, 'message' => 'Certificate issued.']);
    }
}
