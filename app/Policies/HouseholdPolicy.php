<?php

namespace App\Policies;

use App\Enums\HouseholdRole;
use App\Models\Household;
use App\Models\User;

class HouseholdPolicy
{
    public function view(User $user, Household $household): bool
    {
        return $household->hasMember($user);
    }

    public function update(User $user, Household $household): bool
    {
        return $household->roleOf($user)?->canManageMembers() ?? false;
    }

    public function manageMembers(User $user, Household $household): bool
    {
        return $household->roleOf($user)?->canManageMembers() ?? false;
    }

    public function delete(User $user, Household $household): bool
    {
        return $household->roleOf($user) === HouseholdRole::Owner;
    }

    public function leave(User $user, Household $household): bool
    {
        $role = $household->roleOf($user);

        return $role !== null && $role !== HouseholdRole::Owner;
    }
}
