<?php

namespace App\Http\Controllers;

use App\Enums\HouseholdRole;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class MemberController extends Controller
{
    public function update(Request $request, User $member): RedirectResponse
    {
        $household = $this->household($request);
        Gate::authorize('manageMembers', $household);

        $validated = $request->validate([
            'role' => ['required', Rule::in(HouseholdController::assignableRoles())],
        ]);

        $role = $household->roleOf($member);
        abort_if($role === null || $role === HouseholdRole::Owner, 403);

        $household->members()->updateExistingPivot($member->id, ['role' => $validated['role']]);

        $this->toast("{$member->name} est maintenant ".HouseholdRole::from($validated['role'])->label());

        return back();
    }

    public function destroy(Request $request, User $member): RedirectResponse
    {
        $household = $this->household($request);
        Gate::authorize('manageMembers', $household);

        $role = $household->roleOf($member);
        abort_if($role === null || $role === HouseholdRole::Owner || $member->is($request->user()), 403);

        $household->members()->detach($member->id);

        if ($member->current_household_id === $household->id) {
            $member->forceFill(['current_household_id' => null])->save();
        }

        $this->toast("{$member->name} ne fait plus partie de {$household->name}", 'info');

        return back();
    }
}
