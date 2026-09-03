<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogService
{
    public static function log(
        string $action,
        string $description = '',
        string $severity = 'info',
        ?int $userId = null,
        array $metadata = [],
        ?Request $request = null
    ): void {
        $req = $request ?? request();

        AuditLog::create([
            'user_id'     => $userId ?? optional($req->user())->id,
            'action'      => $action,
            'description' => $description,
            'severity'    => $severity,
            'ip_address'  => $req->ip(),
            'user_agent'  => $req->userAgent(),
            'metadata'    => $metadata ?: null,
        ]);
    }
}
