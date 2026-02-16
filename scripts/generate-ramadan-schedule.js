#!/usr/bin/env node

/**
 * Generate Ramadan schedule SQL for all cities.
 *
 * Uses the EXACT same prayer time calculation as the React Native app
 * (CalculatedPrayerTime from @shkomaghdid/react-native-prayer-times).
 *
 * For cities with 0,0 coordinates, it searches the Muslim DB by city name.
 *
 * Usage:
 *   cd MyPrayersTest
 *   npm install better-sqlite3
 *   node scripts/generate-ramadan-schedule.js
 *
 * Output: ramadan_schedule.sql in the project root.
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════
const TIMEZONE = 3; // Iraq UTC+3

// Date range: 18 Feb 2026 – 20 Mar 2026
const START_DATE = new Date(2026, 1, 18); // Feb 18
const END_DATE = new Date(2026, 2, 20);   // Mar 20

const DB_PATH = path.join(
  __dirname,
  '..',
  '..',
  'react-native-prayer-times',
  'assets',
  'custom',
  'muslim_db_v3.0.0.db',
);

// ═══════════════════════════════════════════════════════════════
// Enums & Constants (ported from the library)
// ═══════════════════════════════════════════════════════════════
const CalculationMethod = {
  makkah: 'makkah',
  mwl: 'mwl',
  isna: 'isna',
  karachi: 'karachi',
  egypt: 'egypt',
  jafari: 'jafari',
  tehran: 'tehran',
  custom: 'custom',
};

const AsrMethod = { shafii: 0, hanafi: 1 };

const HigherLatitudeMethod = {
  angleBased: 'angleBased',
  midNight: 'midNight',
  oneSeven: 'oneSeven',
  none: 'none',
};

function getMethodParams() {
  return {
    [CalculationMethod.makkah]: [18.5, 1.0, 0.0, 1.0, 90.0],
    [CalculationMethod.mwl]: [18.0, 1.0, 0.0, 0.0, 17.0],
    [CalculationMethod.isna]: [15.0, 1.0, 0.0, 0.0, 15.0],
    [CalculationMethod.karachi]: [18.0, 1.0, 0.0, 0.0, 18.0],
    [CalculationMethod.egypt]: [19.5, 1.0, 0.0, 0.0, 17.5],
    [CalculationMethod.jafari]: [16.0, 0.0, 4.0, 0.0, 14.0],
    [CalculationMethod.tehran]: [17.7, 0.0, 4.5, 0.0, 14.0],
    [CalculationMethod.custom]: [18.0, 1.0, 0.0, 0.0, 17.0],
  };
}

// Default attribute — same as the app's default
const DEFAULT_ATTRIBUTE = {
  calculationMethod: CalculationMethod.makkah,
  asrMethod: AsrMethod.shafii,
  higherLatitudeMethod: HigherLatitudeMethod.angleBased,
  offset: [0, 0, 0, 0, 0, 0],
};

// ═══════════════════════════════════════════════════════════════
// CalculatedPrayerTime — ported verbatim from the library
// ═══════════════════════════════════════════════════════════════
class CalculatedPrayerTime {
  constructor(attribute) {
    this.attribute = attribute;
    this.methodParams = getMethodParams();
    this.lat = 0;
    this.lng = 0;
    this.timeZone = 0;
    this.jDate = 0;
    this.invalidTime = '-----';
    this.numIterations = 1;
  }

  fixAngle(a) {
    a -= 360 * Math.floor(a / 360.0);
    return a < 0 ? a + 360 : a;
  }
  fixHour(a) {
    a -= 24.0 * Math.floor(a / 24.0);
    return a < 0 ? a + 24 : a;
  }
  radiansToDegrees(alpha) {
    return (alpha * 180.0) / Math.PI;
  }
  degreesToRadians(alpha) {
    return (alpha * Math.PI) / 180.0;
  }
  dSin(d) {
    return Math.sin(this.degreesToRadians(d));
  }
  dCos(d) {
    return Math.cos(this.degreesToRadians(d));
  }
  dTan(d) {
    return Math.tan(this.degreesToRadians(d));
  }
  dArcSin(x) {
    return this.radiansToDegrees(Math.asin(x));
  }
  dArcCos(x) {
    return this.radiansToDegrees(Math.acos(x));
  }
  dArcTan2(y, x) {
    return this.radiansToDegrees(Math.atan2(y, x));
  }
  dArcCot(x) {
    return this.radiansToDegrees(Math.atan2(1.0, x));
  }

  julianDate(year, month, day) {
    let y = year;
    let m = month;
    if (m <= 2) {
      y -= 1;
      m += 12;
    }
    const a = Math.floor(y / 100.0);
    const b = 2 - a + Math.floor(a / 4.0);
    return (
      Math.floor(365.25 * (y + 4716)) +
      Math.floor(30.6001 * (m + 1)) +
      day +
      b -
      1524.5
    );
  }

  sunPosition(jd) {
    const d1 = jd - 2451545;
    const g = this.fixAngle(357.529 + 0.98560028 * d1);
    const q = this.fixAngle(280.459 + 0.98564736 * d1);
    const l = this.fixAngle(
      q + 1.915 * this.dSin(g) + 0.02 * this.dSin(2 * g),
    );
    const e = 23.439 - 0.00000036 * d1;
    const d2 = this.dArcSin(this.dSin(e) * this.dSin(l));
    let ra =
      this.dArcTan2(this.dCos(e) * this.dSin(l), this.dCos(l)) / 15.0;
    ra = this.fixHour(ra);
    const eqt = q / 15.0 - ra;
    return [d2, eqt];
  }

  equationOfTime(jd) {
    return this.sunPosition(jd)[1];
  }
  sunDeclination(jd) {
    return this.sunPosition(jd)[0];
  }

  computeMidDay(t) {
    const eqt = this.equationOfTime(this.jDate + t);
    return this.fixHour(12 - eqt);
  }

  computeTime(G, t) {
    const d = this.sunDeclination(this.jDate + t);
    const z = this.computeMidDay(t);
    const beg = -this.dSin(G) - this.dSin(d) * this.dSin(this.lat);
    const mid = this.dCos(d) * this.dCos(this.lat);
    const v = this.dArcCos(beg / mid) / 15.0;
    return z + (G > 90 ? -v : v);
  }

  computeAsr(step, t) {
    const d = this.sunDeclination(this.jDate + t);
    const g = -this.dArcCot(step + this.dTan(Math.abs(this.lat - d)));
    return this.computeTime(g, t);
  }

  timeDiff(time1, time2) {
    return this.fixHour(time2 - time1);
  }

  getPrayerTimes(location, date, timezone) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    this.timeZone = timezone ?? -date.getTimezoneOffset() / 60.0;
    this.lat = location.latitude;
    this.lng = location.longitude;
    this.jDate = this.julianDate(year, month, day);
    const lonDiff = location.longitude / (15.0 * 24.0);
    this.jDate -= lonDiff;

    try {
      const cTime = this.computeDayTimes();
      return {
        fajr: timeStringToDate(cTime[0], date),
        sunrise: timeStringToDate(cTime[1], date),
        dhuhr: timeStringToDate(cTime[2], date),
        asr: timeStringToDate(cTime[3], date),
        maghrib: timeStringToDate(cTime[4], date),
        isha: timeStringToDate(cTime[5], date),
      };
    } catch {
      return null;
    }
  }

  floatToTime24(time) {
    if (isNaN(time)) return this.invalidTime;
    const fixedTime = this.fixHour(time + 0.5 / 60.0);
    const hours = Math.floor(fixedTime);
    const minutes = Math.floor((fixedTime - hours) * 60.0);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  computeTimes(times) {
    const t = this.dayPortion(times);
    const params = this.methodParams[this.attribute.calculationMethod];
    const fajr = this.computeTime(180 - params[0], t[0]);
    const sunrise = this.computeTime(180 - 0.833, t[1]);
    const dhuhr = this.computeMidDay(t[2]);
    const asr = this.computeAsr(1 + this.attribute.asrMethod, t[3]);
    const sunset = this.computeTime(0.833, t[4]);
    const maghrib = this.computeTime(params[2], t[5]);
    const isha = this.computeTime(params[4], t[6]);
    return [fajr, sunrise, dhuhr, asr, sunset, maghrib, isha];
  }

  computeDayTimes() {
    let times = [5.0, 6.0, 12.0, 13.0, 18.0, 18.0, 18.0];
    for (let i = 0; i < this.numIterations; i++) {
      times = this.computeTimes(times);
    }
    times = this.adjustTimes(times);
    return this.adjustTimesFormat(times);
  }

  adjustTimes(times) {
    const params = this.methodParams[this.attribute.calculationMethod];
    for (let i = 0; i < times.length; i++) {
      times[i] += this.timeZone - this.lng / 15;
    }
    if (params[1] === 1.0) {
      times[5] = times[4] + params[2] / 60;
    }
    if (params[3] === 1.0) {
      times[6] = times[5] + params[4] / 60;
    }
    if (this.attribute.higherLatitudeMethod !== HigherLatitudeMethod.none) {
      times = this.adjustHighLatTimes(times);
    }
    return times;
  }

  adjustTimesFormat(times) {
    const result = times.map((t) => this.floatToTime24(t));
    result.splice(4, 1); // Remove sunset
    return result;
  }

  adjustHighLatTimes(times) {
    const params = this.methodParams[this.attribute.calculationMethod];
    const nightTime = this.timeDiff(times[4], times[1]);

    const fajrDiff = this.nightPortion(params[0]) * nightTime;
    if (isNaN(times[0]) || this.timeDiff(times[0], times[1]) > fajrDiff) {
      times[0] = times[1] - fajrDiff;
    }

    const ishaAngle = params[3] === 0.0 ? params[4] : 18.0;
    const ishaDiff = this.nightPortion(ishaAngle) * nightTime;
    if (isNaN(times[6]) || this.timeDiff(times[4], times[6]) > ishaDiff) {
      times[6] = times[4] + ishaDiff;
    }

    const maghribAngle = params[1] === 0.0 ? params[2] : 4.0;
    const maghribDiff = this.nightPortion(maghribAngle) * nightTime;
    if (isNaN(times[5]) || this.timeDiff(times[4], times[5]) > maghribDiff) {
      times[5] = times[4] + maghribDiff;
    }

    return times;
  }

  nightPortion(angle) {
    switch (this.attribute.higherLatitudeMethod) {
      case HigherLatitudeMethod.angleBased:
        return angle / 60.0;
      case HigherLatitudeMethod.midNight:
        return 0.5;
      default:
        return 0.14286;
    }
  }

  dayPortion(times) {
    return times.map((time) => time / 24.0);
  }
}

// ═══════════════════════════════════════════════════════════════
// Utility functions
// ═══════════════════════════════════════════════════════════════
function timeStringToDate(timeStr, date) {
  const [hourStr, minuteStr] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hour,
    minute,
  );
}

function formatDateTime(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:00`;
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d} 00:00:00`;
}

// ═══════════════════════════════════════════════════════════════
// Cities from the user's table
// code  = city_code for the SQL insert
// name  = DB search name (used with LIKE 'name%')
// lat/lng = fallback coords for reverse-geocode or calculated prayer
// ═══════════════════════════════════════════════════════════════
const CITIES = [
  { code: 'Erbil', name: 'Erbil', lat: 36.191951, lng: 43.9834083 },
  { code: 'Sulaymaniyah', name: 'Sulaymaniyah', lat: 35.5631131, lng: 45.3426356 },
  { code: 'Duhok', name: 'Duhok', lat: 36.8493909, lng: 42.9561284 },
  { code: 'Zakho', name: 'Zakho', lat: 37.152789, lng: 42.682445 },
  { code: 'Baghdad', name: 'Baghdad', lat: 33.311072, lng: 44.345907 },
  { code: 'Massif', name: 'Massif', lat: 36.378913, lng: 44.203725 },
  { code: 'Basrah', name: 'Basrah', lat: 33.34058, lng: 44.400879 },
  { code: 'Kirkuk', name: 'Kirkuk', lat: 35.451265, lng: 44.389626 },
  { code: 'Shaqlawa', name: 'Shaqlawa', lat: 36.40135421, lng: 44.333372 },
  { code: 'Akre', name: 'Akre', lat: 36.733145, lng: 43.875318 },
  { code: 'Koye', name: 'Koysinjaq', lat: 36.08219, lng: 44.628147 },
  { code: 'Halabja', name: 'Halabja', lat: 35.1774752, lng: 45.9855851 },
  { code: 'Soran', name: 'Soran', lat: 36.6555152, lng: 44.542363 },
  { code: 'Mousl', name: 'Mosul', lat: 36.342352, lng: 43.1378974 },
  { code: 'Rumadi', name: 'Ramadi', lat: 0, lng: 0 },
  { code: 'Faluja', name: 'Al-Fallujah', lat: 0, lng: 0 },
  { code: 'Ranya', name: 'Ranya', lat: 36.25742064, lng: 44.8812577 },
  { code: 'Qaladze', name: 'Qaladiza', lat: 36.181626829, lng: 45.128887612 },
  { code: 'Said_Sadq', name: 'Said Sadiq', lat: 35.354125, lng: 45.865665953 },
  { code: 'Khanaqin', name: 'Khanaqin', lat: 34.3482864941, lng: 45.39238470631 },
  { code: 'Khalifan', name: 'Khalifan', lat: 0, lng: 0 },
  { code: 'Kalar', name: 'Kalar', lat: 34.62911961, lng: 45.31517812 },
  { code: 'Sharazwr', name: 'Sharazoor', lat: 35.315972, lng: 45.68349809 },
  { code: 'Chwarqurna', name: 'Chwarqurna', lat: 0, lng: 0 },
  { code: 'Chamchamal', name: 'Chamchamal', lat: 35.52292238, lng: 44.834344804 },
  { code: 'big_anbar', name: 'Anbar', lat: 33.4261607615, lng: 43.3023329055 },
  { code: 'big_basrah', name: 'Basrah', lat: 30.51880976, lng: 47.83424822 },
  { code: 'big_dyala', name: 'Diyala', lat: 33.7569946, lng: 44.6511217 },
  { code: 'big_Muthannia', name: 'Muthannia', lat: 31.3084513, lng: 45.2906765 },
  { code: 'big_Diwaniyah', name: 'Diwaniyah', lat: 31.982851783, lng: 44.915890425 },
  { code: 'big_Najaf', name: 'Najaf', lat: 32.0029825, lng: 44.35611753 },
  { code: 'big_Babil', name: 'Babil', lat: 32.4929137, lng: 44.4320705 },
  { code: 'big_Diqar', name: 'Diqar', lat: 31.04737279, lng: 46.26124452 },
  { code: 'big_Karbala', name: 'Karbala', lat: 32.6033444, lng: 44.0250033 },
  { code: 'big_Maysan', name: 'Maysan', lat: 31.8477788, lng: 47.1269559 },
  { code: 'big_Ninawa', name: 'Ninawa', lat: 35.757361781, lng: 42.246930285 },
  { code: 'big_Salaheddin', name: 'Salaheddin', lat: 34.61476884, lng: 43.67337956 },
  { code: 'big_Wasit', name: 'Wasit', lat: 32.4978479, lng: 45.8312558 },
];

// ═══════════════════════════════════════════════════════════════
// DB helpers
// ═══════════════════════════════════════════════════════════════
const LOCATION_COLS =
  'location._id AS id, country.code AS countryCode, country.name AS countryName, ' +
  'location.name AS name, latitude, longitude, ' +
  'has_fixed_prayer_time AS hasFixedPrayerTime, ' +
  'prayer_dependent_id AS prayerDependentId';

function rowToLocation(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    countryCode: row.countryCode,
    countryName: row.countryName,
    hasFixedPrayerTime: Boolean(row.hasFixedPrayerTime),
    prayerDependentId: row.prayerDependentId ?? null,
  };
}

function searchLocationByName(db, cityName) {
  const row = db
    .prepare(
      `SELECT ${LOCATION_COLS} FROM location ` +
        'INNER JOIN country ON country._id = location.country_id ' +
        "WHERE location.name LIKE ? COLLATE NOCASE LIMIT 1",
    )
    .get(`${cityName}%`);
  return rowToLocation(row);
}

function reverseGeocode(db, lat, lng) {
  const row = db
    .prepare(
      `SELECT ${LOCATION_COLS} FROM location ` +
        'INNER JOIN country ON country._id = location.country_id ' +
        'ORDER BY abs(latitude - ?) + abs(longitude - ?) LIMIT 1',
    )
    .get(lat, lng);
  return rowToLocation(row);
}

function getFixedPrayerTimes(db, locationId, dbDate) {
  const row = db
    .prepare("SELECT * FROM prayer_time WHERE location_id = ? AND date = ?")
    .get(locationId, dbDate);
  return row;
}

function toDbDate(date) {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${m}-${d}`;
}

// ═══════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════
function main() {
  console.log(`Opening DB: ${DB_PATH}`);
  const db = new Database(DB_PATH, { readonly: true });

  const calculator = new CalculatedPrayerTime(DEFAULT_ATTRIBUTE);

  // Build list of dates from START_DATE to END_DATE (inclusive)
  const dates = [];
  for (let d = new Date(START_DATE); d <= END_DATE; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }
  const totalDays = dates.length;
  const startStr = START_DATE.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const endStr = END_DATE.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  let sql = `-- Ramadan Schedule: ${startStr} – ${endStr}\n`;
  sql += `-- Generated on ${new Date().toISOString()}\n`;
  sql += `-- Uses fixed DB prayer times when available (same as the app)\n`;
  sql += `-- Falls back to calculated (Umm al-Qura / Shafii / angle-based) for others\n`;
  sql += `-- Timezone: UTC+${TIMEZONE} (Asia/Baghdad)\n`;
  sql += `-- Imsak: Fajr - 10 minutes\n\n`;

  let totalRows = 0;
  let skippedCities = 0;
  let fixedCount = 0;
  let calculatedCount = 0;

  for (const city of CITIES) {
    // Step 1: Resolve location from DB — name search, then reverse geocode
    let location = searchLocationByName(db, city.name);

    if (!location && city.lat !== 0 && city.lng !== 0) {
      location = reverseGeocode(db, city.lat, city.lng);
      if (location) {
        console.log(
          `  Reverse geocode: ${city.code} -> ${location.name} (id=${location.id}, fixed=${location.hasFixedPrayerTime})`,
        );
      }
    }

    if (location) {
      console.log(
        `  ${city.code} -> ${location.name} (id=${location.id}, fixed=${location.hasFixedPrayerTime}, depId=${location.prayerDependentId})`,
      );
    }

    // Step 2: Determine prayer time lookup ID (respects prayerDependentId)
    const prayerLookupId = location
      ? location.prayerDependentId ?? location.id
      : null;
    const useFixed = location && location.hasFixedPrayerTime;

    // Fallback location for calculated times
    const calcLocation = location || {
      id: 0,
      name: city.name,
      latitude: city.lat,
      longitude: city.lng,
      countryCode: 'IQ',
      countryName: 'Iraq',
      hasFixedPrayerTime: false,
      prayerDependentId: null,
    };

    if (!location && (city.lat === 0 || city.lng === 0)) {
      console.warn(
        `  WARNING: "${city.name}" (${city.code}) not in DB and no coords — skipping`,
      );
      skippedCities++;
      continue;
    }

    const mode = useFixed ? 'FIXED' : 'CALC';
    sql += `-- ${city.code} [${mode}] (${calcLocation.name}: ${calcLocation.latitude}, ${calcLocation.longitude})\n`;

    const valueRows = [];

    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      const dayOrder = i + 1;
      const monthName = date.toLocaleDateString('en-US', { month: 'long' });

      let fajrStr, maghribStr;

      if (useFixed) {
        // Use fixed prayer times from DB (same as app)
        const dbDate = toDbDate(date);
        const row = getFixedPrayerTimes(db, prayerLookupId, dbDate);
        if (!row) {
          console.warn(
            `  WARNING: No fixed prayer time for ${city.code} on ${dbDate} (lookupId=${prayerLookupId})`,
          );
          continue;
        }
        // row.fajr and row.maghrib are "HH:mm" strings
        fajrStr = row.fajr;
        maghribStr = row.maghrib;
        fixedCount++;
      } else {
        // Calculate prayer times (same engine as app)
        const pt = calculator.getPrayerTimes(calcLocation, date, TIMEZONE);
        if (!pt) {
          console.warn(
            `  WARNING: Could not calculate for ${city.code} on ${date.toDateString()}`,
          );
          continue;
        }
        fajrStr = `${String(pt.fajr.getHours()).padStart(2, '0')}:${String(pt.fajr.getMinutes()).padStart(2, '0')}`;
        maghribStr = `${String(pt.maghrib.getHours()).padStart(2, '0')}:${String(pt.maghrib.getMinutes()).padStart(2, '0')}`;
        calculatedCount++;
      }

      // Build full datetime strings
      const datePrefix = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const iftarDt = `${datePrefix} ${maghribStr}:00`;

      // Imsak = Fajr - 10 minutes
      const [fH, fM] = fajrStr.split(':').map(Number);
      const fajrDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), fH, fM);
      const imsakDate = new Date(fajrDate.getTime() - 10 * 60 * 1000);
      const imsakDt = `${datePrefix} ${String(imsakDate.getHours()).padStart(2, '0')}:${String(imsakDate.getMinutes()).padStart(2, '0')}:00`;

      valueRows.push(`(${dayOrder}, '${monthName}', '${iftarDt}', '${imsakDt}', '${datePrefix} 00:00:00', 0, '${city.code}', NOW())`);
      totalRows++;
    }

    if (valueRows.length > 0) {
      sql += `INSERT INTO ramadan_schedule (day_order, month, iftar, imsak, date, is_current, city_code, create_time) VALUES\n`;
      sql += valueRows.join(',\n') + ';\n';
    }
    sql += '\n';
  }

  db.close();

  const outputPath = path.join(__dirname, '..', 'ramadan_schedule.sql');
  fs.writeFileSync(outputPath, sql);

  console.log(`\n========================================`);
  console.log(`Generated: ${outputPath}`);
  console.log(`Total INSERT rows: ${totalRows}`);
  console.log(`  Fixed (from DB): ${fixedCount}`);
  console.log(`  Calculated:      ${calculatedCount}`);
  console.log(`Cities processed: ${CITIES.length - skippedCities}/${CITIES.length}`);
  console.log(`Skipped cities: ${skippedCities}`);
  console.log(`Date range: ${startStr} – ${endStr} (${totalDays} days)`);
  console.log(`========================================`);
}

main();
