<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OnboardingTest extends TestCase
{
    use RefreshDatabase;

    public function test_onboarding_creates_household_and_first_freezer()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('onboarding.store'), [
            'household' => ['name' => 'Maison', 'emoji' => '🏡', 'color' => 'mint'],
            'freezer' => [
                'name' => 'Congel cuisine',
                'type' => 'upright',
                'color' => 'frost',
                'location' => 'Cuisine',
                'compartments' => [
                    ['name' => 'Plats'],
                    ['name' => 'Soupes'],
                ],
            ],
        ])->assertRedirect(route('dashboard'));

        $household = $user->fresh()->currentHousehold;

        $this->assertSame('Maison', $household->name);
        $this->assertSame('owner', $household->roleOf($user)?->value);
        $this->assertSame(['Plats', 'Soupes'], $household->freezers()->first()->compartments->pluck('name')->all());
    }

    public function test_freezer_step_can_be_skipped()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('onboarding.store'), [
            'household' => ['name' => 'Appart'],
            'freezer' => null,
        ])->assertRedirect(route('dashboard'));

        $this->assertSame(0, $user->fresh()->currentHousehold->freezers()->count());
    }

    public function test_household_name_is_required()
    {
        $this->actingAs(User::factory()->create())
            ->post(route('onboarding.store'), ['household' => ['name' => '']])
            ->assertSessionHasErrors('household.name');
    }
}
