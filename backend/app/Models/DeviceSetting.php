<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeviceSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'device_id', 'initial_distance', 'alert_threshold', 'danger_threshold'
    ];

    public function device()
    {
        return $this->belongsTo(Device::class);
    }
}
