// This app only ever deals in WIB (Asia/Jakarta, UTC+7) wall-clock time.
// sensor_readings.recorded_at is stored as a plain "YYYY-MM-DD HH:MM:SS"
// WIB string end to end (schema.ts, mode: 'string') — no Date object
// round-trip, no implicit timezone conversion, anywhere. These helpers are
// the only place that ever converts between that string and a real instant.

/** Devices report local time with no timezone marker; trust it as WIB as-is. */
export function normalizeToWIBString(ts?: string): string {
  if (!ts) return formatNowAsWIB();
  return ts.replace('T', ' ').replace(/(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/, '').trim();
}

export function formatNowAsWIB(): string {
  return isoInstantToWIBString(new Date().toISOString());
}

/** Converts an unambiguous instant (has a timezone marker) into a WIB string. */
export function isoInstantToWIBString(isoTs: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(new Date(isoTs));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

/** Converts a stored WIB string back into a real epoch instant, for duration math. */
export function wibStringToInstant(wibTs: string): Date {
  return new Date(`${wibTs.replace(' ', 'T')}+07:00`);
}
