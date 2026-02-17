<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Device extends Model
{
    use HasFactory;

    protected $fillable = [
        'device_code', 'name', 'device_type',
        'latitude', 'longitude', 'address', 'image'
    ];

    /**
     * Get the full URL for the device image.
     */
    public function getImageUrlAttribute()
    {
        if (!$this->image) return null;
        if (filter_var($this->image, FILTER_VALIDATE_URL)) return $this->image;
        return asset('storage/' . $this->image);
    }

    /**
     * Get the current status of the device.
     */
    public function getStatusAttribute()
    {
        $lastReading = $this->sensorReadings()->latest('recorded_at')->first();
        if (!$lastReading) return 'INACTIVE';
        
        $lastSync = \Carbon\Carbon::parse($lastReading->recorded_at);
        if ($lastSync->diffInMinutes(now()) > 30) {
            return 'OFFLINE';
        }

        return 'ACTIVE';
    }

    protected $appends = ['image_url', 'status'];

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
