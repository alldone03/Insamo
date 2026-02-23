<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WeatherReading extends Model
{
    protected $fillable = [
        'temperature',
        'humidity',
        'pressure',
        'wind_speed',
        'recorded_at',
    ];
}
