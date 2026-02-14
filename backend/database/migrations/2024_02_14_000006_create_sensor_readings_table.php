<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sensor_readings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained('devices')->cascadeOnDelete();
            $table->dateTime('recorded_at');
            $table->double('temperature')->nullable();
            $table->double('humidity')->nullable();
            $table->double('wind_speed')->nullable();
            $table->double('water_level')->nullable();
            $table->double('tilt_x')->nullable();
            $table->double('tilt_y')->nullable();
            $table->double('magnitude')->nullable();
            $table->float('landslide_score')->nullable();
            $table->string('landslide_status')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sensor_readings');
    }
};
