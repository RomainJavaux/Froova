<?php

namespace App\Http\Controllers;

use App\Actions\Freezers\SaveFreezer;
use App\Actions\Households\CreateHousehold;
use App\Http\Requests\Freezers\FreezerRequest;
use App\Support\Palette;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        if ($this->user($request)->households()->exists() && ! $request->boolean('new')) {
            return to_route('dashboard');
        }

        return Inertia::render('onboarding', [
            'isAdditional' => $this->user($request)->households()->exists(),
        ]);
    }

    public function store(Request $request, CreateHousehold $createHousehold, SaveFreezer $saveFreezer): RedirectResponse
    {
        $validated = $request->validate([
            'household.name' => ['required', 'string', 'max:60'],
            'household.emoji' => ['nullable', 'string', 'max:16'],
            'household.color' => ['nullable', Rule::in(Palette::keys())],
            'freezer' => ['nullable', 'array'],
            ...FreezerRequest::freezerRules('freezer.', required: false),
        ], attributes: [
            'household.name' => 'nom du lieu',
            'freezer.name' => 'nom du congélateur',
            'freezer.compartments.*.name' => 'nom du compartiment',
        ]);

        $household = $createHousehold->handle($this->user($request), $validated['household']);

        if (! empty($validated['freezer'])) {
            $saveFreezer->handle($household, $validated['freezer']);
        }

        $request->session()->forget('invitation_token');

        $this->toast("Bienvenue chez {$household->name} ! ❄️");

        return to_route('dashboard');
    }
}
