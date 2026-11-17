import { useState, useMemo } from 'react';
import type { VM } from '../useScheduler';
import type { CustomHolidayType, CustomHoliday } from '../holidays';
import { isBuiltinPublicHoliday } from '../holidays';
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

  // Modal State for date/range configuration
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFromDate, setModalFromDate] = useState('');
  const [modalToDate, setModalToDate] = useState('');
  const [modalType, setModalType] = useState<CustomHolidayType>('NO_CUSTOMER_AUDITS');
  const [modalNote, setModalNote] = useState('');
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [builtinModalInfo, setBuiltinModalInfo] = useState<{ name: string; dateStr: string } | null>(null);

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

  // Open modal for a specific day
  const handleDayClick = (dateStr: string, dateObj: Date) => {
    const builtin = isBuiltinPublicHoliday(dateObj);
    if (builtin.isBuiltin && builtin.name) {
      setBuiltinModalInfo({ name: builtin.name, dateStr });
      return;
    }

    const existing = customHolidays[dateStr];
    setModalFromDate(dateStr);
    setModalToDate(dateStr);
    setIsRangeMode(false);
    if (existing) {
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

  // Handle saving holiday rule
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

  // Handle removing holiday rule
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
      builtin: { isBuiltin: boolean; name?: string; isSubstitute?: boolean };
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
        builtin: { isBuiltin: false },
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
      const builtin = isBuiltinPublicHoliday(dateObj);
      const custom = customHolidays[dateStr];

      cells.push({
        blank: false,
        dateStr,
        dayNum: d,
        dateObj,
        isToday,
        isWeekend,
        builtin,
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
        builtin: { isBuiltin: false },
      });
    }

    return cells;
  }, [selectedYear, selectedMonth, customHolidays, today]);

  // Statistics for Current Year
  const yearStats = useMemo(() => {
    let builtinCount = 0;
    let customPublicCount = 0;
    let shutdownCount = 0;
    let noCsCount = 0;

    // Count built-ins for selectedYear
    for (let m = 0; m < 12; m++) {
      const days = new Date(selectedYear, m + 1, 0).getDate();
      for (let d = 1; d <= days; d++) {
        const dt = new Date(selectedYear, m, d);
        if (isBuiltinPublicHoliday(dt).isBuiltin) {
          builtinCount++;
        }
      }
    }

    // Count custom holidays for selectedYear
    for (const [dateKey, itemVal] of Object.entries(customHolidays)) {
      const item = itemVal as CustomHoliday;
      if (dateKey.startsWith(`${selectedYear}-`)) {
        if (item.type === 'PUBLIC_HOLIDAY') customPublicCount++;
        else if (item.type === 'SHUTDOWN_PLANT') shutdownCount++;
        else if (item.type === 'NO_CUSTOMER_AUDITS') noCsCount++;
      }
    }

    return { builtinCount, customPublicCount, shutdownCount, noCsCount };
  }, [selectedYear, customHolidays]);

  // List of active custom rules sorted by date
  const activeCustomList = useMemo(() => {
    return (Object.values(customHolidays) as CustomHoliday[]).sort((a: CustomHoliday, b: CustomHoliday) => a.date.localeCompare(b.date));
  }, [customHolidays]);

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

        {/* Year Statistics Bar */}
        <div style={css('display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-top:16px;padding-top:16px;border-top:1px solid #f1f3ee')}>
          <div style={css('background:#f8fafc;border:1px solid #e2e8f0;border-radius:9px;padding:10px 14px')}>
            <div style={css('font-size:11px;font-weight:600;color:#64748b')}>Built-in Public Holidays ({selectedYear})</div>
            <div style={css("font-size:18px;font-weight:700;color:#334155;margin-top:2px;font-family:'Archivo',sans-serif")}>
              {yearStats.builtinCount} <span style={css('font-size:11px;font-weight:500;color:#94a3b8')}>days (Locked 🔒)</span>
            </div>
          </div>

          <div style={css('background:#f8fafc;border:1px solid #e2e8f0;border-radius:9px;padding:10px 14px')}>
            <div style={css('font-size:11px;font-weight:600;color:#64748b')}>General / Custom Holidays</div>
            <div style={css("font-size:18px;font-weight:700;color:#475569;margin-top:2px;font-family:'Archivo',sans-serif")}>
              {yearStats.customPublicCount} <span style={css('font-size:11px;font-weight:500;color:#94a3b8')}>days</span>
            </div>
          </div>

          <div style={css('background:#eff6ff;border:1px solid #bfdbfe;border-radius:9px;padding:10px 14px')}>
            <div style={css('font-size:11px;font-weight:600;color:#1e40af')}>Shutdown Plant</div>
            <div style={css("font-size:18px;font-weight:700;color:#1d4ed8;margin-top:2px;font-family:'Archivo',sans-serif")}>
              {yearStats.shutdownCount} <span style={css('font-size:11px;font-weight:500;color:#60a5fa')}>days</span>
            </div>
          </div>

          <div style={css('background:#eff6ff;border:1px solid #bfdbfe;border-radius:9px;padding:10px 14px')}>
            <div style={css('font-size:11px;font-weight:600;color:#1e40af')}>No Customer Audits</div>
            <div style={css("font-size:18px;font-weight:700;color:#1d4ed8;margin-top:2px;font-family:'Archivo',sans-serif")}>
              {yearStats.noCsCount} <span style={css('font-size:11px;font-weight:500;color:#60a5fa')}>days</span>
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

        {/* 7-Day Column Headers */}
        <div style={css('display:grid;grid-template-columns:repeat(7,1fr);border-bottom:1px solid #eef1ea;background:#f8faf8')}>
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

            const { builtin, custom, isToday, isWeekend, dateStr, dayNum, dateObj } = c;

            // Determine styling
            let cellBg = '#ffffff';
            let titleColor = '#1e293b';
            let badgeBg = 'transparent';
            let badgeBorder = 'transparent';
            let badgeText = '#475569';
            let statusLabel = '';
            let subtitle = '';
            let isLocked = false;

            if (builtin.isBuiltin) {
              cellBg = '#f3f4f6';
              titleColor = '#374151';
              badgeBg = '#e5e7eb';
              badgeBorder = '#d1d5db';
              badgeText = '#374151';
              statusLabel = `🔒 ${builtin.name}`;
              isLocked = true;
            } else if (custom) {
              if (custom.type === 'PUBLIC_HOLIDAY') {
                cellBg = '#f3f4f6';
                titleColor = '#374151';
                badgeBg = '#e5e7eb';
                badgeBorder = '#d1d5db';
                badgeText = '#374151';
                statusLabel = custom.note ? `● ${custom.note}` : '● General Holiday';
              } else if (custom.type === 'SHUTDOWN_PLANT') {
                cellBg = '#eff6ff';
                titleColor = '#1d4ed8';
                badgeBg = '#dbeafe';
                badgeBorder = '#bfdbfe';
                badgeText = '#1d4ed8';
                statusLabel = '🏭 Shutdown Plant';
                subtitle = custom.note || '';
              } else if (custom.type === 'NO_CUSTOMER_AUDITS') {
                cellBg = '#eff6ff';
                titleColor = '#1d4ed8';
                badgeBg = '#dbeafe';
                badgeBorder = '#bfdbfe';
                badgeText = '#1d4ed8';
                statusLabel = '🚫 No Customer Audits';
                subtitle = custom.note || '';
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
                  cursor: isLocked ? 'default' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all .12s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isLocked) e.currentTarget.style.filter = 'brightness(0.97)';
                }}
                onMouseLeave={(e) => {
                  if (!isLocked) e.currentTarget.style.filter = 'none';
                }}
                title={
                  isLocked
                    ? `${dateStr}: ${builtin.name} (Built-in Public Holiday)`
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
                      <div>{statusLabel}</div>
                      {subtitle && (
                        <div style={{ fontSize: '9.5px', fontWeight: 500, opacity: 0.85, marginTop: '2px' }}>
                          {subtitle}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: '10.5px',
                        color: '#cbd5e1',
                        fontStyle: 'italic',
                        textAlign: 'center',
                        opacity: 0,
                      }}
                      className="hover-hint"
                    >
                      + Set rule
                    </div>
                  )}
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
              const isBlue = item.type === 'SHUTDOWN_PLANT' || item.type === 'NO_CUSTOMER_AUDITS';
              const typeLabel =
                item.type === 'PUBLIC_HOLIDAY'
                  ? 'General Holiday'
                  : item.type === 'SHUTDOWN_PLANT'
                  ? 'Shutdown Plant'
                  : 'No Customer Audits';

              return (
                <div
                  key={item.date}
                  style={css(`display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-radius:8px;border:1px solid ${isBlue ? '#bfdbfe' : '#d1d5db'};background:${isBlue ? '#eff6ff' : '#f3f4f6'}`)}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', fontWeight: 700, color: isBlue ? '#1d4ed8' : '#374151' }}>
                        {item.date}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: isBlue ? '#1e40af' : '#475569' }}>
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
                    title={`Delete rule for ${item.date}`}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Built-in Holiday Notice Modal (Locked) */}
      {builtinModalInfo && (
        <div style={css('position:fixed;inset:0;background:rgba(15,23,42,0.45);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:9999')}>
          <div style={css('background:#fff;border-radius:14px;padding:22px 24px;max-width:400px;width:90%;box-shadow:0 12px 30px rgba(0,0,0,0.15)')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>🔒</span>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  {builtinModalInfo.name}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', fontFamily: "'IBM Plex Mono',monospace", marginTop: '2px' }}>
                  {builtinModalInfo.dateStr}
                </div>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', marginTop: '14px', lineHeight: '1.5' }}>
              This is a standard <strong>Official Company Public Holiday</strong> permanently registered in the corporate calendar. It remains locked as Gray and blocks all appointment creation.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => setBuiltinModalInfo(null)}
                style={css("background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;padding:7px 16px;border-radius:8px;font-size:12.5px;font-weight:600;font-family:'Archivo',sans-serif;cursor:pointer")}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Custom Holiday / Restriction Configuration Modal */}
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
                      🔘 General / Public Holiday (Gray)
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

            {/* Optional Note */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                NOTE / SUBTITLE (OPTIONAL)
              </label>
              <input
                type="text"
                value={modalNote}
                onChange={(e) => setModalNote(e.target.value)}
                placeholder="e.g., Annual Maintenance, Facility Shut Down, Ship-out support..."
                style={css("width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:7px;padding:8px 12px;font-size:12.5px;font-family:'Archivo',sans-serif;color:#1e293b;outline:none")}
              />
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', paddingTop: '14px', borderTop: '1px solid #f1f3ee' }}>
              {customHolidays[modalFromDate] ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  style={css("background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:600;font-family:'Archivo',sans-serif;cursor:pointer")}
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
