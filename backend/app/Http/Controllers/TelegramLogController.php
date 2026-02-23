<?php

namespace App\Http\Controllers;

use App\Models\TelegramLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TelegramLogController extends Controller
{
    public function index()
    {
        return TelegramLog::with('user')->latest()->paginate(50);
    }

    public function destroy($id)
    {
        $log = TelegramLog::findOrFail($id);
        $log->delete();
        return response()->json(['message' => 'Log deleted']);
    }

    public function webhook(Request $request)
    {
        Log::info('Telegram Webhook Received:', $request->all());

        if ($request->has('message')) {
            $chatId = $request->input('message.chat.id');
            $text = $request->input('message.text');
            $user = \App\Models\User::where('telegram_chat_id', $chatId)->first();

            TelegramLog::create([
                'chat_id' => $chatId,
                'user_id' => $user ? $user->id : null,
                'message' => $text,
                'type' => 'received'
            ]);
        }

        return response()->json(['status' => 'ok']);
    }
}
