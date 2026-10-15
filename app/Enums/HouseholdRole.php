<?php

namespace App\Enums;

enum HouseholdRole: string
{
    case Owner = 'owner';
    case Admin = 'admin';
    case Member = 'member';

    public function label(): string
    {
        return match ($this) {
            self::Owner => 'Propriétaire',
            self::Admin => 'Admin',
            self::Member => 'Membre',
        };
    }

    /**
     * Whether this role can manage members and invitations.
     */
    public function canManageMembers(): bool
    {
        return $this !== self::Member;
    }
}
