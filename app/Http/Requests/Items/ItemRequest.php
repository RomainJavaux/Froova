<?php

namespace App\Http\Requests\Items;

use App\Enums\ItemCategory;
use App\Enums\ItemUnit;
use App\Models\Compartment;
use App\Models\Household;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ItemRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'emoji' => ['nullable', 'string', 'max:16'],
            'category' => ['required', Rule::enum(ItemCategory::class)],
            'description' => ['nullable', 'string', 'max:2000'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:15360'],
            'remove_photo' => ['sometimes', 'boolean'],
            'quantity' => [$this->isMethod('post') ? 'required' : 'sometimes', 'integer', 'min:1', 'max:999'],
            'unit' => ['required', Rule::enum(ItemUnit::class)],
            'servings' => ['nullable', 'integer', 'min:1', 'max:30'],
            'weight_grams' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'prepared_on' => ['nullable', 'date', 'before_or_equal:tomorrow'],
            'frozen_on' => ['required', 'date', 'before_or_equal:tomorrow'],
            'best_before' => ['nullable', 'date', 'after_or_equal:frozen_on'],
            'tags' => ['nullable', 'array', 'max:8'],
            'tags.*' => ['string', 'max:30'],
            'compartment_id' => ['required', 'integer', $this->compartmentBelongsToHousehold()],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'compartment_id' => 'emplacement',
            'frozen_on' => 'date de congélation',
            'prepared_on' => 'date de préparation',
            'best_before' => 'date limite',
            'weight_grams' => 'poids',
            'servings' => 'nombre de parts',
        ];
    }

    public function compartment(): Compartment
    {
        return Compartment::query()->findOrFail($this->integer('compartment_id'));
    }

    private function compartmentBelongsToHousehold(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail) {
            $household = $this->attributes->get('household');

            $exists = $household instanceof Household && Compartment::query()
                ->whereKey($value)
                ->whereHas('freezer', fn ($query) => $query->where('household_id', $household->id))
                ->exists();

            if (! $exists) {
                $fail('Choisis un emplacement dans un de tes congélateurs.');
            }
        };
    }
}
