<?php

namespace Tests\Feature;

use App\Models\Freezer;
use App\Models\Household;
use App\Models\Item;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FreezerTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_freezer_can_be_created_with_its_compartments()
    {
        [$user, $household] = $this->userWithFreezer();

        $this->actingAs($user)->post(route('freezers.store'), [
            'name' => 'Coffre garage',
            'type' => 'chest',
            'color' => 'mint',
            'compartments' => [['name' => 'Panier 1'], ['name' => 'Panier 2'], ['name' => 'Fond']],
        ])->assertRedirect();

        $freezer = $household->freezers()->where('name', 'Coffre garage')->firstOrFail();

        $this->assertSame('chest', $freezer->type->value);
        $this->assertSame(['Panier 1', 'Panier 2', 'Fond'], $freezer->compartments->pluck('name')->all());
    }

    public function test_compartments_are_renamed_reordered_and_removed_safely()
    {
        [$user, $household, $freezer] = $this->userWithFreezer();
        [$first, $second, $third] = $freezer->compartments->all();

        $item = Item::factory()->create(['household_id' => $household->id, 'compartment_id' => $third->id]);

        $this->actingAs($user)->put(route('freezers.update', $freezer), [
            'name' => 'Congel',
            'type' => 'upright',
            'color' => 'frost',
            'compartments' => [
                ['id' => $second->id, 'name' => 'Soupes'],
                ['id' => $first->id, 'name' => 'Plats'],
            ],
        ])->assertRedirect(route('freezers.show', $freezer));

        $this->assertSame(['Soupes', 'Plats'], $freezer->fresh()->compartments->pluck('name')->all());
        $this->assertModelMissing($third);
        // Food from a removed drawer lands in the first remaining one.
        $this->assertSame($second->id, $item->fresh()->compartment_id);
    }

    public function test_compartment_count_is_limited_by_freezer_type()
    {
        [$user] = $this->userWithFreezer();

        $this->actingAs($user)->post(route('freezers.store'), [
            'name' => 'Petit',
            'type' => 'compact',
            'color' => 'frost',
            'compartments' => array_fill(0, 6, ['name' => 'Tiroir']),
        ])->assertSessionHasErrors('compartments');
    }

    public function test_freezer_page_lists_drawer_contents()
    {
        [$user, $household, $freezer] = $this->userWithFreezer();

        Item::factory()->create(['household_id' => $household->id, 'compartment_id' => $freezer->compartments->first()->id, 'name' => 'Lasagnes']);

        $this->actingAs($user)
            ->get(route('freezers.show', $freezer))
            ->assertInertia(fn (Assert $page) => $page
                ->component('freezers/show')
                ->where('freezer.compartments.0.items.0.name', 'Lasagnes')
                ->where('freezer.stats.items', 1));
    }

    public function test_deleting_a_freezer_keeps_its_food_as_unsorted()
    {
        [$user, $household, $freezer] = $this->userWithFreezer();
        $item = Item::factory()->create(['household_id' => $household->id, 'compartment_id' => $freezer->compartments->first()->id]);

        $this->actingAs($user)->delete(route('freezers.destroy', $freezer))->assertRedirect(route('freezers.index'));

        $this->assertModelMissing($freezer);
        $this->assertNull($item->fresh()->compartment_id);
    }

    public function test_freezers_of_other_households_are_off_limits()
    {
        [$user] = $this->userWithFreezer();
        $stranger = Freezer::factory()->withCompartments(1)->create(['household_id' => Household::factory()->create(['owner_id' => User::factory()])]);

        $this->actingAs($user)->get(route('freezers.show', $stranger))->assertForbidden();
        $this->actingAs($user)->delete(route('freezers.destroy', $stranger))->assertForbidden();
    }
}
