<?php

namespace App\Policies;

use App\Models\Freezer;
use App\Models\User;

class FreezerPolicy
{
    public function view(User $user, Freezer $freezer): bool
    {
        return $user->belongsToHousehold($freezer->household_id);
    }

    public function update(User $user, Freezer $freezer): bool
    {
        return $user->belongsToHousehold($freezer->household_id);
    }

    public function delete(User $user, Freezer $freezer): bool
    {
        return $user->belongsToHousehold($freezer->household_id);
    }
}
