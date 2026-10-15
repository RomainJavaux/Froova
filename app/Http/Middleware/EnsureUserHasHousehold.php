<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasHousehold
{
    /**
     * Send users without a household to the onboarding (or to the invitation they were following).
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $household = $request->user()?->activeHousehold();

        if ($household === null) {
            $token = $request->session()->get('invitation_token');

            return is_string($token)
                ? redirect()->route('invitations.show', $token)
                : redirect()->route('onboarding');
        }

        $request->attributes->set('household', $household);

        return $next($request);
    }
}
