<?php

namespace App\Http\Controllers;

use App\Enums\HouseholdRole;
use App\Models\HouseholdInvitation;
use App\Models\User;
use App\Notifications\HouseholdInvitationNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class InvitationController extends Controller
{
    private const VALID_FOR_DAYS = 7;

    public function store(Request $request): RedirectResponse
    {
        $household = $this->household($request);
        Gate::authorize('manageMembers', $household);

        $validated = $request->validate([
            'email' => ['nullable', 'email', 'max:255'],
            'role' => ['nullable', Rule::in(HouseholdController::assignableRoles())],
        ]);

        $invitation = $household->invitations()->create([
            'invited_by' => $this->user($request)->id,
            'email' => $validated['email'] ?? null,
            'role' => $validated['role'] ?? HouseholdRole::Member->value,
            'token' => Str::random(40),
            'expires_at' => now()->addDays(self::VALID_FOR_DAYS),
        ]);

        $emailed = $invitation->email !== null && $this->sendEmail($invitation);

        Inertia::flash('invitation', [
            'id' => $invitation->id,
            'url' => $invitation->url(),
            'email' => $invitation->email,
            'emailed' => $emailed,
        ]);

        return back();
    }

    public function destroy(Request $request, HouseholdInvitation $invitation): RedirectResponse
    {
        $household = $this->household($request);
        Gate::authorize('manageMembers', $household);
        abort_unless($invitation->household_id === $household->id, 404);

        $invitation->delete();

        $this->toast('Invitation annulée', 'info');

        return back();
    }

    public function show(Request $request, string $token): Response
    {
        $invitation = HouseholdInvitation::query()
            ->where('token', $token)
            ->with(['household.members', 'inviter'])
            ->first();

        $user = $request->user();

        if ($invitation?->isPending() && $user === null) {
            // Bring the guest back here once they have signed in or created their account.
            $request->session()->put('invitation_token', $token);
            $request->session()->put('url.intended', $invitation->url());
        }

        $household = $invitation?->household;

        return Inertia::render('invitations/show', [
            'token' => $token,
            'invitation' => $invitation && $household ? [
                'status' => match (true) {
                    $invitation->accepted_at !== null => 'accepted',
                    $invitation->expires_at->isPast() => 'expired',
                    default => 'pending',
                },
                'email' => $invitation->email,
                'invitedBy' => $invitation->inviter?->name,
                'household' => [
                    'name' => $household->name,
                    'emoji' => $household->emoji,
                    'color' => $household->color,
                    'members' => $household->members->map(fn (User $member) => [
                        'id' => $member->id,
                        'name' => $member->name,
                    ])->values(),
                    'freezers' => $household->freezers()->count(),
                ],
                'alreadyMember' => $user instanceof User && $household->hasMember($user),
            ] : null,
        ]);
    }

    public function accept(Request $request, string $token): RedirectResponse
    {
        $user = $this->user($request);

        $invitation = HouseholdInvitation::query()->where('token', $token)->firstOrFail();
        $household = $invitation->household;

        if ($household->hasMember($user)) {
            $user->switchHousehold($household);
            $request->session()->forget('invitation_token');

            return to_route('dashboard');
        }

        abort_unless($invitation->isPending(), 410, 'Cette invitation n’est plus valable.');

        DB::transaction(function () use ($invitation, $household, $user) {
            $household->members()->attach($user->id, ['role' => $invitation->role->value]);

            $invitation->update([
                'accepted_at' => now(),
                'accepted_by' => $user->id,
            ]);

            $user->switchHousehold($household);
        });

        $request->session()->forget('invitation_token');

        Inertia::flash('celebrate', true);
        $this->toast("Bienvenue dans {$household->emoji} {$household->name} !");

        return to_route('dashboard');
    }

    private function sendEmail(HouseholdInvitation $invitation): bool
    {
        try {
            Notification::route('mail', $invitation->email)
                ->notify(new HouseholdInvitationNotification($invitation));

            return true;
        } catch (Throwable $exception) {
            Log::warning('Invitation email could not be sent', ['error' => $exception->getMessage()]);

            return false;
        }
    }
}
