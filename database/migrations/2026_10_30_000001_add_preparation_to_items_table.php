<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * How to get a batch from the freezer to the plate.
     */
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->string('thaw', 20)->nullable()->after('description');
            $table->string('reheat_method', 20)->nullable()->after('thaw');
            $table->unsignedSmallInteger('reheat_minutes')->nullable()->after('reheat_method');
            $table->unsignedSmallInteger('reheat_temperature')->nullable()->after('reheat_minutes');
            $table->json('extras')->nullable()->after('reheat_temperature');
            $table->text('reheat_notes')->nullable()->after('extras');
        });
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn(['thaw', 'reheat_method', 'reheat_minutes', 'reheat_temperature', 'extras', 'reheat_notes']);
        });
    }
};
