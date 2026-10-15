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

    public function test_a_batch_can_be_stored_with_a_photo()
    {
        Storage::fake('public');
        [$user, $household, $freezer] = $this->userWithFreezer();
        $compartment = $freezer->compartments->first();

        $response = $this->actingAs($user)->post(route('items.store'), [
            'name' => 'Lasagnes',
            'category' => 'meal',
            'quantity' => 10,
            'unit' => 'portion',
            'servings' => 2,
            'frozen_on' => now()->toDateString(),
            'compartment_id' => $compartment->id,
            'tags' => ['Four', 'four', ' viande '],
            'photo' => UploadedFile::fake()->image('lasagnes.jpg', 2400, 1800),
        ]);

        $item = Item::query()->firstOrFail();

        $response->assertRedirect(route('freezers.show', ['freezer' => $freezer->id, 'compartment' => $compartment->id, 'item' => $item->id]));

        $this->assertSame(10, $item->initial_quantity);
        $this->assertSame($user->id, $item->created_by);
        $this->assertSame(['four', 'viande'], $item->tags);
        // Ready meals keep 3 months by default.
        $this->assertTrue($item->best_before->isSameDay(now()->addMonthsNoOverflow(3)));
        $this->assertStringEndsWith('.webp', (string) $item->photo_path);
        Storage::disk('public')->assertExists((string) $item->photo_path);
        $this->assertDatabaseHas('item_movements', ['item_id' => $item->id, 'type' => MovementType::Added->value, 'quantity' => 10]);
    }

    public function test_items_cannot_be_stored_in_another_household_freezer()
    {
        [$user] = $this->userWithFreezer();
        $foreign = Freezer::factory()->withCompartments(1)->create(['household_id' => Household::factory()->create(['owner_id' => User::factory()])]);

        $this->actingAs($user)->post(route('items.store'), [
            'name' => 'Intrus',
            'category' => 'meal',
            'quantity' => 1,
            'unit' => 'portion',
            'frozen_on' => now()->toDateString(),
            'compartment_id' => $foreign->compartments->first()->id,
        ])->assertSessionHasErrors('compartment_id');

        $this->assertDatabaseCount('items', 0);
    }

    public function test_taking_portions_decrements_and_finishes_the_batch()
    {
        [$user, $household, $freezer] = $this->userWithFreezer();
        $item = Item::factory()->create(['household_id' => $household->id, 'compartment_id' => $freezer->compartments->first()->id, 'quantity' => 3]);

        $this->actingAs($user)->post(route('items.take', $item), ['quantity' => 2])->assertRedirect();
        $this->assertSame(1, $item->fresh()->quantity);
        $this->assertNull($item->fresh()->finished_at);

        $this->actingAs($user)->post(route('items.take', $item), ['quantity' => 5])->assertSessionHasErrors('quantity');

        $this->actingAs($user)->post(route('items.take', $item), ['quantity' => 1]);
        $this->assertSame(0, $item->fresh()->quantity);
        $this->assertNotNull($item->fresh()->finished_at);

        $this->assertSame(2, $item->movements()->where('type', MovementType::Taken)->count());
    }

    public function test_restocking_brings_a_finished_batch_back()
    {
        [$user, $household, $freezer] = $this->userWithFreezer();
        $item = Item::factory()->create(['household_id' => $household->id, 'compartment_id' => $freezer->compartments->first()->id, 'quantity' => 0, 'initial_quantity' => 4, 'finished_at' => now()]);

        $this->actingAs($user)->post(route('items.restock', $item), ['quantity' => 6])->assertRedirect();

        $item->refresh();
        $this->assertSame(6, $item->quantity);
        $this->assertSame(6, $item->initial_quantity);
        $this->assertNull($item->finished_at);
    }

    public function test_moving_a_batch_records_where_it_went()
    {
        [$user, $household, $freezer] = $this->userWithFreezer();
        [$from, $to] = $freezer->compartments->all();
        $item = Item::factory()->create(['household_id' => $household->id, 'compartment_id' => $from->id]);

        $this->actingAs($user)->post(route('items.move', $item), ['compartment_id' => $to->id])->assertRedirect();

        $this->assertSame($to->id, $item->fresh()->compartment_id);
        $this->assertDatabaseHas('item_movements', [
            'item_id' => $item->id,
            'type' => MovementType::Moved->value,
            'from_compartment_id' => $from->id,
            'to_compartment_id' => $to->id,
        ]);
    }

    public function test_discarding_marks_the_batch_as_lost()
    {
        [$user, $household, $freezer] = $this->userWithFreezer();
        $item = Item::factory()->create(['household_id' => $household->id, 'compartment_id' => $freezer->compartments->first()->id, 'quantity' => 2]);

        $this->actingAs($user)->post(route('items.discard', $item), ['reason' => 'expired', 'note' => 'Trop vieux'])->assertRedirect();

        $this->assertNotNull($item->fresh()->finished_at);
        $this->assertDatabaseHas('item_movements', ['item_id' => $item->id, 'type' => MovementType::Discarded->value, 'quantity' => 2]);
    }

    public function test_inventory_lists_stock_with_locations_and_finished_batches()
    {
        [$user, $household, $freezer] = $this->userWithFreezer();
        Item::factory()->create(['household_id' => $household->id, 'compartment_id' => $freezer->compartments->first()->id, 'name' => 'Soupe']);
        Item::factory()->create(['household_id' => $household->id, 'name' => 'Fini', 'quantity' => 0, 'finished_at' => now()]);
        Item::factory()->create(['name' => 'Ailleurs']);

        $this->actingAs($user)
            ->get(route('items.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('items/index')
                ->has('items', 1)
                ->where('items.0.name', 'Soupe')
                ->where('items.0.location.freezerId', $freezer->id)
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
