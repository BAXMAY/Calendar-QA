export type CustomHolidayType = 'PUBLIC_HOLIDAY' | 'SHUTDOWN_PLANT' | 'NO_CUSTOMER_AUDITS' | 'WORKING_DAY';

export interface CustomHoliday {
  date: string; // 'YYYY-MM-DD'
  type: CustomHolidayType;
  note?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EffectivePublicHoliday {
  date: string; // 'YYYY-MM-DD'
  name: string;
  isBuiltin: boolean;
  isSubstitute?: boolean;
  isCustom: boolean;
  shifts?: string[];
  dayOfWeek: string;
  dayOfWeekTh: string;
  dateFormattedEn: string;
  dateFormattedTh: string;
}

export interface HolidayInfo {
  name: string;
  subtitle?: string;
  isSubstitute?: boolean;
  shifts?: string[];
  isTraditional?: boolean;
  holidayType?: CustomHolidayType;
  isBuiltin?: boolean;
  isCustom?: boolean;
  note?: string;
  dateStr?: string;
  // Legacy optional properties preserved for backwards compatibility
  isMonthEndLock?: boolean;
  isDecBlockout?: boolean;
  isJanBlockout?: boolean;
}

export interface HolidayStyle {
  bg: string;
  hoverBg: string;
  textColor: string;
  borderColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

/**
 * Fixed-Date Company Assigned Holidays (Traditional - Recurring every year)
 * Key format: 'M/D'
 */
export const FIXED_ANNUAL_HOLIDAYS: Record<string, string> = {
  '1/1': "New Year's Day",
  '4/13': 'Songkran Festival',
  '4/14': 'Songkran Festival',
  '4/15': 'Songkran Festival',
  '5/1': 'National Labour Day',
  '6/3': "H.M. Queen Suthida's Birthday",
  '7/28': "H.M. King Maha Vajiralongkorn's Birthday",
  '8/12': "National Mother's Day",
  '10/13': 'King Bhumibol Adulyadej Memorial Day (Navamindra Maharaj Day)',
  '12/5': "National Father's Day / National Day",
  '12/31': "New Year's Eve",
};

/**
 * Dynamic / Lunar Buddhist Holidays (Corrected by Thai Lunar Calendar Rules for 2026, 2027, 2028+)
 * Key format: 'YYYY/M/D'
 */
export const LUNAR_BUDDHIST_HOLIDAYS: Record<string, string> = {
  // 2026
  '2026/3/3': 'Makha Bucha Day',
  '2026/5/31': 'Visakha Bucha Day',
  // 2027
  '2027/2/21': 'Makha Bucha Day',
  '2027/5/20': 'Visakha Bucha Day',
  // 2028
  '2028/2/9': 'Makha Bucha Day',
  '2028/5/8': 'Visakha Bucha Day',
};

/** Active in-memory custom holiday registry synchronized with Cloudflare D1 */
let activeCustomHolidays: Record<string, CustomHoliday> = {};

export function setCustomHolidays(map: Record<string, CustomHoliday> | CustomHoliday[]) {
  if (Array.isArray(map)) {
    const next: Record<string, CustomHoliday> = {};
    for (const item of map) {
      if (item && item.date) next[item.date] = item;
    }
    activeCustomHolidays = next;
  } else {
    activeCustomHolidays = map || {};
  }
}

export function getCustomHolidays(): Record<string, CustomHoliday> {
  return activeCustomHolidays;
}

/** Formats a date to ISO 'YYYY-MM-DD' using local date components */
export function formatYMD(date: Date): string {
  if (!date || isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Checks whether a date is a built-in official public holiday (or Monday substitute) */
export function isBuiltinPublicHoliday(date: Date): { isBuiltin: boolean; name?: string; isSubstitute?: boolean } {
  if (!date || isNaN(date.getTime())) return { isBuiltin: false };
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const dow = date.getDay();

  const ymdKey = `${y}/${m}/${d}`;
  const mdKey = `${m}/${d}`;
  const directName = LUNAR_BUDDHIST_HOLIDAYS[ymdKey] || FIXED_ANNUAL_HOLIDAYS[mdKey];
  if (directName) {
    return { isBuiltin: true, name: directName, isSubstitute: false };
  }

  // Monday substitute check
  if (dow === 1) {
    // Check Sunday (1 day ago)
    const sun = new Date(date);
    sun.setDate(date.getDate() - 1);
    const sunName = LUNAR_BUDDHIST_HOLIDAYS[`${sun.getFullYear()}/${sun.getMonth() + 1}/${sun.getDate()}`] ||
      FIXED_ANNUAL_HOLIDAYS[`${sun.getMonth() + 1}/${sun.getDate()}`];
    if (sunName) {
      return { isBuiltin: true, name: `Substitute ${sunName} (Shift E & E1)`, isSubstitute: true };
    }

    // Check Saturday (2 days ago)
    const sat = new Date(date);
    sat.setDate(date.getDate() - 2);
    const satName = LUNAR_BUDDHIST_HOLIDAYS[`${sat.getFullYear()}/${sat.getMonth() + 1}/${sat.getDate()}`] ||
      FIXED_ANNUAL_HOLIDAYS[`${sat.getMonth() + 1}/${sat.getDate()}`];
    if (satName) {
      return { isBuiltin: true, name: `Substitute ${satName} (Shift E & E1)`, isSubstitute: true };
    }
  }

  return { isBuiltin: false };
}

/**
 * Returns the effective list of all Public Holidays for a given year in chronological order.
 * Merges statutory reference holidays with user customizations (edits, additions, deletions).
 */
export function getEffectivePublicHolidaysForYear(
  year: number,
  customMap?: Record<string, CustomHoliday>
): EffectivePublicHoliday[] {
  const map = customMap || activeCustomHolidays;
  const list: EffectivePublicHoliday[] = [];
  const processedDates = new Set<string>();

  const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const DAYS_TH = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
  const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTHS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  // 1. Scan all calendar days in the year
  for (let m = 0; m < 12; m++) {
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, m, d);
      const dateStr = formatYMD(dt);
      processedDates.add(dateStr);

      const custom = map[dateStr];
      if (custom) {
        if (custom.type === 'WORKING_DAY') {
          // Explicitly deleted / overridden to normal working day
          continue;
        }
        if (custom.type === 'PUBLIC_HOLIDAY') {
          const builtin = isBuiltinPublicHoliday(dt);
          const name = custom.note ? custom.note : (builtin.name || 'Public Holiday');
          list.push({
            date: dateStr,
            name,
            isBuiltin: builtin.isBuiltin,
            isSubstitute: builtin.isSubstitute,
            isCustom: true,
            shifts: builtin.isSubstitute ? ['Shift E', 'Shift E1'] : undefined,
            dayOfWeek: DAYS_EN[dt.getDay()],
            dayOfWeekTh: DAYS_TH[dt.getDay()],
            dateFormattedEn: `${String(d).padStart(2, '0')} ${MONTHS_EN[m]} ${year}`,
            dateFormattedTh: `${d} ${MONTHS_TH[m]} ${year}`,
          });
          continue;
        }
        // SHUTDOWN_PLANT or NO_CUSTOMER_AUDITS -> plant restrictions, not public holidays
        continue;
      }

      // Default statutory built-in public holiday
      const builtin = isBuiltinPublicHoliday(dt);
      if (builtin.isBuiltin && builtin.name) {
        list.push({
          date: dateStr,
          name: builtin.name,
          isBuiltin: true,
          isSubstitute: builtin.isSubstitute,
          isCustom: false,
          shifts: builtin.isSubstitute ? ['Shift E', 'Shift E1'] : undefined,
          dayOfWeek: DAYS_EN[dt.getDay()],
          dayOfWeekTh: DAYS_TH[dt.getDay()],
          dateFormattedEn: `${String(d).padStart(2, '0')} ${MONTHS_EN[m]} ${year}`,
          dateFormattedTh: `${d} ${MONTHS_TH[m]} ${year}`,
        });
      }
    }
  }

  // 2. Also check any dates in customMap for this year not caught
  for (const [dateStr, custom] of Object.entries(map)) {
    if (!processedDates.has(dateStr) && dateStr.startsWith(`${year}-`)) {
      if (custom.type === 'PUBLIC_HOLIDAY') {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          if (!isNaN(dt.getTime())) {
            const m = dt.getMonth();
            const d = dt.getDate();
            list.push({
              date: dateStr,
              name: custom.note || 'Public Holiday',
              isBuiltin: false,
              isCustom: true,
              dayOfWeek: DAYS_EN[dt.getDay()],
              dayOfWeekTh: DAYS_TH[dt.getDay()],
              dateFormattedEn: `${String(d).padStart(2, '0')} ${MONTHS_EN[m]} ${year}`,
              dateFormattedTh: `${d} ${MONTHS_TH[m]} ${year}`,
            });
          }
        }
      }
    }
  }

