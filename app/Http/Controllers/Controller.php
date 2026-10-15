<?php

namespace App\Http\Controllers;

use App\Models\Household;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

abstract class Controller
{
    /**
     * The household the current user is working in.
     */
    protected function household(Request $request): Household
    {
        $household = $request->attributes->get('household') ?? $this->user($request)->activeHousehold();

        abort_unless($household instanceof Household, 403);

        return $household;
    }

    protected function user(Request $request): User
    {
        $user = $request->user();

        abort_unless($user instanceof User, 401);

        return $user;
    }

    /**
     * Flash a toast message for the frontend.
     */
    protected function toast(string $message, string $type = 'success'): void
    {
        Inertia::flash('toast', ['type' => $type, 'message' => $message]);
    }
}
