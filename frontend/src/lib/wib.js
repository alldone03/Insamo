// This app only ever deals in WIB (Asia/Jakarta, UTC+7) wall-clock time.
// Backend returns recorded_at as a plain "YYYY-MM-DD HH:MM:SS" WIB string
// with no timezone marker (see backend/src/lib/wib.ts) — these helpers are
// the only place the frontend should touch that value. No Date-based
// timezone conversion, anywhere else.

const BULAN = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function extractParts(ts) {
    if (!ts) return null;
    const m = String(ts).match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
    if (!m) return null;
    const [, y, mo, d, h, mi, s] = m;
    return { y, mo, d, h, mi, s };
}

/** "17 Agustus 2026, 09:30" */
export function formatWIBLong(ts) {
    const p = extractParts(ts);
    if (!p) return ts || '-';
    return `${parseInt(p.d, 10)} ${BULAN[parseInt(p.mo, 10) - 1]} ${p.y}, ${p.h}:${p.mi}`;
}

/** "17 Agustus 2026, 09:30:00" */
export function formatWIBLongWithSeconds(ts) {
    const p = extractParts(ts);
    if (!p) return ts || '-';
    return `${parseInt(p.d, 10)} ${BULAN[parseInt(p.mo, 10) - 1]} ${p.y}, ${p.h}:${p.mi}:${p.s}`;
}

/** "17/08/2026, 09.30.00" */
export function formatWIBShort(ts) {
    const p = extractParts(ts);
    if (!p) return ts || '-';
    return `${p.d}/${p.mo}/${p.y}, ${p.h}.${p.mi}.${p.s}`;
}

/** "09:30" */
export function formatWIBTimeOnly(ts) {
    const p = extractParts(ts);
    if (!p) return '';
    return `${p.h}:${p.mi}`;
}

/** "09:30:00" */
export function formatWIBTimeWithSeconds(ts) {
    const p = extractParts(ts);
    if (!p) return '';
    return `${p.h}:${p.mi}:${p.s}`;
}

/** Real epoch instant for a stored WIB string, for duration/"is online" math. */
export function wibStringToDate(ts) {
    if (!ts) return new Date(0);
    const p = extractParts(ts);
    if (!p) return new Date(ts);
    return new Date(`${p.y}-${p.mo}-${p.d}T${p.h}:${p.mi}:${p.s}+07:00`);
}

/** Converts an unambiguous instant (a real Date, or an ISO string with a
 * timezone marker) into the "YYYY-MM-DD HH:MM:SS" WIB string format, for the
 * rare case a placeholder "now" needs to be formatted before any reading with
 * a backend-supplied recorded_at exists yet. */
export function nowAsWIBString(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).formatToParts(date);
    const get = (type) => parts.find((p) => p.type === type)?.value ?? '00';
    return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}
