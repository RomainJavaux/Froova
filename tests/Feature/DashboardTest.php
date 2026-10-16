<?php

namespace Tests\Feature;

use App\Models\Item;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_users_without_household_are_sent_to_onboarding()
    {
        $this->actingAs(User::factory()->create());

        $this->get(route('dashboard'))->assertRedirect(route('onboarding'));
    }

    public function test_dashboard_shows_the_household_stock()
    {
        [$user, $household, $freezer] = $this->userWithFreezer();

        Item::factory()->placedIn($freezer->compartments->first())->create([
            'household_id' => $household->id,
            'quantity' => 6,
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('stats.items', 1)
                ->where('stats.units', 6)
                ->where('household.id', $household->id)
                ->where('household.role', 'owner')
                ->has('freezers', 1)
                ->has('catalog.categories'));
    }
}
