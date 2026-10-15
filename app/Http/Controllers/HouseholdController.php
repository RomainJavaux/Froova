<?php

namespace App\Http\Controllers;

use App\Actions\Households\CreateHousehold;
use App\Enums\HouseholdRole;
use App\Models\Household;
use App\Models\HouseholdInvitation;
use App\Models\User;
use App\Services\PhotoStore;
use App\Support\Palette;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class HouseholdController extends Controller
{
    public function show(Request $request): Response
    {
        $household = $this->household($request);
        $user = $this->user($request);

        $members = $household->members()
            ->orderByRaw("case household_user.role when 'owner' then 0 when 'admin' then 1 else 2 end")
            ->orderBy('name')
            ->get()
            ->map(fn (User $member) => [
                'id' => $member->id,
                'name' => $member->name,
                'email' => $member->email,
                'role' => $member->getRelationValue('pivot')->getAttribute('role'),
                'joinedAt' => $member->getRelationValue('pivot')->getAttribute('created_at')?->toIso8601String(),
                'isMe' => $member->id === $user->id,
            ]);

        $canManage = Gate::allows('manageMembers', $household);

        $invitations = $canManage
            ? $household->invitations()->pending()->with('inviter')->latest()->get()->map(fn (HouseholdInvitation $invitation) => [
                'id' => $invitation->id,
                'email' => $invitation->email,
                'role' => $invitation->role->value,
                'url' => $invitation->url(),
                'expiresAt' => $invitation->expires_at->toIso8601String(),
                'invitedBy' => $invitation->inviter?->name,
            ])
            : [];

        return Inertia::render('household/show', [
            'members' => $members,
            'invitations' => $invitations,
            'stats' => [
                'freezers' => $household->freezers()->count(),
                'items' => $household->items()->inStock()->count(),
                'createdAt' => $household->created_at?->toIso8601String(),
            ],
            'can' => [
                'update' => Gate::allows('update', $household),
                'manageMembers' => $canManage,
                'delete' => Gate::allows('delete', $household),
                'leave' => Gate::allows('leave', $household),
            ],
        ]);
    }

    public function store(Request $request, CreateHousehold $createHousehold): RedirectResponse
    {
        $validated = $request->validate($this->rules());

        $household = $createHousehold->handle($this->user($request), $validated);

        $this->toast("{$household->name} est créé ! Ajoute ton premier congélateur.");

        return to_route('freezers.create');
    }

    public function update(Request $request): RedirectResponse
    {
        $household = $this->household($request);
        Gate::authorize('update', $household);

        $household->update($request->validate($this->rules()));

        $this->toast('Lieu mis à jour');

        return back();
    }

    public function switch(Request $request, Household $household): RedirectResponse
    {
        Gate::authorize('view', $household);

        $this->user($request)->switchHousehold($household);

        $this->toast("Tu es maintenant dans {$household->emoji} {$household->name}", 'info');

        return to_route('dashboard');
    }

    public function leave(Request $request): RedirectResponse
    {
        $household = $this->household($request);
        Gate::authorize('leave', $household);

        $user = $this->user($request);
        $household->members()->detach($user->id);
        $user->forceFill(['current_household_id' => null])->save();

        $this->toast("Tu as quitté {$household->name}", 'info');

        return to_route('dashboard');
    }

    public function destroy(Request $request, PhotoStore $photos): RedirectResponse
    {
        $household = $this->household($request);
        Gate::authorize('delete', $household);

        $request->validate([
            'confirmation' => ['required', 'string', Rule::in([$household->name])],
        ], [
            'confirmation.in' => 'Tape exactement le nom du lieu pour confirmer.',
        ]);

        $household->items()->whereNotNull('photo_path')->pluck('photo_path')
            ->each(fn (string $path) => $photos->delete($path));

        $household->delete();

        $this->toast("{$household->name} a été supprimé", 'info');

        return to_route('dashboard');
    }

    /**
     * @return array<string, array<mixed>>
     */
    private function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:60'],
            'emoji' => ['nullable', 'string', 'max:16'],
            'color' => ['nullable', Rule::in(Palette::keys())],
        ];
    }

    /**
     * Roles that can be granted to other members.
     *
     * @return list<string>
     */
    public static function assignableRoles(): array
    {
        return [HouseholdRole::Admin->value, HouseholdRole::Member->value];
    }
}
