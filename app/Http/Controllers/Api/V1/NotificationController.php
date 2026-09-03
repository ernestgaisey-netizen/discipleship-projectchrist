<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // ── My notifications ──────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $notifications = Notification::where(function ($q) use ($request) {
                $q->where('user_id', $request->user()->id)
                  ->orWhereNull('user_id'); // broadcasts
            })
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json(['success' => true, 'data' => $notifications]);
    }

    // ── Unread count ──────────────────────────────────────────────────────────

    public function unreadCount(Request $request): JsonResponse
    {
        $count = Notification::where(function ($q) use ($request) {
                $q->where('user_id', $request->user()->id)->orWhereNull('user_id');
            })
            ->whereNull('read_at')
            ->count();

        return response()->json(['success' => true, 'data' => ['count' => $count]]);
    }

    // ── Mark as read ──────────────────────────────────────────────────────────

    public function markRead(Request $request, int $id): JsonResponse
    {
        $notification = Notification::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $notification->update(['read_at' => now()]);

        return response()->json(['success' => true, 'message' => 'Marked as read.']);
    }

    // ── Mark all as read ──────────────────────────────────────────────────────

    public function markAllRead(Request $request): JsonResponse
    {
        Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['success' => true, 'message' => 'All notifications marked as read.']);
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    public function destroy(Request $request, int $id): JsonResponse
    {
        Notification::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail()
            ->delete();

        return response()->json(['success' => true, 'message' => 'Notification deleted.']);
    }

    // ── Admin: broadcast ──────────────────────────────────────────────────────

    public function broadcast(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'    => ['required', 'string', 'max:255'],
            'body'     => ['required', 'string'],
            'type'     => ['nullable', 'string'],
            'audience' => ['nullable', 'in:all,students,admins,mentors'],
        ]);

        \App\Services\NotificationService::broadcast(
            $validated['title'],
            $validated['body'],
            $validated['type'] ?? 'info',
            $validated['audience'] ?? 'all'
        );

        return response()->json(['success' => true, 'message' => 'Broadcast sent.']);
    }
}