  return list.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Checks if a given Date is a holiday or restricted day.
 * Precedence:
 * 1. Explicit Custom Holiday configured in Manage -> Holidays (D1 backed):
 *    - PUBLIC_HOLIDAY (Gray)
 *    - SHUTDOWN_PLANT (Blue)
 *    - NO_CUSTOMER_AUDITS (Blue)
 * 2. Built-in Official Public Holidays (Traditional & Lunar Buddhist) - Gray
 * 3. Built-in Shift E & E1 Monday Substitutes - Darker Gray
 * 4. Normal working day (returns null) - NO hardcoded month-end or legacy rules!
 */
export function getHolidayForDate(date: Date, customMap?: Record<string, CustomHoliday>): HolidayInfo | null {
  if (!date || isNaN(date.getTime())) return null;

  const ymd = formatYMD(date);
  const map = customMap || activeCustomHolidays;
  const custom = map[ymd];

  // 1. Explicit Custom Holiday / Restriction from Manage -> Holidays
  if (custom) {
    if (custom.type === 'WORKING_DAY') {
      // Explicitly removed by user -> treated as normal working day
      return null;
    }
    if (custom.type === 'PUBLIC_HOLIDAY') {
      return {
        name: custom.note ? custom.note : 'Public Holiday',
        subtitle: custom.note ? 'Public Holiday' : undefined,
        isTraditional: true,
        isCustom: true,
        holidayType: 'PUBLIC_HOLIDAY',
        dateStr: ymd,
        note: custom.note,
      };
    }
    if (custom.type === 'SHUTDOWN_PLANT') {
      return {
        name: 'Shutdown Plant',
        subtitle: custom.note || undefined,
        isTraditional: false,
        isCustom: true,
        holidayType: 'SHUTDOWN_PLANT',
        dateStr: ymd,
        note: custom.note,
      };
    }
    if (custom.type === 'NO_CUSTOMER_AUDITS') {
      return {
        name: 'No Customer Audits',
        subtitle: custom.note || undefined,
        isTraditional: false,
        isCustom: true,
        holidayType: 'NO_CUSTOMER_AUDITS',
        dateStr: ymd,
        note: custom.note,
      };
    }
  }

  // 2. Built-in Official Public Holidays & Substitutes
  const builtin = isBuiltinPublicHoliday(date);
  if (builtin.isBuiltin && builtin.name) {
    if (builtin.isSubstitute) {
      return {
        name: builtin.name,
        isSubstitute: true,
        shifts: ['Shift E', 'Shift E1'],
        isTraditional: false,
        isBuiltin: true,
        holidayType: 'PUBLIC_HOLIDAY',
        dateStr: ymd,
      };
    }
    return {
      name: builtin.name,
      isTraditional: true,
      isBuiltin: true,
      holidayType: 'PUBLIC_HOLIDAY',
      dateStr: ymd,
    };
  }

  // Default: Normal working day allowing both Customer & Internal audits
  return null;
}

/**
 * Returns distinct styling properties for Holiday / Restriction types.
 * - SHUTDOWN_PLANT and NO_CUSTOMER_AUDITS -> Blue
 * - PUBLIC_HOLIDAY / Built-in Traditional -> Gray
 * - Weekend Monday Substitute -> Darker Gray
 */
export function getHolidayStyle(holiday: HolidayInfo): HolidayStyle {
  if (holiday.holidayType === 'SHUTDOWN_PLANT' || holiday.holidayType === 'NO_CUSTOMER_AUDITS') {
    // Clean Blue styling for Shutdown Plant & No Customer Audits
    return {
      bg: '#eff6ff',
      hoverBg: '#dbeafe',
      textColor: '#1d4ed8',
      borderColor: '#bfdbfe',
      badgeBg: '#dbeafe',
      badgeBorder: '#93c5fd',
      badgeText: '#1d4ed8',
    };
  }

  if (holiday.isSubstitute) {
    // Shift Substitute (Shift E & E1) - Noticeably Darker Gray
    return {
      bg: '#D1D5DB',
      hoverBg: '#9CA3AF',
      textColor: '#1F2937',
      borderColor: '#9CA3AF',
      badgeBg: 'transparent',
      badgeBorder: 'transparent',
      badgeText: '#1F2937',
    };
  }

  // Standard Traditional / Built-in / Custom Public Holiday - Clean Gray
  return {
    bg: '#F3F4F6',
    hoverBg: '#E5E7EB',
    textColor: '#374151',
    borderColor: '#D1D5DB',
    badgeBg: 'transparent',
    badgeBorder: 'transparent',
    badgeText: '#374151',
  };
}

/**
 * Helper to determine if a HolidayInfo represents an official public/company holiday or substitute holiday
 * (as opposed to plant restriction days like 'SHUTDOWN_PLANT' or 'NO_CUSTOMER_AUDITS').
 */
export function isOfficialHoliday(holiday: HolidayInfo | null | undefined): boolean {
  if (!holiday) return false;
  if (holiday.holidayType === 'SHUTDOWN_PLANT' || holiday.holidayType === 'NO_CUSTOMER_AUDITS') {
    return false;
  }
  return Boolean(holiday.isSubstitute || holiday.isTraditional || holiday.holidayType === 'PUBLIC_HOLIDAY');
}

/**
 * Helper to check if a date completely blocks appointment creation (both Customer & Internal Audits).
 * Returns true for PUBLIC_HOLIDAY and SHUTDOWN_PLANT.
 */
export function isDateCompletelyBlocked(holiday: HolidayInfo | null | undefined): boolean {
  if (!holiday) return false;
  return holiday.holidayType === 'PUBLIC_HOLIDAY' ||
    holiday.holidayType === 'SHUTDOWN_PLANT' ||
    Boolean(holiday.isTraditional || holiday.isSubstitute);
}

/**
 * Helper to check if a date restricts appointment creation to Internal Audit (IA) only.
 * Returns true strictly for NO_CUSTOMER_AUDITS.
 */
export function isDateRestrictedToInternalAuditOnly(holiday: HolidayInfo | null | undefined): boolean {
  if (!holiday) return false;
  return holiday.holidayType === 'NO_CUSTOMER_AUDITS';
}

/** Automatically checks if a given Date is the last day of its month. */
export function isLastDayOfMonth(date: Date): boolean {
  if (!date || isNaN(date.getTime())) return false;
  const testDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return date.getDate() === testDate.getDate();
}

/** Automatically checks if a given Date is the last WORKING WEEKDAY of its month. */
export function isLastWorkingWeekdayOfMonth(date: Date): boolean {
  if (!date || isNaN(date.getTime())) return false;
  const dayOfWeek = date.getDay();
  if (dayOfWeek < 1 || dayOfWeek > 5) return false;

  const year = date.getFullYear();
  const month = date.getMonth();
  const lastCalendarDate = new Date(year, month + 1, 0);
  const lastDayOfWeek = lastCalendarDate.getDay();

  let targetDay: number;
  if (lastDayOfWeek === 6) {
    targetDay = lastCalendarDate.getDate() - 1;
  } else if (lastDayOfWeek === 0) {
    targetDay = lastCalendarDate.getDate() - 2;
  } else {
    targetDay = lastCalendarDate.getDate();
  }

  return date.getDate() === targetDay;
}
