<?php

namespace App\Http\Requests\Freezers;

use App\Enums\FreezerType;
use App\Support\Palette;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FreezerRequest extends FormRequest
{
    /**
     * Shared rules, also reused by the onboarding under a "freezer." prefix.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public static function freezerRules(string $prefix = '', bool $required = true): array
    {
        $type = FreezerType::tryFrom((string) request()->input($prefix.'type')) ?? FreezerType::Upright;
        $presence = $required ? 'required' : 'required_with:'.rtrim($prefix, '.');

        return [
            $prefix.'name' => [$presence, 'string', 'max:60'],
            $prefix.'type' => [$presence, Rule::enum(FreezerType::class)],
            $prefix.'color' => [$presence, Rule::in(Palette::keys())],
            $prefix.'location' => ['nullable', 'string', 'max:60'],
            $prefix.'notes' => ['nullable', 'string', 'max:1000'],
            $prefix.'last_defrosted_on' => ['nullable', 'date', 'before_or_equal:today'],
            $prefix.'compartments' => [$presence, 'array', 'min:1', 'max:'.$type->maxCompartments()],
            $prefix.'compartments.*.id' => ['nullable', 'integer'],
            $prefix.'compartments.*.name' => ['required', 'string', 'max:40'],
            $prefix.'compartments.*.color' => ['nullable', Rule::in(Palette::keys())],
        ];
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return self::freezerRules();
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'compartments' => 'compartiments',
            'compartments.*.name' => 'nom du compartiment',
        ];
    }
}
