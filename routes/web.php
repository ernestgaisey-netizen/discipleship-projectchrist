<?php

use Illuminate\Support\Facades\Route;

// React SPA — serve app.blade.php for all non-API routes
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api).*$');
