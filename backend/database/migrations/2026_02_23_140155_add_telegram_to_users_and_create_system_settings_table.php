<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('telegram_chat_id')->nullable();
        });

        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        // Seed initial values
        DB::table('system_settings')->insert([
            ['key' => 'telegram_bot_token', 'value' => 'YOUR_BOT_TOKEN'],
            ['key' => 'flood_alert_template', 'value' => "🚨 *FLOOD ALERT* 🚨\nDevice: {device_name}\nStatus: {status}\nWater Level: {water_level}m\nThreshold: {threshold}m\nLocation: {location}"],
        ]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('telegram_chat_id');
        });
        Schema::dropIfExists('system_settings');
    }
};
