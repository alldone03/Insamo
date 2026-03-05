# API List - Insamo Backend (v2)

This list is based on the previous Laravel implementation in `backend/routes/api.php`.

## Authentication
| Method | Endpoint | Controller | Description |
|--------|----------|------------|-------------|
| POST | `/api/login` | `AuthController@login` | User login |
| POST | `/api/register` | `AuthController@register` | User registration |
| POST | `/api/logout` | `AuthController@logout` | User logout (Protected) |
| POST | `/api/refresh` | `AuthController@refresh` | Refresh auth token |
| POST | `/api/me` | `AuthController@me` | Get current user info (Protected) |

## Public Endpoints
| Method | Endpoint | Controller | Description |
|--------|----------|------------|-------------|
| POST | `/api/sensor-readings` | `SensorReadingController@store` | IoT data ingestion |
| GET | `/api/public-devices` | `DeviceController@publicIndex` | List public devices |
| GET | `/api/weather` | `WeatherReadingController@index` | List weather data |
| GET | `/api/weather/latest` | `WeatherReadingController@latest` | Latest weather data |
| POST | `/api/weather` | `WeatherReadingController@store` | Store weather data |
| POST | `/api/telegram/webhook` | `TelegramLogController@webhook` | Telegram bot integration |
| GET | `/api/geo-proxy` | `GeoProxyController@proxy` | Geospatial data proxy |

## Protected Endpoints (Requires JWT)
| Method | Endpoint | Controller | Description |
|--------|----------|------------|-------------|
| GET/POST/PUT/DELETE | `/api/roles` | `RoleController` | Role management (Resource) |
| GET/POST/PUT/DELETE | `/api/users` | `UserController` | User management (Resource) |
| POST | `/api/users/:user/devices` | `UserController@attachDevice` | Link device to user |
| DELETE | `/api/users/:user/devices/:device` | `UserController@detachDevice` | Unlink device from user |
| GET/POST/PUT/DELETE | `/api/devices` | `DeviceController` | Device management (Resource) |
| GET/POST/PUT/DELETE | `/api/device-settings` | `DeviceSettingController` | Device config (Resource) |
| GET | `/api/sensor-readings` | `SensorReadingController@index` | List sensor readings |
| GET | `/api/sensor-readings/:id` | `SensorReadingController@show` | View specific reading |
| GET/POST/PUT/DELETE | `/api/classification-results`| `ClassificationResultController` | ML result management |
| GET | `/api/system-settings` | `SystemSettingController@index` | List system config |
| POST | `/api/system-settings/:key` | `SystemSettingController@update` | Update system config |
| GET | `/api/telegram-logs` | `TelegramLogController@index` | View telegram logs |
