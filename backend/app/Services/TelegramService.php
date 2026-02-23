<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TelegramService
{
    public static function sendMessage($chatId, $message)
    {
        $token = DB::table('system_settings')->where('key', 'telegram_bot_token')->value('value');
        
        if (!$token || $token === 'YOUR_BOT_TOKEN') {
            Log::warning('Telegram bot token not configured.');
            return;
        }

        try {
            $response = Http::post("https://api.telegram.org/bot{$token}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $message,
                'parse_mode' => 'Markdown',
            ]);

            if ($response->successful()) {
                $user = \App\Models\User::where('telegram_chat_id', $chatId)->first();
                \App\Models\TelegramLog::create([
                    'chat_id' => $chatId,
                    'user_id' => $user ? $user->id : null,
                    'message' => $message,
                    'type' => 'sent'
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Failed to send Telegram message: ' . $e->getMessage());
        }
    }

    public static function sendFloodAlert($device, $status, $waterLevel, $threshold)
    {
        $template = DB::table('system_settings')->where('key', 'flood_alert_template')->value('value');
        
        $message = str_replace(
            ['{device_name}', '{status}', '{water_level}', '{threshold}', '{location}'],
            [$device->name, $status, $waterLevel, $threshold, $device->address],
            $template
        );

        // Find users attached to this device
        $users = $device->users()->whereNotNull('telegram_chat_id')->get();

        foreach ($users as $user) {
            self::sendMessage($user->telegram_chat_id, $message);
        }
    }
}
