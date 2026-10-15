<?php

namespace Tests;

use App\Models\Freezer;
use App\Models\Household;
use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Fortify\Features;

abstract class TestCase extends BaseTestCase
{
    protected function skipUnlessFortifyHas(string $feature, ?string $message = null): void
    {
        if (! Features::enabled($feature)) {
            $this->markTestSkipped($message ?? "Fortify feature [{$feature}] is not enabled.");
        }
    }

    /**
     * A user who owns a household with one freezer of three drawers.
     *
     * @return array{User, Household, Freezer}
     */
    protected function userWithFreezer(): array
    {
        $user = User::factory()->create();
        $household = Household::factory()->create(['owner_id' => $user->id]);
        $freezer = Freezer::factory()->withCompartments(3)->create(['household_id' => $household->id]);

        return [$user->fresh(), $household, $freezer->load('compartments')];
    }
}
