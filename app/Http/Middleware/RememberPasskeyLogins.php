<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RememberPasskeyLogins
{
    /**
     * Passkey sign-ins keep the user logged in, like the "stay signed in" box does for passwords.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethod('post') && $request->routeIs('passkey.login')) {
            $request->merge(['remember' => true]);
        }

        return $next($request);
    }
}
