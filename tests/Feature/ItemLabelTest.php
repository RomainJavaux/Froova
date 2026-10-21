<?php

namespace Tests\Feature;

use App\Models\Item;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ItemLabelTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_detailed_label_is_the_default()
    {
        [$user, $household] = $this->userWithFreezer();
        $item = Item::factory()->create(['household_id' => $household->id, 'name' => 'Lasagnes']);

        $this->actingAs($user)
            ->get(route('items.label', $item))
            ->assertInertia(fn (Assert $page) => $page
                ->component('items/label')
                ->where('item.name', 'Lasagnes')
                ->where('format', 'detailed'));
    }

    public function test_the_square_qr_label_can_be_chosen()
    {
        [$user, $household] = $this->userWithFreezer();
        $item = Item::factory()->create(['household_id' => $household->id]);

        $this->actingAs($user)
            ->get(route('items.label', ['item' => $item, 'format' => 'square']))
            ->assertInertia(fn (Assert $page) => $page->where('format', 'square'));

        $this->actingAs($user)
            ->get(route('items.label', ['item' => $item, 'format' => 'nope']))
            ->assertInertia(fn (Assert $page) => $page->where('format', 'detailed'));
    }

    public function test_labels_of_other_households_are_off_limits()
    {
        [$user] = $this->userWithFreezer();

        $this->actingAs($user)->get(route('items.label', Item::factory()->create()))->assertForbidden();
    }
}
