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
        Schema::table('sensor_readings', function (Blueprint $table) {
            $table->double('soil_moisture')->nullable();
            $table->double('vib_x')->nullable();
            $table->double('vib_y')->nullable();
            $table->double('vib_z')->nullable();
            $table->double('gyro_x')->nullable();
            $table->double('gyro_y')->nullable();
            $table->double('gyro_z')->nullable();
            $table->double('rainfall_intensity')->nullable();
            $table->double('device_tilt')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sensor_readings', function (Blueprint $table) {
            $table->dropColumn([
                'soil_moisture',
                'vib_x', 'vib_y', 'vib_z',
                'gyro_x', 'gyro_y', 'gyro_z',
                'rainfall_intensity',
                'device_tilt'
            ]);
        });
    }
};
