<?php

namespace App\Actions\Freezers;

use App\Models\Compartment;
use App\Models\Freezer;
use App\Models\Household;
use Illuminate\Support\Facades\DB;

class SaveFreezer
{
    /**
     * Create or update a freezer together with its ordered list of compartments.
     *
     * Items stored in a compartment that disappears are moved to the first remaining one.
     *
     * @param  array{name: string, type: string, color: string, location?: string|null, notes?: string|null, last_defrosted_on?: string|null, compartments: list<array{id?: int|null, name: string, color?: string|null}>}  $data
     */
    public function handle(Household $household, array $data, ?Freezer $freezer = null): Freezer
    {
        return DB::transaction(function () use ($household, $data, $freezer) {
            $attributes = [
                'name' => $data['name'],
                'type' => $data['type'],
                'color' => $data['color'],
                'location' => $data['location'] ?? null,
                'notes' => $data['notes'] ?? null,
                'last_defrosted_on' => $data['last_defrosted_on'] ?? null,
            ];

            if ($freezer === null) {
                $freezer = $household->freezers()->create([
                    ...$attributes,
                    'position' => (int) $household->freezers()->max('position') + 1,
                ]);
            } else {
                $freezer->update($attributes);
            }

            $this->syncCompartments($freezer, $data['compartments']);

            return $freezer->load('compartments');
        });
    }

    /**
     * @param  list<array{id?: int|null, name: string, color?: string|null}>  $compartments
     */
    private function syncCompartments(Freezer $freezer, array $compartments): void
    {
        $existing = $freezer->compartments()->get()->keyBy('id');
        $kept = [];

        foreach (array_values($compartments) as $index => $data) {
            $compartment = isset($data['id']) ? $existing->get($data['id']) : null;

            $attributes = [
                'name' => $data['name'],
                'color' => $data['color'] ?? null,
                'position' => $index + 1,
            ];

            if ($compartment instanceof Compartment) {
                $compartment->update($attributes);
            } else {
                $compartment = $freezer->compartments()->create($attributes);
            }

            $kept[] = $compartment->id;
        }

        $removed = $existing->keys()->diff($kept);

        if ($removed->isNotEmpty()) {
            $fallback = $kept[0] ?? null;

            DB::table('items')
                ->whereIn('compartment_id', $removed->all())
                ->update(['compartment_id' => $fallback]);

            Compartment::query()->whereIn('id', $removed->all())->delete();
        }
    }
}
