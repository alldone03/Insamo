<?php

namespace App\Http\Controllers;

use App\Models\ClassificationResult;
use Illuminate\Http\Request;

class ClassificationResultController extends Controller
{
    public function index(Request $request)
    {
         $query = ClassificationResult::query();
        if ($request->has('device_id')) {
            $query->where('device_id', $request->device_id);
        }
        return $query->latest()->paginate(50);
    }

    public function store(Request $request)
    {
         $request->validate([
            'device_id' => 'required|exists:devices,id',
            'label' => 'required',
            'confidence' => 'required|numeric'
        ]);
        return ClassificationResult::create($request->all());
    }
}
