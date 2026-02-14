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

Route::middleware('auth:api')->group(function () {
    Route::apiResource('roles', RoleController::class);
    Route::apiResource('users', UserController::class);
    Route::post('users/{user}/devices', [UserController::class, 'attachDevice']);
    Route::delete('users/{user}/devices/{device}', [UserController::class, 'detachDevice']);
    
    Route::apiResource('devices', DeviceController::class);
    Route::apiResource('device-settings', DeviceSettingController::class);
    Route::apiResource('sensor-readings', SensorReadingController::class);
    Route::apiResource('classification-results', ClassificationResultController::class);
});
