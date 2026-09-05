<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use PragmaRX\Google2FA\Google2FA;

class MfaController extends Controller
{
    private Google2FA $google2fa;

    public function __construct()
    {
        $this->google2fa = new Google2FA();
    }

    // ── Setup: generate secret + QR ──────────────────────────────────────────

    public function setup(Request $request): JsonResponse
    {
        $user   = $request->user();
        $secret = $this->google2fa->generateSecretKey();

        // Store temporarily — only saved permanently on enable
        $user->update(['mfa_secret' => $secret]);

        $issuer  = config('app.name', 'DisciplePath');
        $qrUrl   = $this->google2fa->getQRCodeUrl($issuer, $user->email, $secret);

        return response()->json([
            'success' => true,
            'data'    => [
                'secret' => $secret,
                'qr_url' => "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" . urlencode($qrUrl),
                'manual_entry_key' => $secret,
            ],
        ]);
    }

    // ── Enable: verify code before activating ─────────────────────────────────

    public function enable(Request $request): JsonResponse
    {
        $request->validate(['code' => ['required', 'digits:6']]);
        $user = $request->user();

        if (!$user->mfa_secret) {
            return response()->json(['success' => false, 'message' => 'Please complete MFA setup first.'], 400);
        }

        $valid = $this->google2fa->verifyKey($user->mfa_secret, $request->code);

        if (!$valid) {
            return response()->json(['success' => false, 'message' => 'Invalid verification code.'], 422);
        }

        $user->update(['mfa_enabled' => true]);
        AuditLogService::log('MFA_ENABLED', '', 'info', $user->id, [], $request);

        return response()->json(['success' => true, 'message' => 'Two-factor authentication enabled.']);
    }

    // ── Disable ───────────────────────────────────────────────────────────────

    public function disable(Request $request): JsonResponse
    {
        $request->validate(['code' => ['required', 'digits:6']]);
        $user = $request->user();

        if (!$user->mfa_enabled) {
            return response()->json(['success' => false, 'message' => 'MFA is not enabled.'], 400);
        }

        $valid = $this->google2fa->verifyKey($user->mfa_secret, $request->code);

        if (!$valid) {
            return response()->json(['success' => false, 'message' => 'Invalid verification code.'], 422);
        }

        $user->update(['mfa_enabled' => false, 'mfa_secret' => null]);
        AuditLogService::log('MFA_DISABLED', '', 'warning', $user->id, [], $request);

        return response()->json(['success' => true, 'message' => 'Two-factor authentication disabled.']);
    }

    // ── Verify at login (before token is issued) ──────────────────────────────

    public function verifyLogin(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => ['required', 'integer'],
            'code'    => ['required', 'digits:6'],
        ]);

        $user = User::find($request->user_id);

        if (!$user || !$user->mfa_enabled || !$user->mfa_secret) {
            return response()->json(['success' => false, 'message' => 'Invalid MFA state.'], 400);
        }

        $valid = $this->google2fa->verifyKey($user->mfa_secret, $request->code);

        if (!$valid) {
            return response()->json(['success' => false, 'message' => 'Invalid verification code.'], 422);
        }

        $user->recordDailyActivity();
        $token = $user->createToken('auth_token')->plainTextToken;

        AuditLogService::log('LOGIN_SUCCESS', "MFA login: {$user->email}", 'info', $user->id, [], $request);

        return response()->json([
            'success' => true,
            'data'    => [
                'user'  => $user->only(['id', 'name', 'email', 'role', 'sub_role', 'avatar_url', 'mfa_enabled']),
                'token' => $token,
            ],
        ]);
    }
}
