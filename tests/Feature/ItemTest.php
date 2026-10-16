<?php

namespace Tests\Feature;

use App\Enums\MovementType;
use App\Models\Freezer;
use App\Models\Household;
use App\Models\Item;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ItemTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return [
            'name' => 'Lasagnes',
            'category' => 'meal',
            'unit' => 'portion',
            'frozen_on' => now()->toDateString(),
            ...$overrides,
        ];
    }

    public function test_a_batch_can_be_stored_with_a_photo()
    {
        Storage::fake('public');
        [$user, $household, $freezer] = $this->userWithFreezer();
        $compartment = $freezer->compartments->first();

        $response = $this->actingAs($user)->post(route('items.store'), $this->payload([
            'servings' => 2,
            'placements' => [['compartment_id' => $compartment->id, 'quantity' => 10]],
            'tags' => ['Four', 'four', ' viande '],
            'photo' => UploadedFile::fake()->image('lasagnes.jpg', 2400, 1800),
        ]));

        $item = Item::query()->firstOrFail();

        $response->assertRedirect(route('freezers.show', ['freezer' => $freezer->id, 'compartment' => $compartment->id, 'item' => $item->id]));

        $this->assertSame(10, $item->quantity);
        $this->assertSame(10, $item->initial_quantity);
        $this->assertSame($user->id, $item->created_by);
        $this->assertSame(['four', 'viande'], $item->tags);
        // Ready meals keep 3 months by default.
        $this->assertTrue($item->best_before->isSameDay(now()->addMonthsNoOverflow(3)));
        $this->assertStringEndsWith('.webp', (string) $item->photo_path);
        Storage::disk('public')->assertExists((string) $item->photo_path);
        $this->assertDatabaseHas('item_placements', ['item_id' => $item->id, 'compartment_id' => $compartment->id, 'quantity' => 10]);
        $this->assertDatabaseHas('item_movements', ['item_id' => $item->id, 'type' => MovementType::Added->value, 'quantity' => 10]);
    }

    public function test_a_batch_can_be_split_across_several_compartments()
    {
        [$user, , $freezer] = $this->userWithFreezer();
        [$first, $second] = $freezer->compartments->all();

        $this->actingAs($user)->post(route('items.store'), $this->payload([
            'placements' => [
                ['compartment_id' => $first->id, 'quantity' => 6],
                ['compartment_id' => $second->id, 'quantity' => 4],
            ],
        ]))->assertRedirect();

        $item = Item::query()->firstOrFail();

        $this->assertSame(10, $item->quantity);
        $this->assertSame([6, 4], $item->placements->pluck('quantity')->all());
        $this->assertSame(2, $item->movements()->where('type', MovementType::Added)->count());

        // Each drawer only counts its own share.
        $this->actingAs($user)
            ->get(route('freezers.show', $freezer))
            ->assertInertia(fn (Assert $page) => $page
                ->where('freezer.compartments.0.units', 6)
                ->where('freezer.compartments.1.units', 4)
                ->where('freezer.compartments.1.items.0.hereQuantity', 4)
                ->where('freezer.compartments.1.items.0.quantity', 10)
                ->has('freezer.compartments.1.items.0.locations', 2)
                ->where('freezer.stats.units', 10)
                ->where('freezer.stats.items', 1));
    }

    public function test_the_same_compartment_cannot_be_chosen_twice()
    {
        [$user, , $freezer] = $this->userWithFreezer();
        $compartment = $freezer->compartments->first();

        $this->actingAs($user)->post(route('items.store'), $this->payload([
            'placements' => [
                ['compartment_id' => $compartment->id, 'quantity' => 2],
                ['compartment_id' => $compartment->id, 'quantity' => 3],
            ],
        ]))->assertSessionHasErrors('placements.1.compartment_id');
    }

    public function test_items_cannot_be_stored_in_another_household_freezer()
    {
        [$user] = $this->userWithFreezer();
        $foreign = Freezer::factory()->withCompartments(1)->create(['household_id' => Household::factory()->create(['owner_id' => User::factory()])]);

        $this->actingAs($user)->post(route('items.store'), $this->payload([
            'placements' => [['compartment_id' => $foreign->compartments->first()->id, 'quantity' => 1]],
        ]))->assertSessionHasErrors('placements.0.compartment_id');

        $this->assertDatabaseCount('items', 0);
    }

    public function test_a_batch_needs_a_compartment()
    {
        [$user] = $this->userWithFreezer();

        $this->actingAs($user)->post(route('items.store'), $this->payload())->assertSessionHasErrors('placements');
    }

    public function test_editing_a_batch_can_spread_it_over_new_compartments()
    {
        [$user, $household, $freezer] = $this->userWithFreezer();
        [$first, $second, $third] = $freezer->compartments->all();
        $item = Item::factory()->placedIn($first)->create(['household_id' => $household->id, 'quantity' => 5, 'initial_quantity' => 5]);

        $this->actingAs($user)->put(route('items.update', $item), $this->payload([
            'name' => 'Lasagnes maison',
            'placements' => [
                ['compartment_id' => $second->id, 'quantity' => 3],
                ['compartment_id' => $third->id, 'quantity' => 4],
            ],
        ]))->assertRedirect(route('items.show', $item));

        $item->refresh();
        $this->assertSame('Lasagnes maison', $item->name);
        $this->assertSame(7, $item->quantity);
        $this->assertSame(7, $item->initial_quantity);
        $this->assertSame([$third->id, $second->id], $item->placements->pluck('compartment_id')->all());
    }

    public function test_taking_portions_decrements_and_finishes_the_batch()
    {
        [$user, $household, $freezer] = $this->userWithFreezer();
        $item = Item::factory()->placedIn($freezer->compartments->first())->create(['household_id' => $household->id, 'quantity' => 3]);

        $this->actingAs($user)->post(route('items.take', $item), ['quantity' => 2])->assertRedirect();
        $this->assertSame(1, $item->fresh()->quantity);
        $this->assertNull($item->fresh()->finished_at);

        $this->actingAs($user)->post(route('items.take', $item), ['quantity' => 5])->assertSessionHasErrors('quantity');

        $this->actingAs($user)->post(route('items.take', $item), ['quantity' => 1]);
        $this->assertSame(0, $item->fresh()->quantity);
        $this->assertNotNull($item->fresh()->finished_at);
        $this->assertSame(0, $item->placements()->count());

        $this->assertSame(2, $item->movements()->where('type', MovementType::Taken)->count());
    }

    public function test_taking_from_a_given_compartment_only_touches_that_share()
    {
        [$user, $household, $freezer] = $this->userWithFreezer();
        [$first, $second] = $freezer->compartments->all();
        $item = Item::factory()->placedIn($first, 6)->placedIn($second, 4)->create(['household_id' => $household->id, 'quantity' => 10]);

        // More than what this drawer holds is refused.
        $this->actingAs($user)->post(route('items.take', $item), ['quantity' => 5, 'compartment_id' => $second->id])->assertSessionHasErrors('quantity');

        $this->actingAs($user)->post(route('items.take', $item), ['quantity' => 4, 'compartment_id' => $second->id])->assertRedirect();

        $item->refresh();
        $this->assertSame(6, $item->quantity);
        $this->assertSame([$first->id], $item->placements->pluck('compartment_id')->all());
        $this->assertDatabaseHas('item_movements', ['item_id' => $item->id, 'type' => MovementType::Taken->value, 'quantity' => 4, 'from_compartment_id' => $second->id]);
    }

    public function test_taking_without_compartment_empties_the_biggest_share_first()
    {
        [$user, $household, $freezer] = $this->userWithFreezer();
        [$first, $second] = $freezer->compartments->all();
        $item = Item::factory()->placedIn($first, 2)->placedIn($second, 3)->create(['household_id' => $household->id, 'quantity' => 5]);

        $this->actingAs($user)->post(route('items.take', $item), ['quantity' => 4])->assertRedirect();

        $item->refresh();
        $this->assertSame(1, $item->quantity);
        $this->assertSame([[$first->id, 1]], $item->placements->map(fn ($placement) => [$placement->compartment_id, $placement->quantity])->all());
    }

    public function test_restocking_brings_a_finished_batch_back()
    {
        [$user, $household, $freezer] = $this->userWithFreezer();
        $compartment = $freezer->compartments->first();
        $item = Item::factory()->create(['household_id' => $household->id, 'quantity' => 0, 'initial_quantity' => 4, 'finished_at' => now()]);

        $this->actingAs($user)->post(route('items.restock', $item), ['quantity' => 6])->assertSessionHasErrors('compartment_id');

        $this->actingAs($user)->post(route('items.restock', $item), ['quantity' => 6, 'compartment_id' => $compartment->id])->assertRedirect();

        $item->refresh();
        $this->assertSame(6, $item->quantity);
        $this->assertSame(6, $item->initial_quantity);
        $this->assertNull($item->finished_at);
        $this->assertDatabaseHas('item_placements', ['item_id' => $item->id, 'compartment_id' => $compartment->id, 'quantity' => 6]);
    }

    public function test_restocking_into_another_compartment_adds_a_share()
    {
        [$user, $household, $freezer] = $this->userWithFreezer();
        [$first, $second] = $freezer->compartments->all();
        $item = Item::factory()->placedIn($first)->create(['household_id' => $household->id, 'quantity' => 3, 'initial_quantity' => 3]);

        $this->actingAs($user)->post(route('items.restock', $item), ['quantity' => 2, 'compartment_id' => $second->id])->assertRedirect();

        $this->assertSame(5, $item->fresh()->quantity);
        $this->assertSame(2, $item->placements()->count());
    }

    public function test_moving_a_batch_records_where_it_went()
    {
        [$user, $household, $freezer] = $this->userWithFreezer();
        [$from, $to] = $freezer->compartments->all();
        $item = Item::factory()->placedIn($from)->create(['household_id' => $household->id]);

        $this->actingAs($user)->post(route('items.move', $item), ['compartment_id' => $to->id])->assertRedirect();

        $this->assertSame([$to->id], $item->placements()->pluck('compartment_id')->all());
        $this->assertDatabaseHas('item_movements', [
            'item_id' => $item->id,
            'type' => MovementType::Moved->value,
            'from_compartment_id' => $from->id,
            'to_compartment_id' => $to->id,
        ]);
    }

    public function test_part_of_a_batch_can_be_moved()
    {
        [$user, $household, $freezer] = $this->userWithFreezer();
        [$from, $to] = $freezer->compartments->all();
        $item = Item::factory()->placedIn($from)->create(['household_id' => $household->id, 'quantity' => 8]);

        $this->actingAs($user)->post(route('items.move', $item), [
            'compartment_id' => $to->id,
            'from_compartment_id' => $from->id,
            'quantity' => 3,
        ])->assertRedirect();

        $item->refresh();
        $this->assertSame(8, $item->quantity);
        $this->assertEqualsCanonicalizing([[$from->id, 5], [$to->id, 3]], $item->placements->map(fn ($placement) => [$placement->compartment_id, $placement->quantity])->all());
    }

    public function test_discarding_marks_the_batch_as_lost()
    {
        [$user, $household, $freezer] = $this->userWithFreezer();
        $item = Item::factory()->placedIn($freezer->compartments->first())->create(['household_id' => $household->id, 'quantity' => 2]);

        $this->actingAs($user)->post(route('items.discard', $item), ['reason' => 'expired', 'note' => 'Trop vieux'])->assertRedirect();

        $this->assertNotNull($item->fresh()->finished_at);
        $this->assertSame(0, $item->placements()->count());
        $this->assertDatabaseHas('item_movements', ['item_id' => $item->id, 'type' => MovementType::Discarded->value, 'quantity' => 2]);
    }

    public function test_inventory_lists_stock_with_locations_and_finished_batches()
    {
        [$user, $household, $freezer] = $this->userWithFreezer();
        Item::factory()->placedIn($freezer->compartments->first())->create(['household_id' => $household->id, 'name' => 'Soupe']);
        Item::factory()->create(['household_id' => $household->id, 'name' => 'Fini', 'quantity' => 0, 'finished_at' => now()]);
        Item::factory()->create(['name' => 'Ailleurs']);

        $this->actingAs($user)
            ->get(route('items.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('items/index')
                ->has('items', 1)
                ->where('items.0.name', 'Soupe')
                ->where('items.0.location.freezerId', $freezer->id)
                ->has('items.0.locations', 1)
                ->has('finished', 1));
    }

    public function test_items_of_other_households_are_off_limits()
    {
        [$user] = $this->userWithFreezer();
        $item = Item::factory()->create();

        $this->actingAs($user)->get(route('items.show', $item))->assertForbidden();
        $this->actingAs($user)->post(route('items.take', $item), ['quantity' => 1])->assertForbidden();
        $this->actingAs($user)->delete(route('items.destroy', $item))->assertForbidden();
    }

    public function test_opening_an_item_from_another_of_my_households_switches_to_it()
    {
        [$user, $household] = $this->userWithFreezer();
        $other = Household::factory()->create(['owner_id' => User::factory()]);
        $other->members()->attach($user->id, ['role' => 'member']);
        $item = Item::factory()->create(['household_id' => $other->id]);

        $this->actingAs($user)->get(route('items.show', $item))->assertOk();

        $this->assertSame($other->id, $user->fresh()->current_household_id);
        $this->assertNotSame($household->id, $user->fresh()->current_household_id);
    }
}
