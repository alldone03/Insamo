<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class GeoProxyController extends Controller
{
    public function proxy(Request $request)
    {
        $type = $request->query('type');
        
        $urls = [
            'kab' => 'https://stamet-juanda.bmkg.go.id/radar/transparent/jatimkab.json',
            'longsor' => 'https://stamet-juanda.bmkg.go.id/radar/asset/geojson/bahaya_longsor.json',
            'airport' => 'https://stamet-juanda.bmkg.go.id/radar/asset/geojson/airport_indo.json',
        ];

        if (!isset($urls[$type])) {
            return response()->json(['error' => 'Invalid type'], 400);
        }

        $url = $urls[$type];

        // Cache for 1 hour to avoid hitting BMKG too hard
        return Cache::remember("geo_proxy_{$type}", 3600, function () use ($url) {
            $response = Http::withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
                'Accept' => 'application/json, text/plain, */*',
                'Referer' => 'https://stamet-juanda.bmkg.go.id/',
            ])->get($url);

            if ($response->successful()) {
                return $response->json();
            }

            return response()->json(['error' => 'Failed to fetch data from BMKG'], $response->status());
        });
    }
}
