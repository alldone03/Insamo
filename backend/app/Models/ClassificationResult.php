<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClassificationResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'sensor_reading_id', 'device_id', 'label', 'confidence'
    ];

    const UPDATED_AT = null;

    public function sensorReading()
    {
        return $this->belongsTo(SensorReading::class);
    }

    public function device()
    {
        return $this->belongsTo(Device::class);
    }
}
