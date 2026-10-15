<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('household_id')->constrained()->cascadeOnDelete();
            $table->foreignId('compartment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name');
            $table->string('emoji', 16)->nullable();
            $table->string('category', 24)->default('meal');
            $table->text('description')->nullable();
            $table->string('photo_path')->nullable();
            $table->unsignedInteger('quantity')->default(1);
            $table->unsignedInteger('initial_quantity')->default(1);
            $table->string('unit', 16)->default('portion');
            $table->unsignedTinyInteger('servings')->nullable();
            $table->unsignedInteger('weight_grams')->nullable();
            $table->date('prepared_on')->nullable();
            $table->date('frozen_on');
            $table->date('best_before')->nullable();
            $table->json('tags')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();

            $table->index(['household_id', 'finished_at']);
            $table->index(['household_id', 'best_before']);
        });

        Schema::create('item_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('household_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type', 16);
            $table->string('item_name');
            $table->string('item_emoji', 16)->nullable();
            $table->integer('quantity')->nullable();
            $table->foreignId('from_compartment_id')->nullable()->constrained('compartments')->nullOnDelete();
            $table->foreignId('to_compartment_id')->nullable()->constrained('compartments')->nullOnDelete();
            $table->string('note')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['household_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('item_movements');
        Schema::dropIfExists('items');
    }
};
