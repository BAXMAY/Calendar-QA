import { useState, useMemo } from 'react';
import type { VM } from '../useScheduler';
import type { CustomHolidayType, CustomHoliday, EffectivePublicHoliday } from '../holidays';
import {
  getHolidayForDate,
  getEffectivePublicHolidaysForYear,
} from '../holidays';
import { css } from '../ui';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const EMPTY_CUSTOM_HOLIDAYS: Record<string, CustomHoliday> = {};

export function HolidaysPanel({ vm }: { vm: VM }) {
  const today = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState<number>(() => today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(() => today.getMonth()); // 0-indexed

  // Modal State for single date / date range configuration
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFromDate, setModalFromDate] = useState('');
  const [modalToDate, setModalToDate] = useState('');
  const [modalType, setModalType] = useState<CustomHolidayType>('NO_CUSTOMER_AUDITS');
  const [modalNote, setModalNote] = useState('');
  const [isRangeMode, setIsRangeMode] = useState(false);

  // Breakdown Modal State for Public Holidays
  const [breakdownModalOpen, setBreakdownModalOpen] = useState(false);
  const [holidaySearchQuery, setHolidaySearchQuery] = useState('');

  // Add / Edit Public Holiday Dialog State
  const [editHolidayModalOpen, setEditHolidayModalOpen] = useState(false);
  const [editHolidayData, setEditHolidayData] = useState<{
    oldDate: string;
    date: string;
    name: string;
    isNew: boolean;
  }>({ oldDate: '', date: '', name: '', isNew: false });

  // Confirmation dialog for Reset to Reference Holidays
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const customHolidays = vm.customHolidays || EMPTY_CUSTOM_HOLIDAYS;

  // Navigation handlers
  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedYear((y) => y - 1);
      setSelectedMonth(11);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedYear((y) => y + 1);
      setSelectedMonth(0);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
  };

  // Open configuration modal for a specific calendar cell
  const handleDayClick = (dateStr: string, dateObj: Date) => {
    const hol = getHolidayForDate(dateObj, customHolidays);
    const existing = customHolidays[dateStr];

    setModalFromDate(dateStr);
    setModalToDate(dateStr);
    setIsRangeMode(false);

    if (hol) {
      setModalType(hol.holidayType || 'PUBLIC_HOLIDAY');
      setModalNote(hol.name || '');
    } else if (existing) {
      setModalType(existing.type);
      setModalNote(existing.note || '');
    } else {
      setModalType('NO_CUSTOMER_AUDITS');
      setModalNote('');
    }
    setModalOpen(true);
  };

  // Open modal for custom range creation
  const handleOpenRangeModal = () => {
    const defaultDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
    setModalFromDate(defaultDate);
    setModalToDate(defaultDate);
    setIsRangeMode(true);
    setModalType('NO_CUSTOMER_AUDITS');
    setModalNote('');
    setModalOpen(true);
  };

  // Handle saving holiday / restriction rule
  const handleSave = async () => {
    if (!modalFromDate) return;
    const from = modalFromDate;
    const to = isRangeMode && modalToDate ? modalToDate : from;

    if (from === to) {
      await vm.saveHolidayRule(from, modalType, modalNote.trim());
    } else {
      const dates: string[] = [];
      const cur = new Date(from + 'T00:00:00');
      const end = new Date(to + 'T00:00:00');
      if (cur > end) {
        dates.push(from);
      } else {
        while (cur <= end) {
          const y = cur.getFullYear();
          const m = String(cur.getMonth() + 1).padStart(2, '0');
          const d = String(cur.getDate()).padStart(2, '0');
          dates.push(`${y}-${m}-${d}`);
          cur.setDate(cur.getDate() + 1);
        }
      }
      await vm.saveHolidayRangeRules(dates, modalType, modalNote.trim());
    }
    setModalOpen(false);
  };

  // Handle removing holiday / resetting date to normal working day
  const handleDelete = async () => {
    if (!modalFromDate) return;
    const from = modalFromDate;
    const to = isRangeMode && modalToDate ? modalToDate : from;

    if (from === to) {
      await vm.deleteHolidayRule(from);
    } else {
      const dates: string[] = [];
      const cur = new Date(from + 'T00:00:00');
      const end = new Date(to + 'T00:00:00');
      while (cur <= end) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        const d = String(cur.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${d}`);
        cur.setDate(cur.getDate() + 1);
      }
      await vm.deleteHolidayRangeRules(dates);
    }
    setModalOpen(false);
  };

  // Effective Public Holidays for Selected Year
  const effectivePublicHolidays = useMemo(() => {
    return getEffectivePublicHolidaysForYear(selectedYear, customHolidays);
  }, [selectedYear, customHolidays]);

  // Filtered Public Holidays for Breakdown Modal Search
  const filteredPublicHolidays = useMemo(() => {
    if (!holidaySearchQuery.trim()) return effectivePublicHolidays;
    const q = holidaySearchQuery.trim().toLowerCase();
    return effectivePublicHolidays.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.date.includes(q) ||
        h.dayOfWeek.toLowerCase().includes(q) ||
        h.dayOfWeekTh.includes(q)
    );
  }, [effectivePublicHolidays, holidaySearchQuery]);

  // Statistics for Current Year
  const yearStats = useMemo(() => {
    let shutdownCount = 0;
    let noCsCount = 0;

    for (const [dateKey, itemVal] of Object.entries(customHolidays)) {
      const item = itemVal as CustomHoliday;
      if (dateKey.startsWith(`${selectedYear}-`)) {
        if (item.type === 'SHUTDOWN_PLANT') shutdownCount++;
        else if (item.type === 'NO_CUSTOMER_AUDITS') noCsCount++;
      }
    }

    return {
      publicHolidaysCount: effectivePublicHolidays.length,
      shutdownCount,
      noCsCount,
    };
  }, [selectedYear, customHolidays, effectivePublicHolidays.length]);

  // Build Month Calendar Cells
  const calendarCells = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    // Convert Sunday=0 to Monday=0 (Monday=0, Tuesday=1 ... Sunday=6)
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7;

    const cells: Array<{
      blank: boolean;
      dateStr: string;
      dayNum: number;
      dateObj: Date;
      isToday: boolean;
      isWeekend: boolean;
      hol: ReturnType<typeof getHolidayForDate>;
      custom?: CustomHoliday;
    }> = [];

    // Leading blanks
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({
        blank: true,
        dateStr: '',
        dayNum: 0,
        dateObj: new Date(),
        isToday: false,
        isWeekend: false,
        hol: null,
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(selectedYear, selectedMonth, d);
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(d).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;

      const dow = dateObj.getDay();
      const isWeekend = dow === 0 || dow === 6;
      const isToday = today.getFullYear() === y && today.getMonth() === selectedMonth && today.getDate() === d;
      const hol = getHolidayForDate(dateObj, customHolidays);
      const custom = customHolidays[dateStr];

      cells.push({
        blank: false,
        dateStr,
        dayNum: d,
        dateObj,
        isToday,
        isWeekend,
        hol,
        custom,
      });
    }

    // Trailing blanks to complete 7-column grid
    while (cells.length % 7 !== 0) {
      cells.push({
        blank: true,
        dateStr: '',
        dayNum: 0,
        dateObj: new Date(),
        isToday: false,
        isWeekend: false,
        hol: null,
      });
    }

    return cells;
  }, [selectedYear, selectedMonth, customHolidays, today]);

  // List of active custom rules sorted by date
  const activeCustomList = useMemo(() => {
    return (Object.values(customHolidays) as CustomHoliday[]).sort(
      (a: CustomHoliday, b: CustomHoliday) => a.date.localeCompare(b.date)
    );
  }, [customHolidays]);

  // Handlers for Add / Edit Public Holiday
  const handleOpenAddHoliday = () => {
    const defaultDate = `${selectedYear}-01-01`;
    setEditHolidayData({ oldDate: '', date: defaultDate, name: '', isNew: true });
    setEditHolidayModalOpen(true);
  };

  const handleOpenEditHoliday = (h: EffectivePublicHoliday) => {
    setEditHolidayData({ oldDate: h.date, date: h.date, name: h.name, isNew: false });
    setEditHolidayModalOpen(true);
  };

  const handleSaveEditHoliday = async () => {
    if (!editHolidayData.date.trim() || !editHolidayData.name.trim()) return;
    if (editHolidayData.isNew) {
      await vm.saveHolidayRule(editHolidayData.date.trim(), 'PUBLIC_HOLIDAY', editHolidayData.name.trim());
    } else {
      await vm.updatePublicHoliday(editHolidayData.oldDate, editHolidayData.date.trim(), editHolidayData.name.trim());
    }
    setEditHolidayModalOpen(false);
  };

  const handleDeleteHolidayFromList = async (h: EffectivePublicHoliday) => {
    if (
      window.confirm(
        `Are you sure you want to remove "${h.name}" (${h.date}) from Public Holidays? This date will become a normal working day.`
      )
    ) {
      await vm.deleteHolidayRule(h.date);
    }
  };

  const handleConfirmResetHolidays = async () => {
    await vm.resetYearPublicHolidays(selectedYear);
    setResetConfirmOpen(false);
  };

  return (
    <div style={css('display:flex;flex-direction:column;gap:20px;padding-bottom:40px')}>
      {/* 1. Header Card & Controls */}
      <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:14px;padding:18px 22px;box-shadow:0 1px 3px rgba(0,0,0,0.02)')}>
        <div style={css('display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px')}>
          <div>
            <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;color:#8a9088;text-transform:uppercase;letter-spacing:0.5px")}>
              Holiday & Restriction Management
            </div>
            <div style={css("font-size:20px;font-weight:800;color:#15191e;margin-top:2px;font-family:'Archivo',sans-serif")}>
              Calendar Restrictions
            </div>
            <div style={css('font-size:12.5px;color:#64748b;margin-top:2px')}>
              Configure statutory public holidays, plant shutdowns, and No Customer Audit days. Backed by Cloudflare D1.
            </div>
          </div>

          <div style={css('display:flex;align-items:center;gap:10px;flex-wrap:wrap')}>
            <button
              onClick={handleOpenRangeModal}
              style={css("display:inline-flex;align-items:center;gap:6px;background:#2756d6;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:12.5px;font-weight:600;font-family:'Archivo',sans-serif;cursor:pointer;transition:background .15s")}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#1e44b0')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#2756d6')}
            >
              <span>＋</span>
              <span>Add Date Range Rule</span>
            </button>
          </div>
        </div>

        {/* 3 Unified Summary Cards */}
        <div style={css('display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:16px;padding-top:16px;border-top:1px solid #f1f3ee')}>
          {/* Card 1: Unified Public Holidays (Clickable Breakdown) */}
          <div
            onClick={() => setBreakdownModalOpen(true)}
            style={{
              background: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              borderRadius: '10px',
              padding: '12px 16px',
              cursor: 'pointer',
              transition: 'all .15s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.borderColor = '#2563eb';
              e.currentTarget.style.boxShadow = '0 3px 10px rgba(37,99,235,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.boxShadow = 'none';
            }}
            title="Click to view full Public Holidays breakdown, edit names, dates, or add holidays"
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.4px")}>
                  Public Holidays ({selectedYear})
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  Manage List ↗
                </span>
              </div>
              <div style={css("font-size:22px;font-weight:800;color:#1e293b;margin-top:4px;font-family:'Archivo',sans-serif")}>
                {yearStats.publicHolidaysCount} <span style={css('font-size:12px;font-weight:500;color:#64748b')}>days</span>
              </div>
            </div>
            <div style={css('font-size:11px;color:#64748b;margin-top:8px')}>
              Official statutory & corporate holidays · Click to edit, delete, or add
            </div>
          </div>

          {/* Card 2: Shutdown Plant */}
          <div style={css('background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px 16px;display:flex;flex-direction:column;justify-content:space-between')}>
            <div>
              <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:0.4px")}>
                Shutdown Plant
              </div>
              <div style={css("font-size:22px;font-weight:800;color:#1d4ed8;margin-top:4px;font-family:'Archivo',sans-serif")}>
                {yearStats.shutdownCount} <span style={css('font-size:12px;font-weight:500;color:#60a5fa')}>days</span>
              </div>
            </div>
            <div style={css('font-size:11px;color:#3b82f6;margin-top:8px')}>
              Plant fully closed · Blocks CS & IA appointments
            </div>
          </div>

          {/* Card 3: No Customer Audits */}
          <div style={css('background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px 16px;display:flex;flex-direction:column;justify-content:space-between')}>
            <div>
              <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:0.4px")}>
                No Customer Audits
              </div>
              <div style={css("font-size:22px;font-weight:800;color:#1d4ed8;margin-top:4px;font-family:'Archivo',sans-serif")}>
                {yearStats.noCsCount} <span style={css('font-size:12px;font-weight:500;color:#60a5fa')}>days</span>
              </div>
            </div>
            <div style={css('font-size:11px;color:#3b82f6;margin-top:8px')}>
              Customer audits restricted · Internal audits permitted
            </div>
          </div>
        </div>
      </div>

      {/* 2. Visual Legend */}
      <div style={css('display:flex;align-items:center;gap:16px;flex-wrap:wrap;background:#fff;border:1px solid #e2e5de;border-radius:10px;padding:10px 18px;font-size:12px')}>
        <span style={css('font-weight:700;color:#475569')}>Legend:</span>
        <div style={css('display:flex;align-items:center;gap:6px')}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#F3F4F6', border: '1px solid #D1D5DB' }} />
          <span style={css('color:#374151')}>Public / General Holiday (Gray — Blocks CS & IA)</span>
        </div>
        <div style={css('display:flex;align-items:center;gap:6px')}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#eff6ff', border: '1px solid #bfdbfe' }} />
          <span style={css('color:#1d4ed8;font-weight:600')}>Shutdown Plant (Blue — Blocks CS & IA)</span>
        </div>
        <div style={css('display:flex;align-items:center;gap:6px')}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#eff6ff', border: '1px solid #bfdbfe' }} />
          <span style={css('color:#1d4ed8;font-weight:600')}>No Customer Audits (Blue — CS blocked, IA allowed)</span>
        </div>
        <div style={css('display:flex;align-items:center;gap:6px')}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ffffff', border: '1px solid #cbd5e1' }} />
          <span style={css('color:#64748b')}>Normal Working Day (White — Full CS & IA)</span>
        </div>
      </div>

      {/* 3. Calendar Month View */}
      <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.02)')}>
        {/* Month Navigation Toolbar */}
        <div style={css('display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #eef1ea;background:#fafbfa')}>
          <div style={css('display:flex;align-items:center;gap:10px')}>
            <button
              onClick={prevMonth}
              style={css("width:32px;height:32px;border:1px solid #dde0d9;background:#fff;border-radius:7px;cursor:pointer;font-size:14px;color:#475569;display:flex;align-items:center;justify-content:center")}
              title="Previous Month"
            >
              ◀
            </button>
            <button
              onClick={nextMonth}
              style={css("width:32px;height:32px;border:1px solid #dde0d9;background:#fff;border-radius:7px;cursor:pointer;font-size:14px;color:#475569;display:flex;align-items:center;justify-content:center")}
              title="Next Month"
            >
              ▶
            </button>
            <button
              onClick={goToToday}
              style={css("padding:5px 12px;border:1px solid #dde0d9;background:#fff;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;color:#334155;font-family:'Archivo',sans-serif")}
            >
              Today
            </button>
          </div>

          <div style={css('display:flex;align-items:center;gap:8px')}>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              style={css("font-family:'Archivo',sans-serif;font-size:15px;font-weight:700;color:#15191e;border:1px solid #dde0d9;background:#fff;border-radius:8px;padding:6px 12px;cursor:pointer;outline:none")}
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx} value={idx}>{name}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={css("font-family:'Archivo',sans-serif;font-size:15px;font-weight:700;color:#15191e;border:1px solid #dde0d9;background:#fff;border-radius:8px;padding:6px 12px;cursor:pointer;outline:none")}
            >
              {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((yr) => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Weekday Headers */}
        <div style={css('display:grid;grid-template-columns:repeat(7,1fr);background:#f8faf6;border-bottom:1px solid #e6e9e2')}>
          {WEEKDAY_NAMES.map((wd, i) => (
            <div
              key={wd}
              style={css(`padding:9px 0;text-align:center;font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;color:${i >= 5 ? '#94a3b8' : '#475569'};letter-spacing:0.5px`)}
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Calendar Grid Cells */}
        <div style={css('display:grid;grid-template-columns:repeat(7,1fr);background:#e6e9e2;gap:1px')}>
          {calendarCells.map((c, i) => {
            if (c.blank) {
              return <div key={i} style={css('background:#fafafa;min-height:96px')} />;
            }

            const { hol, custom, isToday, isWeekend, dateStr, dayNum, dateObj } = c;

            // Determine styling
            let cellBg = '#ffffff';
            let titleColor = '#1e293b';
            let badgeBg = 'transparent';
            let badgeBorder = 'transparent';
            let badgeText = '#475569';
            let statusLabel = '';
            let subtitle = '';

            if (hol) {
              if (hol.holidayType === 'PUBLIC_HOLIDAY') {
                cellBg = '#f3f4f6';
                titleColor = '#374151';
                badgeBg = '#e5e7eb';
                badgeBorder = '#d1d5db';
                badgeText = '#374151';
                statusLabel = `● ${hol.name}`;
                subtitle = hol.isSubstitute ? 'Shift E & E1' : (hol.isCustom ? 'Custom' : '');
              } else if (hol.holidayType === 'SHUTDOWN_PLANT') {
                cellBg = '#eff6ff';
                titleColor = '#1d4ed8';
                badgeBg = '#dbeafe';
                badgeBorder = '#bfdbfe';
                badgeText = '#1d4ed8';
                statusLabel = '🏭 Shutdown Plant';
                subtitle = hol.note || '';
              } else if (hol.holidayType === 'NO_CUSTOMER_AUDITS') {
                cellBg = '#eff6ff';
                titleColor = '#1d4ed8';
                badgeBg = '#dbeafe';
                badgeBorder = '#bfdbfe';
                badgeText = '#1d4ed8';
                statusLabel = '🚫 No Customer Audits';
                subtitle = hol.note || '';
              }
            } else if (isWeekend) {
              cellBg = '#fcfcfc';
              titleColor = '#94a3b8';
            }

            return (
              <div
                key={dateStr}
                onClick={() => handleDayClick(dateStr, dateObj)}
                style={{
                  background: cellBg,
                  minHeight: '100px',
                  padding: '8px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all .12s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'brightness(0.97)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'none';
                }}
                title={
                  hol
                    ? `${dateStr}: ${hol.name} — Click to edit or reset`
                    : custom
                    ? `${dateStr}: ${statusLabel} ${subtitle ? `(${subtitle})` : ''} — Click to edit`
                    : `${dateStr}: Click to set holiday or plant restriction`
                }
              >
                {/* Cell Header: Day Number */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono',monospace",
                      fontSize: '12px',
                      fontWeight: isToday ? 800 : 700,
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isToday ? '#2756d6' : 'transparent',
                      color: isToday ? '#ffffff' : titleColor,
                    }}
                  >
                    {dayNum}
                  </span>

                  {/* Indicator for configured state */}
                  {custom && (
                    <span style={{ fontSize: '10px', color: badgeText, fontWeight: 700 }}>
                      ✓
                    </span>
                  )}
                </div>

                {/* Status Badge in Cell Body */}
                <div style={{ marginTop: '4px', minHeight: '38px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  {statusLabel ? (
                    <div
                      style={{
                        padding: '3px 6px',
                        borderRadius: '5px',
                        background: badgeBg,
                        border: `1px solid ${badgeBorder}`,
                        color: badgeText,
                        fontSize: '10.5px',
                        fontWeight: 700,
                        lineHeight: '1.25',
                        wordBreak: 'break-word',
                      }}
                    >
                      {statusLabel}
                      {subtitle && (
                        <div style={{ fontSize: '9.5px', fontWeight: 500, opacity: 0.85, marginTop: '2px' }}>
                          {subtitle}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Active Configured Rules Table */}
      {activeCustomList.length > 0 && (
        <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:14px;padding:18px 22px;box-shadow:0 1px 3px rgba(0,0,0,0.02)')}>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;color:#8a9088;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px")}>
            Configured Calendar Rules · {activeCustomList.length} total
          </div>

          <div style={css('display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;margin-top:10px')}>
            {activeCustomList.map((item: CustomHoliday) => {
              const isWorkingDay = item.type === 'WORKING_DAY';
              const isBlue = item.type === 'SHUTDOWN_PLANT' || item.type === 'NO_CUSTOMER_AUDITS';
              const typeLabel =
                item.type === 'PUBLIC_HOLIDAY'
                  ? 'Public Holiday'
                  : item.type === 'SHUTDOWN_PLANT'
                  ? 'Shutdown Plant'
                  : item.type === 'NO_CUSTOMER_AUDITS'
                  ? 'No Customer Audits'
                  : 'Overridden to Normal Day';

              return (
                <div
                  key={item.date}
                  style={css(
                    `display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-radius:8px;border:1px solid ${
                      isWorkingDay ? '#e2e8f0' : isBlue ? '#bfdbfe' : '#d1d5db'
                    };background:${isWorkingDay ? '#f8fafc' : isBlue ? '#eff6ff' : '#f3f4f6'}`
                  )}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontFamily: "'IBM Plex Mono',monospace",
                          fontSize: '12px',
                          fontWeight: 700,
                          color: isWorkingDay ? '#64748b' : isBlue ? '#1d4ed8' : '#374151',
                        }}
                      >
                        {item.date}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: isWorkingDay ? '#64748b' : isBlue ? '#1e40af' : '#475569',
                        }}
                      >
                        {typeLabel}
                      </span>
                    </div>
                    {item.note && (
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.note}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => vm.deleteHolidayRule(item.date)}
                    style={css('border:none;background:transparent;color:#94a3b8;cursor:pointer;padding:4px 6px;border-radius:4px;font-size:13px;line-height:1;margin-left:8px')}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#fee2e2';
                      e.currentTarget.style.color = '#dc2626';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#94a3b8';
                    }}
                    title={isWorkingDay ? `Restore default holiday on ${item.date}` : `Delete rule for ${item.date}`}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. INTERACTIVE PUBLIC HOLIDAYS BREAKDOWN MODAL                            */}
      {/* ========================================================================= */}
      {breakdownModalOpen && (
        <div style={css('position:fixed;inset:0;background:rgba(15,23,42,0.45);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:9999')}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '740px',
              width: '92%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '22px' }}>🗓️</span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', fontFamily: "'Archivo',sans-serif" }}>
                    Public Holidays Breakdown · {selectedYear}
                  </div>
                </div>
                <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '3px' }}>
                  {effectivePublicHolidays.length} holidays scheduled for {selectedYear} · Unlocked for full customization
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleOpenAddHoliday}
                  style={css("display:inline-flex;align-items:center;gap:6px;background:#2563eb;color:#fff;border:none;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:600;font-family:'Archivo',sans-serif;cursor:pointer;transition:background .15s")}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#1d4ed8')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#2563eb')}
                >
                  <span>＋</span>
                  <span>Add Public Holiday</span>
                </button>

                <button
                  type="button"
                  onClick={() => setResetConfirmOpen(true)}
                  style={css("display:inline-flex;align-items:center;gap:5px;background:#f8fafc;color:#475569;border:1px solid #cbd5e1;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:600;font-family:'Archivo',sans-serif;cursor:pointer")}
                  title="Reset all public holidays for this year back to statutory reference list"
                >
                  <span>↺</span>
                  <span>Reset Defaults</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBreakdownModalOpen(false)}
                  style={css('width:32px;height:32px;border:1px solid #e2e8f0;background:#fff;border-radius:8px;cursor:pointer;color:#64748b;font-size:15px;display:flex;align-items:center;justify-content:center')}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Search Input Bar */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={holidaySearchQuery}
                onChange={(e) => setHolidaySearchQuery(e.target.value)}
                placeholder="🔍 Search holiday name, date (YYYY-MM-DD), or day of week..."
                style={css("width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:9px;padding:8px 12px;font-size:13px;font-family:'Archivo',sans-serif;color:#1e293b;outline:none")}
              />
              {holidaySearchQuery && (
                <button
                  onClick={() => setHolidaySearchQuery('')}
                  style={css('position:absolute;right:10px;top:50%;transform:translateY(-50%);border:none;background:transparent;color:#94a3b8;cursor:pointer;font-size:13px')}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Scrollable Holiday List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              {filteredPublicHolidays.length === 0 ? (
                <div style={{ padding: '36px 12px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  No public holidays found matching "{holidaySearchQuery}"
                </div>
              ) : (
                filteredPublicHolidays.map((h) => {
                  return (
                    <div
                      key={h.date}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        gap: '12px',
                        transition: 'all .12s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.background = '#f1f5f9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.background = '#f8fafc';
                      }}
                    >
                      {/* Left: Date Badge */}
                      <div style={{ minWidth: '130px', display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                          {h.dateFormattedEn}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                          {h.dayOfWeek} · {h.dayOfWeekTh}
                        </span>
                      </div>

                      {/* Middle: Name & Badges */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
                            {h.name}
                          </span>
                          {h.isSubstitute && (
                            <span style={{ background: '#e2e8f0', color: '#334155', borderRadius: '4px', padding: '2px 7px', fontSize: '10.5px', fontWeight: 600 }}>
                              Shift E & E1 Substitute
                            </span>
                          )}
                          {h.isCustom && (
                            <span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: '4px', padding: '2px 7px', fontSize: '10.5px', fontWeight: 600 }}>
                              Custom / Edited
                            </span>
                          )}
                          {h.isBuiltin && !h.isCustom && (
                            <span style={{ background: '#f1f5f9', color: '#64748b', borderRadius: '4px', padding: '2px 7px', fontSize: '10.5px', fontWeight: 600 }}>
                              Official Reference
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: "'IBM Plex Mono',monospace", marginTop: '2px' }}>
                          {h.date} · Blocks Customer & Internal Audits
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditHoliday(h)}
                          style={css("border:1px solid #cbd5e1;background:#fff;color:#334155;border-radius:6px;padding:5px 10px;font-size:12px;font-weight:600;font-family:'Archivo',sans-serif;cursor:pointer;transition:all .12s")}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#94a3b8';
                            e.currentTarget.style.background = '#f8fafc';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#cbd5e1';
                            e.currentTarget.style.background = '#fff';
                          }}
                          title="Edit holiday date or name"
                        >
                          ✏️ Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteHolidayFromList(h)}
                          style={css("border:1px solid #fecaca;background:#fff;color:#dc2626;border-radius:6px;padding:5px 10px;font-size:12px;font-weight:600;font-family:'Archivo',sans-serif;cursor:pointer;transition:all .12s")}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#fee2e2';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#fff';
                          }}
                          title="Delete holiday (converts to normal working day)"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #f1f3ee' }}>
              <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                💡 Additions, edits, and deletions persist in Cloudflare D1 and reflect immediately on the Schedule calendar.
              </div>
              <button
                type="button"
                onClick={() => setBreakdownModalOpen(false)}
                style={css("background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;padding:7px 18px;border-radius:8px;font-size:12.5px;font-weight:600;font-family:'Archivo',sans-serif;cursor:pointer")}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. ADD / EDIT PUBLIC HOLIDAY SUB-MODAL                                    */}
      {/* ========================================================================= */}
      {editHolidayModalOpen && (
        <div style={css('position:fixed;inset:0;background:rgba(15,23,42,0.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:10000')}>
          <div style={css('background:#fff;border-radius:14px;padding:22px;max-width:440px;width:90%;box-shadow:0 16px 36px rgba(0,0,0,0.2);display:flex;flex-direction:column;gap:14px')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                {editHolidayData.isNew ? '＋ Add Public Holiday' : '✏️ Edit Public Holiday'}
              </div>
              <button
                type="button"
                onClick={() => setEditHolidayModalOpen(false)}
                style={css('width:28px;height:28px;border:1px solid #e2e8f0;background:#fff;border-radius:7px;cursor:pointer;color:#64748b;font-size:14px')}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>
                HOLIDAY DATE
              </label>
              <input
                type="date"
                value={editHolidayData.date}
                onChange={(e) => setEditHolidayData({ ...editHolidayData, date: e.target.value })}
                style={css("width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:7px;padding:8px 10px;font-size:13px;font-family:'IBM Plex Mono',monospace;color:#1e293b;outline:none")}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>
                HOLIDAY NAME / DESCRIPTION
              </label>
              <input
                type="text"
                value={editHolidayData.name}
                onChange={(e) => setEditHolidayData({ ...editHolidayData, name: e.target.value })}
                placeholder="e.g. Makha Bucha Day, Company Sports Day, Special Holiday..."
                style={css("width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:7px;padding:8px 12px;font-size:13px;font-family:'Archivo',sans-serif;color:#1e293b;outline:none")}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px', paddingTop: '12px', borderTop: '1px solid #f1f3ee' }}>
              <button
                type="button"
                onClick={() => setEditHolidayModalOpen(false)}
                style={css("background:#f1f5f9;color:#475569;border:1px solid #cbd5e1;padding:7px 14px;border-radius:8px;font-size:12.5px;font-weight:600;font-family:'Archivo',sans-serif;cursor:pointer")}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditHoliday}
                style={css("background:#2563eb;color:#fff;border:none;padding:7px 18px;border-radius:8px;font-size:12.5px;font-weight:600;font-family:'Archivo',sans-serif;cursor:pointer")}
              >
                Save Holiday
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. RESET TO DEFAULTS CONFIRMATION MODAL                                  */}
      {/* ========================================================================= */}
      {resetConfirmOpen && (
        <div style={css('position:fixed;inset:0;background:rgba(15,23,42,0.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:10001')}>
          <div style={css('background:#fff;border-radius:14px;padding:22px;max-width:420px;width:90%;box-shadow:0 16px 36px rgba(0,0,0,0.2);display:flex;flex-direction:column;gap:12px')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>⚠️</span>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                Reset Public Holidays to Defaults?
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', margin: '4px 0 0 0' }}>
              This will restore all <strong>Public Holidays for {selectedYear}</strong> to the official statutory reference list. Any custom holiday additions, edits, or removals for this year will be cleared.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                style={css("background:#f1f5f9;color:#475569;border:1px solid #cbd5e1;padding:7px 14px;border-radius:8px;font-size:12.5px;font-weight:600;font-family:'Archivo',sans-serif;cursor:pointer")}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResetHolidays}
                style={css("background:#dc2626;color:#fff;border:none;padding:7px 18px;border-radius:8px;font-size:12.5px;font-weight:600;font-family:'Archivo',sans-serif;cursor:pointer")}
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. SINGLE DATE / DATE RANGE RESTRICTION CONFIGURATION MODAL               */}
      {/* ========================================================================= */}
      {modalOpen && (
        <div style={css('position:fixed;inset:0;background:rgba(15,23,42,0.45);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:9999')}>
          <div style={css('background:#fff;border-radius:14px;padding:24px;max-width:480px;width:92%;box-shadow:0 12px 30px rgba(0,0,0,0.15);display:flex;flex-direction:column;gap:18px')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.2px' }}>
                  Configure Calendar Status
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Apply holiday, shutdown, or audit restriction to date
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={css('width:28px;height:28px;border:1px solid #e2e8f0;background:#fff;border-radius:7px;cursor:pointer;color:#64748b;font-size:14px')}
              >
                ✕
              </button>
            </div>

            {/* Date Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                  {isRangeMode ? 'DATE RANGE' : 'DATE'}
                </label>
                <button
                  type="button"
                  onClick={() => setIsRangeMode(!isRangeMode)}
                  style={css("background:transparent;border:none;color:#2756d6;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")}
                >
                  {isRangeMode ? 'Switch to Single Date' : 'Switch to Date Range'}
                </button>
              </div>

              {isRangeMode ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '3px' }}>From</label>
                    <input
                      type="date"
                      value={modalFromDate}
                      onChange={(e) => setModalFromDate(e.target.value)}
                      style={css("width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:7px;padding:7px 10px;font-size:13px;font-family:'IBM Plex Mono',monospace;color:#1e293b;outline:none")}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '3px' }}>To</label>
                    <input
                      type="date"
                      value={modalToDate}
                      onChange={(e) => setModalToDate(e.target.value)}
                      style={css("width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:7px;padding:7px 10px;font-size:13px;font-family:'IBM Plex Mono',monospace;color:#1e293b;outline:none")}
                    />
                  </div>
                </div>
              ) : (
                <input
                  type="date"
                  value={modalFromDate}
                  onChange={(e) => {
                    setModalFromDate(e.target.value);
                    setModalToDate(e.target.value);
                  }}
                  style={css("width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:7px;padding:7px 10px;font-size:13px;font-family:'IBM Plex Mono',monospace;color:#1e293b;outline:none")}
                />
              )}
            </div>

            {/* Type Selector (3 Options) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                STATUS / RESTRICTION TYPE
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* 1. Public Holiday */}
                <div
                  onClick={() => setModalType('PUBLIC_HOLIDAY')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid ' + (modalType === 'PUBLIC_HOLIDAY' ? '#64748b' : '#e2e8f0'),
                    background: modalType === 'PUBLIC_HOLIDAY' ? '#f1f5f9' : '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    transition: 'all .12s',
                  }}
                >
                  <input
                    type="radio"
                    name="holidayType"
                    checked={modalType === 'PUBLIC_HOLIDAY'}
                    onChange={() => setModalType('PUBLIC_HOLIDAY')}
                    style={{ marginTop: '2px' }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                      🔘 Public / General Holiday (Gray)
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '1px' }}>
                      Styled in Gray. Disabled/locked in Schedule — blocks both CS and IA appointments.
                    </div>
                  </div>
                </div>

                {/* 2. Shutdown Plant */}
                <div
                  onClick={() => setModalType('SHUTDOWN_PLANT')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid ' + (modalType === 'SHUTDOWN_PLANT' ? '#2563eb' : '#e2e8f0'),
                    background: modalType === 'SHUTDOWN_PLANT' ? '#eff6ff' : '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    transition: 'all .12s',
                  }}
                >
                  <input
                    type="radio"
                    name="holidayType"
                    checked={modalType === 'SHUTDOWN_PLANT'}
                    onChange={() => setModalType('SHUTDOWN_PLANT')}
                    style={{ marginTop: '2px' }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1d4ed8' }}>
                      🔷 Shutdown Plant (Blue)
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '1px' }}>
                      Styled in Blue with "Shutdown Plant" label. Completely locked — blocks both CS and IA.
                    </div>
                  </div>
                </div>

                {/* 3. No Customer Audits */}
                <div
                  onClick={() => setModalType('NO_CUSTOMER_AUDITS')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid ' + (modalType === 'NO_CUSTOMER_AUDITS' ? '#2563eb' : '#e2e8f0'),
                    background: modalType === 'NO_CUSTOMER_AUDITS' ? '#eff6ff' : '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    transition: 'all .12s',
                  }}
                >
                  <input
                    type="radio"
                    name="holidayType"
                    checked={modalType === 'NO_CUSTOMER_AUDITS'}
                    onChange={() => setModalType('NO_CUSTOMER_AUDITS')}
                    style={{ marginTop: '2px' }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1d4ed8' }}>
                      🔷 No Customer Audits (Blue)
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '1px' }}>
                      Styled in Blue with "No Customer Audits" label. Blocks Customer Audits (CS), strictly restricted to Internal Audits (IA) only. Remains Blue when IA card is added.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Note / Holiday Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                HOLIDAY NAME / NOTE (OPTIONAL)
              </label>
              <input
                type="text"
                value={modalNote}
                onChange={(e) => setModalNote(e.target.value)}
                placeholder="e.g., Annual Maintenance, Songkran Festival, Facility Shut Down..."
                style={css("width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:7px;padding:8px 12px;font-size:12.5px;font-family:'Archivo',sans-serif;color:#1e293b;outline:none")}
              />
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', paddingTop: '14px', borderTop: '1px solid #f1f3ee' }}>
              {customHolidays[modalFromDate] || (modalFromDate && getHolidayForDate(new Date(modalFromDate + 'T00:00:00'), customHolidays)) ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  style={css("background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:600;font-family:'Archivo',sans-serif;cursor:pointer")}
                  title="Remove holiday/restriction and reset this date to a normal working day"
                >
                  Reset to Normal Day
                </button>
              ) : (
                <div />
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={css("background:#f1f5f9;color:#475569;border:1px solid #cbd5e1;padding:8px 16px;border-radius:8px;font-size:12.5px;font-weight:600;font-family:'Archivo',sans-serif;cursor:pointer")}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  style={css("background:#2756d6;color:#fff;border:none;padding:8px 18px;border-radius:8px;font-size:12.5px;font-weight:600;font-family:'Archivo',sans-serif;cursor:pointer")}
                >
                  Save Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
