<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CommunityComment;
use App\Models\CommunityLike;
use App\Models\CommunityPost;
use App\Models\CommunityReport;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommunityController extends Controller
{
    // ── Posts ─────────────────────────────────────────────────────────────────

    public function posts(Request $request): JsonResponse
    {
        $query = CommunityPost::with('author:id,name,avatar_url')
            ->withCount(['comments' => fn ($q) => $q->approved(), 'likes']);

        if ($request->boolean('mine')) {
            // Your own posts, including pending/rejected — the public feed below never shows those.
            if (!$request->user()) {
                return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
            }
            $query->where('user_id', $request->user()->id);
        } else {
            $query->where('status', 'approved');
        }

        if ($request->category) {
            $query->where('category', $request->category);
        }
        if ($request->search) {
            $query->where(fn($q) => $q->where('title', 'like', "%{$request->search}%")
                                      ->orWhere('body', 'like', "%{$request->search}%"));
        }

        $posts = $query->orderByDesc('is_pinned')->orderByDesc('created_at')->paginate(15);

        // Which of these posts has the current user already liked (single query, not one per post).
        if ($userId = $request->user()?->id) {
            $liked = CommunityLike::where('user_id', $userId)
                ->where('likeable_type', CommunityPost::class)
                ->whereIn('likeable_id', $posts->pluck('id'))
                ->pluck('likeable_id')->flip();

            $posts->getCollection()->transform(function ($post) use ($liked) {
                $post->user_liked = $liked->has($post->id);
                return $post;
            });
        }

        return response()->json(['success' => true, 'data' => $posts]);
    }

    public function showPost(Request $request, int $id): JsonResponse
    {
        $post = CommunityPost::with(['author:id,name,avatar_url',
            'comments' => fn($q) => $q->approved()->with('author:id,name,avatar_url')->withCount('likes')
        ])->withCount('likes')->where('status', 'approved')->findOrFail($id);

        $post->increment('views');

        $userId   = $request->user()?->id;
        $liked    = $userId ? CommunityLike::where('user_id', $userId)->where('likeable_type', CommunityPost::class)->where('likeable_id', $id)->exists() : false;

        return response()->json(['success' => true, 'data' => array_merge($post->toArray(), ['user_liked' => $liked])]);
    }

    public function createPost(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'      => ['required', 'string', 'max:255'],
            'body'       => ['required', 'string', 'min:10'],
            'category'   => ['required', 'in:general,discussion,prayer,testimony,resource,announcement,question'],
            'visibility' => ['sometimes', 'in:public,members'],
        ]);

        $validated['user_id'] = $request->user()->id;
        $validated['status']  = $request->user()->isAdmin() ? 'approved' : 'pending';

        $post = CommunityPost::create($validated);

        return response()->json(['success' => true, 'data' => $post, 'message' => 'Post submitted' . ($post->status === 'pending' ? ' for review.' : '.')], 201);
    }

    public function updatePost(Request $request, int $id): JsonResponse
    {
        $post = CommunityPost::findOrFail($id);
        $user = $request->user();

        if ($post->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $post->update($request->validate([
            'title'      => ['sometimes', 'string', 'max:255'],
            'body'       => ['sometimes', 'string', 'min:10'],
            'category'   => ['sometimes', 'in:general,discussion,prayer,testimony,resource,announcement,question'],
            'visibility' => ['sometimes', 'in:public,members'],
            'status'     => ['sometimes', 'in:pending,approved,rejected'],
        ]));

        return response()->json(['success' => true, 'data' => $post->fresh()]);
    }

    public function deletePost(Request $request, int $id): JsonResponse
    {
        $post = CommunityPost::findOrFail($id);
        $user = $request->user();

        if ($post->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $post->delete();

        return response()->json(['success' => true, 'message' => 'Post deleted.']);
    }

    // ── Comments ──────────────────────────────────────────────────────────────

    public function addComment(Request $request, int $postId): JsonResponse
    {
        $post = CommunityPost::where('id', $postId)->where('status', 'approved')->firstOrFail();

        $validated = $request->validate([
            'body'      => ['required', 'string', 'min:2'],
            'parent_id' => ['nullable', 'exists:community_comments,id'],
        ]);

        $comment = CommunityComment::create([
            'post_id'   => $postId,
            'user_id'   => $request->user()->id,
            'body'      => $validated['body'],
            'parent_id' => $validated['parent_id'] ?? null,
            'status'    => $request->user()->isAdmin() ? 'approved' : 'pending',
        ]);

        if ($post->user_id !== $request->user()->id) {
            NotificationService::newReply($post->user_id, $post->title, $request->user()->name);
        }

        return response()->json(['success' => true, 'data' => $comment->load('author:id,name,avatar_url'), 'message' => 'Comment submitted.'], 201);
    }

    public function deleteComment(Request $request, int $id): JsonResponse
    {
        $comment = CommunityComment::findOrFail($id);
        $user    = $request->user();

        if ($comment->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $comment->delete();

        return response()->json(['success' => true, 'message' => 'Comment deleted.']);
    }

    // ── Likes ─────────────────────────────────────────────────────────────────

    public function toggleLike(Request $request, string $type, int $id): JsonResponse
    {
        $modelClass = $type === 'post' ? CommunityPost::class : CommunityComment::class;
        $model      = $modelClass::findOrFail($id);
        $userId     = $request->user()->id;

        $existing = CommunityLike::where('user_id', $userId)
            ->where('likeable_type', $modelClass)
            ->where('likeable_id', $id)->first();

        if ($existing) {
            $existing->delete();
            $liked = false;
        } else {
            CommunityLike::create(['user_id' => $userId, 'likeable_type' => $modelClass, 'likeable_id' => $id]);
            $liked = true;
        }

        $likeCount = CommunityLike::where('likeable_type', $modelClass)->where('likeable_id', $id)->count();

        return response()->json(['success' => true, 'data' => ['liked' => $liked, 'likes_count' => $likeCount]]);
    }

    // ── Reports ───────────────────────────────────────────────────────────────

    public function report(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reportable_type' => ['required', 'in:post,comment'],
            'reportable_id'   => ['required', 'integer'],
            'reason'          => ['required', 'string', 'max:500'],
        ]);

        $modelClass = $validated['reportable_type'] === 'post' ? CommunityPost::class : CommunityComment::class;

        CommunityReport::firstOrCreate([
            'user_id'         => $request->user()->id,
            'reportable_type' => $modelClass,
            'reportable_id'   => $validated['reportable_id'],
        ], ['reason' => $validated['reason']]);

        return response()->json(['success' => true, 'message' => 'Report submitted. Thank you.']);
    }
}
