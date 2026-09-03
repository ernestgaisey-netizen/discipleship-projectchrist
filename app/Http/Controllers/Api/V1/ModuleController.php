<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Module;
use App\Models\ModuleProgress;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ModuleController extends Controller
{
    // ── Create module for a course ────────────────────────────────────────────

    public function store(Request $request, int $courseId): JsonResponse
    {
        $course = Course::findOrFail($courseId);
        $validated = $request->validate([
            'title'            => ['required', 'string', 'max:255'],
            'order_index'      => ['nullable', 'integer'],
            'duration_minutes' => ['nullable', 'integer'],
            'scripture_refs'   => ['nullable', 'array'],
            'content_html'     => ['nullable', 'string'],
            'content_text'     => ['nullable', 'string'],
            'video_url'        => ['nullable', 'url'],
            'audio_url'        => ['nullable', 'url'],
            'is_published'     => ['nullable', 'boolean'],
        ]);

        $validated['course_id']    = $courseId;
        $validated['order_index'] ??= $course->modules()->max('order_index') + 1;

        $module = Module::create($validated);
        AuditLogService::log('MODULE_CREATED', "Module: {$module->title}", 'info', $request->user()->id, ['module_id' => $module->id], $request);

        return response()->json(['success' => true, 'data' => $module, 'message' => 'Module created.'], 201);
    }

    // ── Get single module (with access check) ─────────────────────────────────

    public function show(Request $request, int $id): JsonResponse
    {
        $module = Module::with('course', 'exam')->findOrFail($id);
        $user   = $request->user();

        if (!$module->is_published && (!$user || !$user->isAdmin())) {
            return response()->json(['success' => false, 'message' => 'Module not found.'], 404);
        }

        // Gate check for students
        if ($user && $user->role === 'student') {
            $isLocked = $this->isModuleLocked($module, $user->id);
            if ($isLocked) {
                return response()->json([
                    'success' => false,
                    'message' => 'This module is locked. Complete the previous module\'s exam first.',
                    'code'    => 'MODULE_LOCKED',
                ], 403);
            }
        }

        // Progress record
        $progress = null;
        if ($user) {
            $progress = ModuleProgress::where('user_id', $user->id)
                ->where('module_id', $id)->first();
        }

        return response()->json([
            'success' => true,
            'data'    => array_merge($module->toArray(), [
                'progress' => $progress,
                'has_exam' => $module->exam !== null,
            ]),
        ]);
    }

    // ── Update module ─────────────────────────────────────────────────────────

    public function update(Request $request, int $id): JsonResponse
    {
        $module    = Module::findOrFail($id);
        $validated = $request->validate([
            'title'            => ['sometimes', 'string', 'max:255'],
            'order_index'      => ['sometimes', 'integer'],
            'duration_minutes' => ['sometimes', 'integer'],
            'scripture_refs'   => ['sometimes', 'nullable', 'array'],
            'content_html'     => ['sometimes', 'nullable', 'string'],
            'content_text'     => ['sometimes', 'nullable', 'string'],
            'video_url'        => ['sometimes', 'nullable', 'url'],
            'audio_url'        => ['sometimes', 'nullable', 'url'],
            'is_published'     => ['sometimes', 'boolean'],
        ]);

        $module->update($validated);
        AuditLogService::log('MODULE_EDITED', "Module: {$module->title}", 'info', $request->user()->id, ['module_id' => $id], $request);

        return response()->json(['success' => true, 'data' => $module->fresh(), 'message' => 'Module updated.']);
    }

    // ── Delete module ─────────────────────────────────────────────────────────

    public function destroy(Request $request, int $id): JsonResponse
    {
        $module = Module::findOrFail($id);
        $title  = $module->title;
        $module->delete();

        AuditLogService::log('MODULE_DELETED', "Module: {$title}", 'warning', $request->user()->id, ['module_id' => $id], $request);

        return response()->json(['success' => true, 'message' => 'Module deleted.']);
    }

    // ── Duplicate module ──────────────────────────────────────────────────────

    public function duplicate(Request $request, int $id): JsonResponse
    {
        $module = Module::findOrFail($id);
        $copy   = $module->replicate();
        $copy->title = "Copy of {$module->title}";
        $copy->order_index = $module->course->modules()->max('order_index') + 1;
        $copy->is_published = false;
        $copy->save();

        return response()->json(['success' => true, 'data' => $copy, 'message' => 'Module duplicated.']);
    }

    // ── Reorder module ────────────────────────────────────────────────────────

    public function reorder(Request $request, int $id): JsonResponse
    {
        $module = Module::findOrFail($id);
        $request->validate(['order_index' => ['required', 'integer', 'min:1']]);
        $module->update(['order_index' => $request->order_index]);

        return response()->json(['success' => true, 'message' => 'Module reordered.']);
    }

    // ── Upload material ───────────────────────────────────────────────────────

    public function uploadMaterial(Request $request, int $id): JsonResponse
    {
        $module = Module::findOrFail($id);
        $request->validate([
            'material' => ['required', 'file', 'mimes:pdf,doc,docx,ppt,pptx,mp3,mp4,png,jpg,jpeg', 'max:10240'],
        ]);

        $path = $request->file('material')->store('materials', 'local');
        $module->update(['material_path' => $path]);

        AuditLogService::log('MATERIAL_UPLOADED', "Module: {$module->title}", 'info', $request->user()->id, ['module_id' => $id], $request);

        return response()->json(['success' => true, 'data' => ['material_path' => $path], 'message' => 'Material uploaded.']);
    }

    // ── Extract module content from an uploaded PDF/DOCX ──────────────────────
    // Stateless — used by both the "create module" and "edit module" admin forms
    // to pre-fill the content field instead of retyping the lesson by hand.

    public function extractContent(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'extensions:pdf,docx', 'max:20480'],
        ]);

        $file = $request->file('file');
        $ext  = strtolower($file->getClientOriginalExtension());

        try {
            if ($ext === 'pdf') {
                $parser = new \Smalot\PdfParser\Parser();
                $text   = $parser->parseFile($file->getRealPath())->getText();

                // Normalise whitespace so the text-formatting toggle can split it into paragraphs.
                $text = preg_replace('/\r\n?/', "\n", $text);
                $text = preg_replace('/[ \t]+/', ' ', $text);
                $text = trim(preg_replace('/\n{3,}/', "\n\n", $text));

                return response()->json(['success' => true, 'data' => ['mode' => 'text', 'content' => $text]]);
            }

            // .docx — PhpWord's own HTML writer flattens headings/lists to plain <p> tags,
            // so walk the document's elements directly to keep heading levels and lists intact.
            $phpWord = \PhpOffice\PhpWord\IOFactory::load($file->getRealPath());
            $html = '';
            foreach ($phpWord->getSections() as $section) {
                $html .= $this->docxElementsToHtml($section->getElements());
            }

            return response()->json(['success' => true, 'data' => ['mode' => 'html', 'content' => trim($html)]]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Could not read that file: ' . $e->getMessage()], 422);
        }
    }

    // ── Download protected material ───────────────────────────────────────────

    public function downloadMaterial(Request $request, string $filename): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $user = $request->user();

        // Check enrollment or admin
        $module = Module::where('material_path', 'like', "%{$filename}")->firstOrFail();
        if (!$user->isAdmin()) {
            $enrolled = \App\Models\Enrollment::where('user_id', $user->id)
                ->where('course_id', $module->course_id)->exists();
            if (!$enrolled) {
                abort(403, 'You must be enrolled to access this material.');
            }
        }

        $path = Storage::disk('local')->path("materials/{$filename}");
        if (!file_exists($path)) abort(404, 'File not found.');

        return response()->download($path);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    // Walk a PhpWord element list, keeping heading levels and consecutive
    // list items intact instead of flattening everything to <p> tags.
    private function docxElementsToHtml(array $elements): string
    {
        $html   = '';
        $ulOpen = false;

        foreach ($elements as $el) {
            $short = class_basename($el);

            if ($short === 'Title') {
                if ($ulOpen) { $html .= '</ul>'; $ulOpen = false; }
                $depth = min(max($el->getDepth(), 1), 4);
                $text  = $this->docxPlainText($el->getText());
                if ($text !== '') $html .= "<h{$depth}>" . e($text) . "</h{$depth}>";
                continue;
            }

            if ($short === 'ListItem' || $short === 'ListItemRun') {
                if (!$ulOpen) { $html .= '<ul>'; $ulOpen = true; }
                $text = $short === 'ListItemRun' ? $this->docxRunToHtml($el) : e((string) $el->getText());
                if (trim($text) !== '') $html .= "<li>{$text}</li>";
                continue;
            }

            if ($ulOpen) { $html .= '</ul>'; $ulOpen = false; }

            if ($short === 'TextRun') {
                $inner = $this->docxRunToHtml($el);
                if (trim($inner) !== '') $html .= "<p>{$inner}</p>";
            } elseif ($short === 'Text') {
                $text = (string) $el->getText();
                if (trim($text) !== '') $html .= '<p>' . e($text) . '</p>';
            }
            // Tables, images, etc. are skipped — not something the module content pipeline renders.
        }

        if ($ulOpen) $html .= '</ul>';

        return $html;
    }

    // A Title's text is either a plain string or a TextRun — flatten either to plain text.
    private function docxPlainText($text): string
    {
        if ($text instanceof \PhpOffice\PhpWord\Element\TextRun) {
            return strip_tags($this->docxRunToHtml($text));
        }

        return (string) $text;
    }

    // Render a TextRun's child Text elements, preserving bold/italic as inline tags.
    private function docxRunToHtml($run): string
    {
        $out = '';
        foreach ($run->getElements() as $child) {
            if (!($child instanceof \PhpOffice\PhpWord\Element\Text)) continue;

            $text  = e((string) $child->getText());
            $style = $child->getFontStyle();
            if (is_object($style)) {
                if (method_exists($style, 'isBold') && $style->isBold())     $text = "<strong>{$text}</strong>";
                if (method_exists($style, 'isItalic') && $style->isItalic()) $text = "<em>{$text}</em>";
            }
            $out .= $text;
        }

        return $out;
    }

    private function isModuleLocked(Module $module, int $userId): bool
    {
        if ($module->order_index <= 1) {
            // First module: locked only if not enrolled
            return !\App\Models\Enrollment::where('user_id', $userId)
                ->where('course_id', $module->course_id)->exists();
        }

        // Find previous module
        $prevModule = Module::where('course_id', $module->course_id)
            ->where('order_index', $module->order_index - 1)
            ->first();

        if (!$prevModule) return false;

        // Previous module must be completed
        return !ModuleProgress::where('user_id', $userId)
            ->where('module_id', $prevModule->id)
            ->where('status', 'completed')
            ->exists();
    }
}
