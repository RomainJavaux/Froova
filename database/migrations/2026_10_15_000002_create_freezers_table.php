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
        Schema::create('freezers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('household_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('type', 24)->default('upright');
            $table->string('color', 24)->default('frost');
            $table->string('location')->nullable();
            $table->text('notes')->nullable();
            $table->date('last_defrosted_on')->nullable();
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();
        });

        Schema::create('compartments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('freezer_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('color', 24)->nullable();
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('compartments');
        Schema::dropIfExists('freezers');
    }
};
