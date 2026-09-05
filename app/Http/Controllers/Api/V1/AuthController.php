<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditLogService;
use App\Services\ExceptionLogService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rules;

class AuthController extends Controller
{
    // ── Register ──────────────────────────────────────────────────────────────

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'min:2', 'max:100'],
            'email'    => ['required', 'email', 'max:255', 'unique:dp_users,email'],
            'password' => ['required', 'confirmed', Rules\Password::min(6)],
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role'     => 'student',
            'is_active' => true,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        NotificationService::welcome($user->id, $user->name);
        AuditLogService::log('USER_CREATED', "New registration: {$user->email}", 'info', $user->id, [], $request);

        return response()->json([
            'success' => true,
            'data'    => [
                'user'  => $this->safeUser($user),
                'token' => $token,
            ],
            'message' => 'Registration successful. Welcome to DisciplePath!',
        ], 201);
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            AuditLogService::log('LOGIN_FAILED', "Failed login: {$request->email}", 'warning', null, [], $request);
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password.',
            ], 401);
        }

        if (!$user->is_active) {
            AuditLogService::log('LOGIN_BLOCKED', "Inactive account: {$user->email}", 'warning', $user->id, [], $request);
            return response()->json([
                'success' => false,
                'message' => 'Your account has been deactivated. Please contact support.',
            ], 403);
        }

        // MFA check
        if ($user->mfa_enabled) {
            // Return partial response — frontend must submit MFA code
            return response()->json([
                'success'      => true,
                'mfa_required' => true,
                'mfa_user_id'  => $user->id,
                'message'      => 'MFA verification required.',
            ]);
        }

        $user->recordDailyActivity();
        $token = $user->createToken('auth_token')->plainTextToken;

        AuditLogService::log('LOGIN_SUCCESS', "Login: {$user->email}", 'info', $user->id, [], $request);

        return response()->json([
            'success' => true,
            'data'    => [
                'user'  => $this->safeUser($user),
                'token' => $token,
            ],
        ]);
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        AuditLogService::log('LOGOUT', '', 'info', $request->user()->id, [], $request);

        return response()->json(['success' => true, 'message' => 'Logged out successfully.']);
    }

    // ── Me ────────────────────────────────────────────────────────────────────

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $this->safeUser($request->user()),
        ]);
    }

    // ── Update Profile ────────────────────────────────────────────────────────

    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'       => ['sometimes', 'string', 'min:2', 'max:100'],
            'phone'      => ['sometimes', 'nullable', 'string', 'max:30'],
            'avatar_url' => ['sometimes', 'nullable', 'url', 'max:500'],
        ]);

        $request->user()->update($validated);

        return response()->json([
            'success' => true,
            'data'    => $this->safeUser($request->user()->fresh()),
            'message' => 'Profile updated.',
        ]);
    }

    // ── Change Password ───────────────────────────────────────────────────────

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => ['required'],
            'password'         => ['required', 'confirmed', Rules\Password::min(6)],
        ]);

        if (!Hash::check($request->current_password, $request->user()->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect.',
            ], 400);
        }

        $request->user()->update(['password' => Hash::make($request->password)]);
        AuditLogService::log('PASSWORD_CHANGED', '', 'info', $request->user()->id, [], $request);

        return response()->json(['success' => true, 'message' => 'Password changed successfully.']);
    }

    // ── Forgot Password ───────────────────────────────────────────────────────

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        try {
            Password::sendResetLink($request->only('email'));
        } catch (\Throwable $e) {
            // Mail transport failures (e.g. SMTP misconfiguration) shouldn't surface as a
            // 500 or reveal whether the email exists — log it and return the same message.
            ExceptionLogService::capture($e, 'mail', ['context' => 'forgot_password']);
        }

        return response()->json([
            'success' => true,
            'message' => 'If that email exists, a password reset link has been sent.',
        ]);
    }

    // ── Reset Password ────────────────────────────────────────────────────────

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token'    => ['required'],
            'email'    => ['required', 'email'],
            'password' => ['required', 'confirmed', Rules\Password::min(6)],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill(['password' => Hash::make($password)])->save();
                AuditLogService::log('PASSWORD_RESET', "Password reset for {$user->email}", 'info', $user->id);
            }
        );

        return $status === Password::PASSWORD_RESET
            ? response()->json(['success' => true, 'message' => 'Password reset successfully.'])
            : response()->json(['success' => false, 'message' => 'Invalid or expired reset token.'], 400);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function safeUser(User $user): array
    {
        return [
            'id'          => $user->id,
            'name'        => $user->name,
            'email'       => $user->email,
            'role'        => $user->role,
            'sub_role'    => $user->sub_role,
            'avatar_url'  => $user->avatar_url,
            'phone'       => $user->phone,
            'is_active'   => $user->is_active,
            'mfa_enabled' => $user->mfa_enabled,
            'streak_days' => $user->streak_days,
            'last_active_at' => $user->last_active_at,
            'created_at'  => $user->created_at,
        ];
    }
}
