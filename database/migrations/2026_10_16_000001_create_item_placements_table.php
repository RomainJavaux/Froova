<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * A batch can now be split across several compartments: each placement holds part of its quantity.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('item_placements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained()->cascadeOnDelete();
            // Null means "to put away": the compartment (or its freezer) was deleted.
            $table->foreignId('compartment_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('quantity');
            $table->timestamps();

            $table->unique(['item_id', 'compartment_id']);
        });

        DB::table('items')
            ->where('quantity', '>', 0)
            ->whereNull('finished_at')
            ->orderBy('id')
            ->each(function (object $item) {
                DB::table('item_placements')->insert([
                    'item_id' => $item->id,
                    'compartment_id' => $item->compartment_id,
                    'quantity' => $item->quantity,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            });

        Schema::table('items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('compartment_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->foreignId('compartment_id')->nullable()->after('household_id')->constrained()->nullOnDelete();
        });

        // Keep the largest placement of each batch as its single location.
        DB::table('item_placements')
            ->orderBy('quantity')
            ->each(function (object $placement) {
                DB::table('items')
                    ->where('id', $placement->item_id)
                    ->update(['compartment_id' => $placement->compartment_id]);
            });

        Schema::dropIfExists('item_placements');
    }
};
