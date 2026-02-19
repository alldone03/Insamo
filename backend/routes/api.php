<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\DeviceSettingController;
use App\Http\Controllers\SensorReadingController;
use App\Http\Controllers\ClassificationResultController;

Route::controller(AuthController::class)->group(function () {
    Route::post('login', 'login');
    Route::post('register', 'register');
    Route::post('logout', 'logout');
    Route::post('refresh', 'refresh');
    Route::post('me', 'me');
});

// Public endpoint for IoT devices to send sensor data
Route::post('sensor-readings', [SensorReadingController::class, 'store']);
Route::get('public-devices', [DeviceController::class, 'publicIndex']);

Route::middleware('auth:api')->group(function () {
    Route::apiResource('roles', RoleController::class);
    Route::apiResource('users', UserController::class);
    Route::post('users/{user}/devices', [UserController::class, 'attachDevice']);
    Route::delete('users/{user}/devices/{device}', [UserController::class, 'detachDevice']);
    
    Route::apiResource('devices', DeviceController::class);
    Route::apiResource('device-settings', DeviceSettingController::class);
    
    // Sensor readings (except store which is public)
    Route::get('sensor-readings', [SensorReadingController::class, 'index']);
    Route::get('sensor-readings/{sensorReading}', [SensorReadingController::class, 'show']);
    
    Route::apiResource('classification-results', ClassificationResultController::class);
});
