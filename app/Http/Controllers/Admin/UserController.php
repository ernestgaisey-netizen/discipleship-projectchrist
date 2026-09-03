<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index()
    {
        // Ensure only admin can access verified by middleware in routes
        $users = User::with('roles')->latest()->paginate(10);
        $roles = Role::all();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'roles' => $roles
        ]);
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'role' => 'required|exists:roles,name'
        ]);

        // Sync roles (assuming single role for now, or use syncRoles for multiple)
        $user->syncRoles([$request->role]);

        return back()->with('success', 'User role updated successfully.');
    }
}
