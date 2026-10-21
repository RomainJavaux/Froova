<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FreezerController;
use App\Http\Controllers\HouseholdController;
use App\Http\Controllers\InvitationController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\ItemStockController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\OnboardingController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function (Request $request) {
    return $request->user()
        ? to_route('dashboard')
        : Inertia::render('welcome');
})->name('home');

Route::get('invitations/{token}', [InvitationController::class, 'show'])->name('invitations.show');

Route::middleware('auth')->group(function () {
    Route::get('onboarding', [OnboardingController::class, 'show'])->name('onboarding');
    Route::post('onboarding', [OnboardingController::class, 'store'])->name('onboarding.store');

    Route::post('invitations/{token}/accept', [InvitationController::class, 'accept'])->name('invitations.accept');

    Route::post('households', [HouseholdController::class, 'store'])->name('households.store');
    Route::put('households/{household}/switch', [HouseholdController::class, 'switch'])->name('households.switch');

    Route::middleware('household')->group(function () {
        Route::get('dashboard', DashboardController::class)->name('dashboard');

        Route::resource('freezers', FreezerController::class);

        Route::resource('items', ItemController::class);
        Route::get('items/{item}/label', [ItemController::class, 'label'])->name('items.label');
        Route::post('items/{item}/take', [ItemStockController::class, 'take'])->name('items.take');
        Route::post('items/{item}/restock', [ItemStockController::class, 'restock'])->name('items.restock');
        Route::post('items/{item}/move', [ItemStockController::class, 'move'])->name('items.move');
        Route::post('items/{item}/discard', [ItemStockController::class, 'discard'])->name('items.discard');

        Route::get('activity', ActivityController::class)->name('activity');

        Route::get('household', [HouseholdController::class, 'show'])->name('household.show');
        Route::patch('household', [HouseholdController::class, 'update'])->name('household.update');
        Route::delete('household', [HouseholdController::class, 'destroy'])->name('household.destroy');
        Route::post('household/leave', [HouseholdController::class, 'leave'])->name('household.leave');

        Route::post('household/invitations', [InvitationController::class, 'store'])->name('invitations.store');
        Route::delete('household/invitations/{invitation}', [InvitationController::class, 'destroy'])->name('invitations.destroy');

        Route::patch('household/members/{member}', [MemberController::class, 'update'])->name('members.update');
        Route::delete('household/members/{member}', [MemberController::class, 'destroy'])->name('members.destroy');
    });
});

require __DIR__.'/settings.php';
