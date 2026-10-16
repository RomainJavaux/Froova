<?php

namespace App\Http\Controllers;

use App\Enums\ItemCategory;
use App\Http\Resources\FreezerResource;
use App\Http\Resources\ItemResource;
use App\Http\Resources\MovementResource;
use App\Models\Item;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Categories suggested by the "what's for dinner?" picker.
     */
    private const MEAL_CATEGORIES = [
        ItemCategory::Meal, ItemCategory::Soup, ItemCategory::Starch, ItemCategory::Fish,
        ItemCategory::Meat, ItemCategory::Poultry, ItemCategory::Baby,
    ];

    public function __invoke(Request $request): Response
    {
        $household = $this->household($request);

        $inStock = $household->items()->inStock();

        $stats = [
            'items' => (clone $inStock)->count(),
            'units' => (int) (clone $inStock)->sum('quantity'),
            'soon' => (clone $inStock)->whereBetween('best_before', [now()->startOfDay(), now()->addDays(ItemResource::SOON_THRESHOLD_DAYS)])->count(),
            'expired' => (clone $inStock)->where('best_before', '<', now()->startOfDay())->count(),
            'members' => $household->members()->count(),
            'addedThisMonth' => $household->movements()->where('type', 'added')->where('created_at', '>=', now()->startOfMonth())->sum('quantity'),
            'takenThisMonth' => $household->movements()->where('type', 'taken')->where('created_at', '>=', now()->startOfMonth())->sum('quantity'),
        ];

        $priority = (clone $inStock)
            ->with('placements.compartment.freezer')
            ->whereNotNull('best_before')
            ->orderBy('best_before')
            ->limit(10)
            ->get();

        $suggestions = (clone $inStock)
            ->with('placements.compartment.freezer')
            ->whereIn('category', array_map(fn (ItemCategory $category) => $category->value, self::MEAL_CATEGORIES))
            ->orderBy('best_before')
            ->limit(30)
            ->get();

        $freezers = $household->freezers()
            ->with(['compartments' => fn ($query) => $query
                ->withCount('placements')
                ->withSum('placements', 'quantity')])
            ->get();

        $categories = (clone $inStock)
            ->selectRaw('category, SUM(quantity) as units, COUNT(*) as items')
            ->groupBy('category')
            ->orderByDesc('units')
            ->get()
            ->map(fn (Item $row) => [
                'category' => $row->category->value,
                'units' => (int) $row->getAttribute('units'),
                'items' => (int) $row->getAttribute('items'),
            ]);

        $activity = $household->movements()
            ->with(['user', 'fromCompartment', 'toCompartment'])
            ->latest('id')
            ->limit(8)
            ->get();

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'priority' => ItemResource::collection($priority)->resolve($request),
            'suggestions' => ItemResource::collection($suggestions)->resolve($request),
            'freezers' => FreezerResource::collection($freezers)->resolve($request),
            'categories' => $categories,
            'activity' => MovementResource::collection($activity)->resolve($request),
            'hasPasskey' => $this->user($request)->passkeys()->exists(),
        ]);
    }
}
