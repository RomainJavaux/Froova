<?php

namespace App\Http\Middleware;

use App\Models\Household;
use App\Models\User;
use App\Support\Catalog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user instanceof User ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at?->toIso8601String(),
                    'created_at' => $user->created_at?->toIso8601String(),
                    'updated_at' => $user->updated_at?->toIso8601String(),
                ] : null,
            ],
            'household' => fn () => $user instanceof User ? $this->household($request, $user) : null,
            'households' => fn () => $user instanceof User
                ? $user->households->map(fn (Household $household) => [
                    'id' => $household->id,
                    'name' => $household->name,
                    'emoji' => $household->emoji,
                    'color' => $household->color,
                ])->values()
                : [],
            'catalog' => Inertia::once(fn () => Catalog::toArray()),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function household(Request $request, User $user): ?array
    {
        $household = $request->attributes->get('household') ?? $user->activeHousehold();

        if (! $household instanceof Household) {
            return null;
        }

        return [
            'id' => $household->id,
            'name' => $household->name,
            'emoji' => $household->emoji,
            'color' => $household->color,
            'role' => $household->roleOf($user)?->value,
        ];
    }
}
