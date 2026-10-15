<?php

namespace Tests\Feature;

use App\Models\Household;
use App\Models\HouseholdInvitation;
use App\Models\User;
use App\Notifications\HouseholdInvitationNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class HouseholdTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_create_an_invitation_and_email_it()
    {
        Notification::fake();
        [$owner, $household] = $this->userWithFreezer();

        $this->actingAs($owner)
            ->post(route('invitations.store'), ['email' => 'camille@example.com', 'role' => 'admin'])
            ->assertRedirect();

        $invitation = HouseholdInvitation::query()->firstOrFail();

        $this->assertSame($household->id, $invitation->household_id);
        $this->assertSame('admin', $invitation->role->value);
        Notification::assertSentOnDemand(HouseholdInvitationNotification::class);
    }

    public function test_members_cannot_invite()
    {
        [, $household] = $this->userWithFreezer();
        $member = User::factory()->create();
        $household->members()->attach($member->id, ['role' => 'member']);

        $this->actingAs($member)->post(route('invitations.store'))->assertForbidden();
    }

    public function test_guest_following_an_invitation_is_brought_back_after_signing_up()
    {
        [, $household] = $this->userWithFreezer();
        $invitation = $this->invitationFor($household);

        $this->get(route('invitations.show', $invitation->token))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('invitation.status', 'pending'));

        $this->post(route('register.store'), [
            'name' => 'Camille',
            'email' => 'camille@example.com',
            'password' => 'password-froova-123',
            'password_confirmation' => 'password-froova-123',
        ])->assertRedirect(route('invitations.show', $invitation->token));
    }

    public function test_accepting_an_invitation_joins_the_household()
    {
        [, $household] = $this->userWithFreezer();
        $invitation = $this->invitationFor($household, 'admin');
        $camille = User::factory()->create();

        $this->actingAs($camille)
            ->post(route('invitations.accept', $invitation->token))
            ->assertRedirect(route('dashboard'));

        $this->assertSame('admin', $household->roleOf($camille)?->value);
        $this->assertSame($household->id, $camille->fresh()->current_household_id);
        $this->assertNotNull($invitation->fresh()->accepted_at);
    }

    public function test_expired_invitations_cannot_be_used()
    {
        [, $household] = $this->userWithFreezer();
        $invitation = $this->invitationFor($household);
        $invitation->update(['expires_at' => now()->subDay()]);

        $this->actingAs(User::factory()->create())
            ->post(route('invitations.accept', $invitation->token))
            ->assertStatus(410);
    }

    public function test_members_can_switch_between_their_households()
    {
        [$user] = $this->userWithFreezer();
        $chalet = Household::factory()->create(['owner_id' => $user->id, 'name' => 'Chalet']);

        $this->actingAs($user)->put(route('households.switch', $chalet))->assertRedirect(route('dashboard'));
        $this->assertSame($chalet->id, $user->fresh()->current_household_id);

        $stranger = Household::factory()->create(['owner_id' => User::factory()]);
        $this->actingAs($user)->put(route('households.switch', $stranger))->assertForbidden();
    }

    public function test_admin_can_remove_a_member_but_not_the_owner()
    {
        [$owner, $household] = $this->userWithFreezer();
        $admin = User::factory()->create();
        $member = User::factory()->create();
        $household->members()->attach([$admin->id => ['role' => 'admin'], $member->id => ['role' => 'member']]);

        $this->actingAs($admin)->delete(route('members.destroy', $owner))->assertForbidden();
        $this->actingAs($admin)->delete(route('members.destroy', $member))->assertRedirect();

        $this->assertFalse($household->hasMember($member));
    }

    public function test_member_can_leave_but_owner_cannot()
    {
        [$owner, $household] = $this->userWithFreezer();
        $member = User::factory()->create();
        $household->members()->attach($member->id, ['role' => 'member']);
        $member->switchHousehold($household);

        $this->actingAs($owner)->post(route('household.leave'))->assertForbidden();
        $this->actingAs($member)->post(route('household.leave'))->assertRedirect(route('dashboard'));

        $this->assertFalse($household->hasMember($member));
    }

    public function test_owner_deletes_household_only_after_typing_its_name()
    {
        [$owner, $household] = $this->userWithFreezer();

        $this->actingAs($owner)->delete(route('household.destroy'), ['confirmation' => 'nope'])->assertSessionHasErrors('confirmation');
        $this->actingAs($owner)->delete(route('household.destroy'), ['confirmation' => $household->name])->assertRedirect(route('dashboard'));

        $this->assertModelMissing($household);
    }

    private function invitationFor(Household $household, string $role = 'member'): HouseholdInvitation
    {
        return $household->invitations()->create([
            'token' => str_repeat('a', 40),
            'role' => $role,
            'expires_at' => now()->addWeek(),
        ]);
    }
}
