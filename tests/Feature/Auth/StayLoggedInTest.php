<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class StayLoggedInTest extends TestCase
{
    use RefreshDatabase;

    public function test_stay_signed_in_sets_the_remember_cookie()
    {
        $user = User::factory()->create();

        $response = $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'password',
            'remember' => '1',
        ]);

        $response->assertCookie(Auth::guard()->getRecallerName());
        $this->assertNotNull($user->fresh()->remember_token);
    }

    public function test_registration_can_keep_the_user_signed_in()
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Camille',
            'email' => 'camille@example.com',
            'password' => 'password-froova-123',
            'password_confirmation' => 'password-froova-123',
            'remember' => '1',
        ]);

        $response->assertCookie(Auth::guard()->getRecallerName());
    }
}
