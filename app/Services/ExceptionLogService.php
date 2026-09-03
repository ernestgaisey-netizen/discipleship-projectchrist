<?php

namespace App\Services;

use App\Models\ExceptionLog;
use Illuminate\Support\Facades\Log;

class ExceptionLogService
{
    public static function capture(\Throwable $e, string $source = 'app', array $context = []): void
    {
        try {
            ExceptionLog::create([
                'source'      => $source,
                'message'     => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString(),
                'context'     => $context,
                'is_resolved' => false,
            ]);
        } catch (\Throwable $inner) {
            // Fallback: don't let logging crash the app
            Log::error('ExceptionLogService failed to write: ' . $inner->getMessage(), [
                'original' => $e->getMessage(),
            ]);
        }
    }
}
