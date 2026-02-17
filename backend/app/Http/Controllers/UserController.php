<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        return User::with('role')->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
            'role_id' => 'nullable|exists:roles,id',
            'photo_path' => 'nullable|string'
        ]);

        $data = $request->all();
        $data['password'] = Hash::make($data['password']);

        return User::create($data);
    }

    public function show(User $user)
    {
        return $user->load('role', 'devices');
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'sometimes|required',
            'email' => 'sometimes|required|email|unique:users,email,'.$user->id,
            'password' => 'sometimes|required|min:6',
            'role_id' => 'nullable|exists:roles,id',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $data = $request->except(['password', 'photo']);
        if ($request->has('password')) {
            $data['password'] = Hash::make($request->password);
        }

        if ($request->hasFile('photo')) {
            // Delete old photo if exists
            if ($user->photo_path && \Storage::disk('public')->exists($user->photo_path)) {
                \Storage::disk('public')->delete($user->photo_path);
            }
            $path = $request->file('photo')->store('profiles', 'public');
            $data['photo_path'] = $path;
        }

        $user->update($data);
        return $user;
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response(null, 204);
    }

    public function attachDevice(Request $request, User $user)
    {
        $request->validate(['device_id' => 'required|exists:devices,id']);
        $user->devices()->syncWithoutDetaching([$request->device_id]);
        return response()->json(['message' => 'Device attached successfully', 'user' => $user->load('devices')]);
    }

    public function detachDevice(User $user, $deviceId)
    {
        $user->devices()->detach($deviceId);
        return response()->json(['message' => 'Device detached successfully', 'user' => $user->load('devices')]);
    }
}
