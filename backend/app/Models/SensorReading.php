<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SensorReading extends Model
{
    use HasFactory;

    protected $fillable = [
        'device_id', 'recorded_at',
        'temperature', 'humidity', 'wind_speed', 'water_level',
        'tilt_x', 'tilt_y', 'tilt_z', 'magnitude',
        'landslide_score', 'landslide_status',
        'soil_moisture', 'vib_x', 'vib_y', 'vib_z',
        'gyro_x', 'gyro_y', 'gyro_z',
        'rainfall_intensity', 'device_tilt'
    ];

    protected $casts = [
        'recorded_at' => 'datetime',
    ];

    const UPDATED_AT = null;

    public function device()
    {
        return $this->belongsTo(Device::class);
    }

    public function classificationResults()
    {
        return $this->hasMany(ClassificationResult::class);
    }
}
