<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
        return "200 OK\n";
    } catch (\Exception $e) {
        return "500 Error\n";
    }
});
