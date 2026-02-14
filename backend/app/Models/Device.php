<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Device extends Model
{
    use HasFactory;

    protected $fillable = [
        'device_code', 'name', 'device_type',
        'latitude', 'longitude', 'address'
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'device_user');
    }

    public function settings()
    {
        return $this->hasOne(DeviceSetting::class);
    }

    public function sensorReadings()
    {
        return $this->hasMany(SensorReading::class);
    }

    public function classificationResults()
    {
        return $this->hasMany(ClassificationResult::class);
    }
}
