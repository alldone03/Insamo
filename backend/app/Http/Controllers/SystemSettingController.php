<?php

namespace App\Http\Controllers;

use App\Models\SystemSetting;
use Illuminate\Http\Request;

class SystemSettingController extends Controller
{
    public function index()
    {
        return SystemSetting::all();
    }

    public function update(Request $request, $key)
    {
        $setting = SystemSetting::where('key', $key)->first();
        if (!$setting) {
            $setting = SystemSetting::create(['key' => $key, 'value' => $request->value]);
        } else {
            $setting->update(['value' => $request->value]);
        }
        return $setting;
    }

    public function getMany(Request $request)
    {
        $keys = $request->input('keys', []);
        return SystemSetting::whereIn('key', $keys)->get();
    }
}
