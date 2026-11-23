interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}


function normalizeSite(site: string): string {
  if (!site) return '';
  const s = site.trim();
  const match = s.match(/^u(1|2|3|2a|2b|3a|3t)$/i);
  if (match) return 'UTL' + match[1].toUpperCase();
  const utlMatch = s.match(/^utl(1|2|3|2a|2b|3a|3t)$/i);
  if (utlMatch) return 'UTL' + utlMatch[1].toUpperCase();
  return s;
}

const SITE_ORDER = [
  'UTL1',
  'UTL2',
  'UTL2A',
  'UTL2B',
  'UTL3',
  'UTL3A',
  'UTL3T',
] as const;

function getSiteOrderIndex(site: string): number {
  if (!site) return 999;
  const norm = normalizeSite(site).toUpperCase();
  const idx = (SITE_ORDER as readonly string[]).indexOf(norm);
  return idx !== -1 ? idx : 999;
}

function sortSites(sites: string[]): string[] {
  if (!sites || sites.length <= 1) return sites ? [...sites] : [];
  return [...sites].sort((a, b) => {
    const idxA = getSiteOrderIndex(a);
    const idxB = getSiteOrderIndex(b);
    if (idxA !== idxB) {
      return idxA - idxB;
    }
    return normalizeSite(a).localeCompare(normalizeSite(b));
  });
}

function normalizeSites(raw: string): string {
  if (!raw) return '';
  const parts = raw
    .split(/[/,]/)
    .map((s) => normalizeSite(s.trim()))
    .filter(Boolean);
  if (parts.length === 0) return '';
  const uniqueSites = Array.from(new Set(parts));
  const sorted = sortSites(uniqueSites);
  return sorted.join('/');
}

function normalizeAuditResults(results: any): Record<string, any> {
  if (!results || typeof results !== 'object') return {};
  const out: Record<string, any> = {};
  for (const [key, val] of Object.entries(results)) {
    if (!val) continue;
    const normKey = normalizeSite(key);
    if (!out[normKey]) {
      out[normKey] = val;
    } else {
      out[normKey] = {
        major: (Number((out[normKey] as any).major) || 0) + (Number((val as any).major) || 0),
        minor: (Number((out[normKey] as any).minor) || 0) + (Number((val as any).minor) || 0),
        ofi: (Number((out[normKey] as any).ofi) || 0) + (Number((val as any).ofi) || 0),
        obs: (Number((out[normKey] as any).obs) || 0) + (Number((val as any).obs) || 0),
        findings: (Number((out[normKey] as any).findings) || 0) + (Number((val as any).findings) || 0),
      };
    }
  }
  return out;
}

function parseLockedSites(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean);
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return [];
    if (s.startsWith('[') && s.endsWith(']')) {
      try {
        const arr = JSON.parse(s);
        if (Array.isArray(arr)) return arr.map((x) => String(x).trim()).filter(Boolean);
      } catch {}
    }
    return s.split(',').map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

async function insertActivityLog(
  DB: D1Database,
  entry: {
    id?: string;
    who: string;
    text: string;
    ago?: string;
    color?: string;
    actionType?: string;
    entityType?: string;
    date?: string;
    note?: string;
    timestamp?: string;
  }
) {
  const actId = entry.id || ('act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
  const ts = entry.timestamp || new Date().toISOString();
  const who = entry.who || 'Jordan Lee';
  const text = entry.text || '';
  const ago = entry.ago || 'just now';
  const color = entry.color || '#0f9d8c';
  const actionType = entry.actionType || 'CREATE';
  const entityType = entry.entityType || 'HOLIDAY';
  const date = entry.date || '';
  const note = entry.note || '';

  try {
    await DB.prepare(
      'INSERT INTO activity (id, who, text, ago, color, action_type, entity_type, date, note, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(actId, who, text, ago, color, actionType, entityType, date, note, ts).run();
  } catch {
    try {
      await DB.prepare(
        'INSERT INTO activity (id, who, text, ago, color) VALUES (?, ?, ?, ?, ?)'
      ).bind(actId, who, text, ago, color).run();
    } catch (e2) {
      console.error('Failed to insert activity:', e2);
    }
  }

  return {
    id: actId,
    who,
    text,
    ago,
    color,
    actionType,
    entityType,
    date,
    note,
    timestamp: ts,
  };
}

function engineerOut(r: any) {
  const dept = (r.host_department === 'Non-QA' || r.department === 'Non-QA')
    ? 'Non-QA'
    : ((r.host_department === 'QA' || r.department === 'QA') ? 'QA' : undefined);
  const site = r.site || (r.department && r.department !== 'QA' && r.department !== 'Non-QA' ? r.department : 'UTL1');
  return {
    id: r.id,
    name: r.name,
    role: r.role,
    site,
    department: dept,
    subDepartments: JSON.parse(r.sub_departments || '[]'),
  };
}

function assignmentOut(r: any) {
  let parsedResults = {};
  if (r.results) {
    try {
      parsedResults = typeof r.results === 'string' ? JSON.parse(r.results) : r.results;
    } catch {}
  }
  // Migrate legacy utl1, utl2, utl3 if results JSON is empty
  if (Object.keys(parsedResults).length === 0 && (r.utl1 || r.utl2 || r.utl3)) {
    const legacyRes: any = {};
    if (r.utl1) legacyRes.UTL1 = { findings: r.utl1, major: 0, minor: 0, ofi: 0, obs: 0 };
    if (r.utl2) legacyRes.UTL2 = { findings: r.utl2, major: 0, minor: 0, ofi: 0, obs: 0 };
    if (r.utl3) legacyRes.UTL3 = { findings: r.utl3, major: 0, minor: 0, ofi: 0, obs: 0 };
    parsedResults = legacyRes;
  }
  const site = normalizeSites(r.site || r.site1 || r.site2 || '');
  return {
    id: r.id, eng: r.eng, order: r.order_id, day: r.day, week: r.week,
    site,
    site1: site,
    site2: site,
    customer: r.customer, endCustomer: r.end_customer, auditor1: r.auditor1, purpose: r.purpose,
    targetPackage: r.target_package || '', customerNames: r.customer_names || '', auditCategory: r.audit_category || '',
    area: r.area, auditor2: r.auditor2, department1: r.department1, department2: r.department2,
    department: (r.department === 'Non-QA' ? 'Non-QA' : r.department === 'QA' ? 'QA' : undefined) as any,
    major: r.major, minor: r.minor, ofi: r.ofi, request: r.request,
    results: normalizeAuditResults(parsedResults),
    createdAt: r.created_at || (r.created_at_num ? String(r.created_at_num) : undefined),
    updatedAt: r.updated_at || undefined,
  };
}

let migrationChecked = false;
async function ensureAssignmentColumns(DB: D1Database) {
  if (migrationChecked) return;
  try {
    await DB.prepare('ALTER TABLE assignments ADD COLUMN site TEXT NOT NULL DEFAULT ""').run();
  } catch {}
  try {
    await DB.prepare(`UPDATE assignments SET site = CASE WHEN site1 IS NOT NULL AND TRIM(site1) != '' THEN site1 ELSE COALESCE(site2, '') END WHERE site = '' OR site IS NULL`).run();
  } catch {}
  try {
    await DB.prepare('ALTER TABLE assignments ADD COLUMN target_package TEXT NOT NULL DEFAULT ""').run();
  } catch {}
  try {
    await DB.prepare('ALTER TABLE assignments ADD COLUMN customer_names TEXT NOT NULL DEFAULT ""').run();
  } catch {}
  try {
    await DB.prepare('ALTER TABLE assignments ADD COLUMN audit_category TEXT NOT NULL DEFAULT ""').run();
  } catch {}
  try {
    await DB.prepare('ALTER TABLE assignments ADD COLUMN department TEXT NOT NULL DEFAULT "QA"').run();
  } catch {}
  try {
    await DB.prepare('ALTER TABLE assignments ADD COLUMN results TEXT NOT NULL DEFAULT "{}"').run();
  } catch {}
  try {
    await DB.prepare('ALTER TABLE assignments ADD COLUMN created_at TEXT NOT NULL DEFAULT ""').run();
  } catch {}
  try {
    await DB.prepare('ALTER TABLE assignments ADD COLUMN updated_at TEXT NOT NULL DEFAULT ""').run();
  } catch {}
  try {
    await DB.prepare('ALTER TABLE engineers ADD COLUMN site TEXT NOT NULL DEFAULT "UTL1"').run();
  } catch {}
  try {
    await DB.prepare('ALTER TABLE engineers ADD COLUMN host_department TEXT NOT NULL DEFAULT "QA"').run();
  } catch {}
  try {
    await DB.prepare("UPDATE options SET value = 'UTL1' WHERE category = 'site_code' AND value = 'U1'").run();
    await DB.prepare("UPDATE options SET value = 'UTL2' WHERE category = 'site_code' AND value = 'U2'").run();
    await DB.prepare("UPDATE options SET value = 'UTL2A' WHERE category = 'site_code' AND value = 'U2A'").run();
    await DB.prepare("UPDATE options SET value = 'UTL2B' WHERE category = 'site_code' AND value = 'U2B'").run();
    await DB.prepare("UPDATE options SET value = 'UTL3' WHERE category = 'site_code' AND value = 'U3'").run();
    await DB.prepare("UPDATE options SET value = 'UTL3A' WHERE category = 'site_code' AND value = 'U3A'").run();
    await DB.prepare("UPDATE options SET value = 'UTL3T' WHERE category = 'site_code' AND value = 'U3T'").run();
    await DB.prepare("INSERT OR IGNORE INTO options (category, value, meta) VALUES ('site_code', 'UTL3', '#1e5fa8')").run();
  } catch {}
  migrationChecked = true;
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + ':' + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

let usersTableChecked = false;
async function ensureUsersTable(DB: D1Database) {
  if (usersTableChecked) return;
  try {
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL DEFAULT '',
        name TEXT NOT NULL DEFAULT '',
        role TEXT NOT NULL DEFAULT 'user',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    await DB.prepare(`
      INSERT OR IGNORE INTO users (id, username, password_hash, salt, name, role) VALUES
      ('usr_jordan', 'jordan.lee', '2d058547072ff2557887cbe75c1633a2cc7fe0c9afc2a243817ea7a4d55f91fe', 'seed_salt', 'Jordan Lee', 'admin'),
      ('usr_100234', '100234', '2d058547072ff2557887cbe75c1633a2cc7fe0c9afc2a243817ea7a4d55f91fe', 'seed_salt', 'Jordan Lee', 'admin')
    `).run();
  } catch {}
  usersTableChecked = true;
}

let customHolidaysTableChecked = false;
async function ensureCustomHolidaysTable(DB: D1Database) {
  if (customHolidaysTableChecked) return;
  try {
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS custom_holidays (
        date TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        note TEXT NOT NULL DEFAULT '',
        locked_sites TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    try {
      await DB.prepare("ALTER TABLE custom_holidays ADD COLUMN locked_sites TEXT NOT NULL DEFAULT ''").run();
    } catch {}
  } catch {}
  customHolidaysTableChecked = true;
}

async function handleApi(request: Request, env: Env, path: string): Promise<Response> {
  const method = request.method.toUpperCase();
  const DB = env.DB;

  if (method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const body = method === 'GET' || method === 'HEAD' ? null : await request.json().catch(() => null);

  try {
    await ensureAssignmentColumns(DB);
    await ensureUsersTable(DB);
    await ensureCustomHolidaysTable(DB);

    // --- auth: register / signup ---
    if (method === 'POST' && (path === 'auth/register' || path === 'auth/signup')) {
      const { userId, username, password, name } = body || {};
      const rawUser = String(userId || username || '').trim();
      const rawPass = String(password || '');

      if (!rawUser) {
        return json({ error: 'User ID is required.' }, 400);
      }
      if (!/^[a-zA-Z0-9._-]+$/.test(rawUser)) {
        return json({ error: 'User ID may only contain letters, numbers, dashes, or dots.' }, 400);
      }
      if (!rawPass || rawPass.length < 4) {
        return json({ error: 'Password must be at least 4 characters long.' }, 400);
      }

      const existing = await DB.prepare('SELECT id, username FROM users WHERE LOWER(username) = LOWER(?)').bind(rawUser).first();
      if (existing) {
        return json({ error: 'User ID is already registered.' }, 409);
      }

      const salt = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
      const passwordHash = await hashPassword(rawPass, salt);
      const newUserId = 'usr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      const displayName = String(name || rawUser).trim();

      await DB.prepare(
        'INSERT INTO users (id, username, password_hash, salt, name, role) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(newUserId, rawUser, passwordHash, salt, displayName, 'user').run();

      return json({
        ok: true,
        user: {
          id: newUserId,
          username: rawUser,
          name: displayName,
          role: 'user',
        },
      }, 201);
    }

    // --- auth: login / signin ---
    if (method === 'POST' && (path === 'auth/login' || path === 'auth/signin')) {
      const { userId, username, password } = body || {};
      const rawUser = String(userId || username || '').trim();
      const rawPass = String(password || '');

      if (!rawUser) {
        return json({ error: 'Please enter your User ID.' }, 400);
      }
      if (!rawPass) {
        return json({ error: 'Please enter your password.' }, 400);
      }

      const user = await DB.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)').bind(rawUser).first<any>();
      if (!user) {
        return json({ error: 'User ID is not registered. Please sign up first.' }, 401);
      }

      const testHash = await hashPassword(rawPass, user.salt || '');
      if (testHash !== user.password_hash) {
        return json({ error: 'Incorrect password. Please try again.' }, 401);
      }

      return json({
        ok: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name || user.username,
          role: user.role || 'user',
        },
      });
    }

    // --- auth: reset password ---
    if (method === 'POST' && (path === 'auth/reset-password' || path === 'auth/reset')) {
      const { userId, username, newPassword, password } = body || {};
      const rawUser = String(userId || username || '').trim();
      const rawPass = String(newPassword || password || '');

      if (!rawUser) {
        return json({ error: 'User ID is required.' }, 400);
      }
      if (!rawPass || rawPass.length < 4) {
        return json({ error: 'New password must be at least 4 characters long.' }, 400);
      }

      const user = await DB.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)').bind(rawUser).first<any>();
      if (!user) {
        return json({ error: 'User ID is not registered.' }, 404);
      }

      const salt = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
      const passwordHash = await hashPassword(rawPass, salt);

      await DB.prepare(
        'UPDATE users SET password_hash = ?, salt = ? WHERE id = ?'
      ).bind(passwordHash, salt, user.id).run();

      return json({
        ok: true,
        message: 'Password updated successfully.',
      });
    }

    // --- GET /api/state (full data dump for initial load) ---
    if (method === 'GET' && path === 'state') {
      const [engineers, plants, activePlantsRows, orders, assignments, comments, activity, optionsRows, holidaysRows] = await Promise.all([
        DB.prepare('SELECT * FROM engineers').all(),
        DB.prepare('SELECT * FROM plants').all(),
        DB.prepare('SELECT * FROM active_plants').all(),
        DB.prepare('SELECT * FROM orders').all(),
        DB.prepare('SELECT * FROM assignments').all(),
        DB.prepare('SELECT * FROM comments').all(),
        DB.prepare('SELECT * FROM activity ORDER BY rowid DESC LIMIT 50').all(),
        DB.prepare('SELECT * FROM options').all(),
        DB.prepare('SELECT date, type, note, locked_sites, created_at, updated_at FROM custom_holidays ORDER BY date ASC').all().catch(() => ({ results: [] })),
      ]);

      const activePlants: Record<string, boolean> = {};
      for (const row of activePlantsRows.results as any[]) activePlants[row.plant_id] = !!row.active;

      const purposeOptions: string[] = [];
      const customerDepartmentOptions: string[] = [];
      const internalDepartmentOptions: string[] = [];
      const departmentOptions: string[] = [];
      const siteCodeOptions: string[] = [];
      const siteColors: Record<string, string> = {};
      const customerOptions: string[] = [];
      const endCustomerOptions: string[] = [];
      const auditorOptions: string[] = [];
      const targetPackageOptions: string[] = [];
      const customerNameOptions: string[] = [];
      const auditCategoryOptions: string[] = [];
      const orderMap: Record<string, string[]> = {};

      for (const row of (optionsRows.results as any[] || [])) {
        if (row.category && row.category.startsWith('_order_')) {
          try {
            orderMap[row.category.replace('_order_', '')] = JSON.parse(row.value);
          } catch {}
          continue;
        }
        if (row.category === 'purpose') purposeOptions.push(row.value);
        else if (row.category === 'customer_department') customerDepartmentOptions.push(row.value);
        else if (row.category === 'internal_department') internalDepartmentOptions.push(row.value);
        else if (row.category === 'department') departmentOptions.push(row.value);
        else if (row.category === 'site_code') {
          const norm = normalizeSite(row.value);
          if (!siteCodeOptions.includes(norm)) siteCodeOptions.push(norm);
          if (row.meta) {
            siteColors[norm] = row.meta;
            siteColors[row.value] = row.meta;
          }
        } else if (row.category === 'customer_name') {
          customerOptions.push(row.value);
        } else if (row.category === 'end_customer') {
          endCustomerOptions.push(row.value);
        } else if (row.category === 'auditor') {
          auditorOptions.push(row.value);
        } else if (row.category === 'target_package') {
          targetPackageOptions.push(row.value);
        } else if (row.category === 'customer_names' || row.category === 'customer_name_item') {
          customerNameOptions.push(row.value);
        } else if (row.category === 'audit_category') {
          auditCategoryOptions.push(row.value);
        }
      }

      const applyOrder = (list: string[], cat: string) => {
        const customOrder = orderMap[cat];
        if (!customOrder || customOrder.length === 0) return list;
        const indexMap = new Map<string, number>();
        customOrder.forEach((val, idx) => indexMap.set(val.trim().toLowerCase(), idx));
        return [...list].sort((a, b) => {
          const idxA = indexMap.has(a.trim().toLowerCase()) ? indexMap.get(a.trim().toLowerCase())! : 9999;
          const idxB = indexMap.has(b.trim().toLowerCase()) ? indexMap.get(b.trim().toLowerCase())! : 9999;
          if (idxA !== idxB) return idxA - idxB;
          return 0;
        });
      };

      return json({
        engineers: (engineers.results as any[]).map(engineerOut),
        plants: plants.results,
        activePlants,
        orders: orders.results,
        assignments: (assignments.results as any[]).map(assignmentOut),
        comments: (comments.results as any[]).reduce((acc, r) => {
          (acc[r.assignment_id] ||= []).push({ id: r.id, who: r.who, initials: r.initials, text: r.text, ago: r.ago, color: r.color });
          return acc;
        }, {} as Record<string, any[]>),
        activity: activity.results,
        purposeOptions: applyOrder(purposeOptions, 'purpose'),
        customerDepartmentOptions: applyOrder(customerDepartmentOptions, 'customer_department'),
        internalDepartmentOptions: applyOrder(internalDepartmentOptions, 'internal_department'),
        departmentOptions: applyOrder(departmentOptions.length > 0 ? departmentOptions : ['QA', 'Non-QA'], 'department'),
        siteCodeOptions: applyOrder(siteCodeOptions, 'site_code'),
        siteColors,
        customerOptions: applyOrder(customerOptions, 'customer_name'),
        endCustomerOptions: applyOrder(endCustomerOptions, 'end_customer'),
        auditorOptions: applyOrder(auditorOptions, 'auditor'),
        targetPackageOptions: applyOrder(targetPackageOptions, 'target_package'),
        customerNameOptions: applyOrder(customerNameOptions, 'customer_names'),
        auditCategoryOptions: applyOrder(auditCategoryOptions, 'audit_category'),
        customHolidays: ((holidaysRows.results as any[]) || []).map((r) => ({
          date: r.date,
          type: r.type,
          note: r.note || '',
          lockedSites: parseLockedSites(r.locked_sites),
          created_at: r.created_at,
          updated_at: r.updated_at,
        })),
      });
    }

    // --- engineers ---
    if (method === 'GET' && path === 'engineers') {
      const { results } = await DB.prepare('SELECT * FROM engineers').all();
      return json((results as any[]).map(engineerOut));
    }
    if (method === 'POST' && path === 'engineers') {
      const { id, name, role, site, department, subDepartments } = body || {};
      const sd = JSON.stringify(subDepartments || []);
      const hostDept = department === 'Non-QA' ? 'Non-QA' : (department === 'QA' ? 'QA' : '');
      const engSite = site || 'UTL1';
      await DB.prepare('INSERT INTO engineers (id, name, role, department, site, host_department, sub_departments) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(id, name || '', role || '', hostDept, engSite, hostDept, sd).run();
      return json({ id, name, role, site: engSite, department: hostDept || undefined, subDepartments: subDepartments || [] }, 201);
    }
    const engMatch = path.match(/^engineers\/(.+)$/);
    if (engMatch && method === 'PUT') {
      const { name, role, site, department, subDepartments } = body || {};
      const hostDept = department === 'Non-QA' ? 'Non-QA' : (department === 'QA' ? 'QA' : '');
      const engSite = site || 'UTL1';
      await DB.prepare('UPDATE engineers SET name = ?, role = ?, department = ?, site = ?, host_department = ?, sub_departments = ? WHERE id = ?')
        .bind(name || '', role || '', hostDept, engSite, hostDept, JSON.stringify(subDepartments || []), engMatch[1]).run();
      return json({ ok: true });
    }
    if (engMatch && method === 'DELETE') {
      const id = engMatch[1];
      await DB.prepare('DELETE FROM comments WHERE assignment_id IN (SELECT id FROM assignments WHERE eng = ?)').bind(id).run();
      await DB.prepare('DELETE FROM assignments WHERE eng = ?').bind(id).run();
      await DB.prepare('DELETE FROM engineers WHERE id = ?').bind(id).run();
      return json({ ok: true });
    }

    // --- plants ---
    if (method === 'GET' && path === 'plants') {
      const { results } = await DB.prepare('SELECT * FROM plants').all();
      return json(results);
    }
    if (method === 'POST' && path === 'plants') {
      const { id, name, loc, code, color } = body || {};
      const pid = id || name;
      await DB.prepare('INSERT INTO plants (id, name, loc, code, color) VALUES (?, ?, ?, ?, ?)')
        .bind(pid, name || '', loc || '', code || '', color || '#2f6df0').run();
      await DB.prepare('INSERT OR IGNORE INTO active_plants (plant_id, active) VALUES (?, 1)').bind(pid).run();
      return json({ id: pid, name, loc, code, color: color || '#2f6df0' }, 201);
    }
    const plantToggleMatch = path.match(/^plants\/(.+)\/toggle$/);
    if (plantToggleMatch && method === 'POST') {
      const pid = plantToggleMatch[1];
      const existing = await DB.prepare('SELECT active FROM active_plants WHERE plant_id = ?').bind(pid).first<{ active: number }>();
      const nowActive = existing ? !existing.active : true;
      if (existing) {
        await DB.prepare('UPDATE active_plants SET active = ? WHERE plant_id = ?').bind(nowActive ? 1 : 0, pid).run();
      } else {
        await DB.prepare('INSERT INTO active_plants (plant_id, active) VALUES (?, ?)').bind(pid, nowActive ? 1 : 0).run();
      }
      return json({ plant_id: pid, active: nowActive });
    }
    const plantMatch = path.match(/^plants\/([^/]+)$/);
    if (plantMatch && method === 'DELETE') {
      await DB.prepare('DELETE FROM active_plants WHERE plant_id = ?').bind(plantMatch[1]).run();
      await DB.prepare('DELETE FROM plants WHERE id = ?').bind(plantMatch[1]).run();
      return json({ ok: true });
    }

    // --- orders ---
    if (method === 'GET' && path === 'orders') {
      const { results } = await DB.prepare('SELECT * FROM orders').all();
      return json(results);
    }
    if (method === 'POST' && path === 'orders') {
      const { id, code, customer, product, plant, purpose } = body || {};
      await DB.prepare('INSERT INTO orders (id, code, customer, product, plant, purpose) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(id, code || '', customer || '', product || '', plant || '', purpose || '').run();
      return json({ id, code, customer, product, plant, purpose }, 201);
    }
    const orderMatch = path.match(/^orders\/(.+)$/);
    if (orderMatch && method === 'PUT') {
      const { code, customer, product, plant, purpose } = body || {};
      await DB.prepare('UPDATE orders SET code = ?, customer = ?, product = ?, plant = ?, purpose = ? WHERE id = ?')
        .bind(code || '', customer || '', product || '', plant || '', purpose || '', orderMatch[1]).run();
      return json({ ok: true });
    }
    if (orderMatch && method === 'DELETE') {
      const id = orderMatch[1];
      await DB.prepare('DELETE FROM comments WHERE assignment_id IN (SELECT id FROM assignments WHERE order_id = ?)').bind(id).run();
      await DB.prepare('DELETE FROM assignments WHERE order_id = ?').bind(id).run();
      await DB.prepare('DELETE FROM orders WHERE id = ?').bind(id).run();
      return json({ ok: true });
    }

    // --- assignments ---
    if (method === 'GET' && path === 'assignments') {
      const { results } = await DB.prepare('SELECT * FROM assignments').all();
      return json((results as any[]).map(assignmentOut));
    }
    if (method === 'POST' && path === 'assignments') {
      await ensureAssignmentColumns(DB);
      const d = body || {};
      const dept = d.department === 'Non-QA' ? 'Non-QA' : d.department === 'QA' ? 'QA' : '';
      const resolvedSite = normalizeSites(d.site || (d.sectionType === 'internal' ? d.site2 : d.site1) || '');
      await DB.prepare(
        `INSERT INTO assignments (id, eng, order_id, day, week, site, site1, customer, end_customer, auditor1, purpose, target_package, customer_names, audit_category, site2, area, auditor2, department1, department2, department, results, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        d.id, d.eng || '', d.order || '', d.day ?? 0, d.week ?? 0,
        resolvedSite,
        d.site1 || resolvedSite, d.customer || '', d.endCustomer || '', d.auditor1 || '', d.purpose || '',
        d.targetPackage || '', d.customerNames || '', d.auditCategory || '',
        d.site2 || resolvedSite, d.area || '', d.auditor2 || '', d.department1 || '', d.department2 || '',
        dept,
        typeof d.results === 'string' ? d.results : JSON.stringify(d.results || {}),
        d.createdAt ? String(d.createdAt) : '',
        d.updatedAt ? String(d.updatedAt) : '',
      ).run();
      return json({ id: d.id }, 201);
    }
    const assignMatch = path.match(/^assignments\/(.+)$/);
    if (assignMatch && method === 'PUT') {
      // partial update: callers like moveAssign only send {eng, day, week},
      // submitEdit sends the full field set — merge onto the existing row
      // rather than overwriting untouched columns with blanks.
      const d = body || {};
      const existing = await DB.prepare('SELECT * FROM assignments WHERE id = ?').bind(assignMatch[1]).first<any>();
      if (!existing) return json({ error: 'not found' }, 404);
      await ensureAssignmentColumns(DB);
      const resolvedSite = d.site !== undefined ? normalizeSites(d.site) : (d.site1 !== undefined || d.site2 !== undefined ? normalizeSites(d.site1 || d.site2 || '') : undefined);
      await DB.prepare(
        `UPDATE assignments SET eng = ?, order_id = ?, day = ?, week = ?, site = ?, site1 = ?, customer = ?, end_customer = ?, auditor1 = ?, purpose = ?,
           target_package = ?, customer_names = ?, audit_category = ?, site2 = ?, area = ?, auditor2 = ?, department1 = ?, department2 = ?, department = ?, results = ?,
           created_at = ?, updated_at = ? WHERE id = ?`,
      ).bind(
        d.eng ?? existing.eng, d.order ?? existing.order_id, d.day ?? existing.day, d.week ?? existing.week,
        resolvedSite ?? existing.site ?? '',
        d.site1 ?? resolvedSite ?? existing.site1, d.customer ?? existing.customer, d.endCustomer ?? existing.end_customer, d.auditor1 ?? existing.auditor1, d.purpose ?? existing.purpose,
        d.targetPackage ?? existing.target_package ?? '', d.customerNames ?? existing.customer_names ?? '', d.auditCategory ?? existing.audit_category ?? '',
        d.site2 ?? resolvedSite ?? existing.site2, d.area ?? existing.area, d.auditor2 ?? existing.auditor2, d.department1 ?? existing.department1, d.department2 ?? existing.department2,
        d.department !== undefined ? (d.department || '') : (existing.department ?? ''),
        d.results !== undefined ? (typeof d.results === 'string' ? d.results : JSON.stringify(d.results)) : (existing.results ?? '{}'),
        d.createdAt !== undefined ? String(d.createdAt) : (existing.created_at ?? ''),
        d.updatedAt !== undefined ? String(d.updatedAt) : (existing.updated_at ?? ''),
        assignMatch[1],
      ).run();
      return json({ ok: true });
    }
    if (assignMatch && method === 'DELETE') {
      await DB.prepare('DELETE FROM comments WHERE assignment_id = ?').bind(assignMatch[1]).run();
      await DB.prepare('DELETE FROM assignments WHERE id = ?').bind(assignMatch[1]).run();
      return json({ ok: true });
    }

    // --- comments ---
    if (method === 'POST' && path === 'comments') {
      const { id, assignmentId, who, initials, text, ago, color } = body || {};
      await DB.prepare('INSERT INTO comments (id, assignment_id, who, initials, text, ago, color) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(id, assignmentId, who || '', initials || '', text || '', ago || '', color || '#0f9d8c').run();
      return json({ id }, 201);
    }
    const commentMatch = path.match(/^comments\/(.+)$/);
    if (commentMatch && method === 'DELETE') {
      await DB.prepare('DELETE FROM comments WHERE id = ?').bind(commentMatch[1]).run();
      return json({ ok: true });
    }

    // --- activity ---
    if (method === 'POST' && path === 'activity') {
      const { id, who, text, ago, color } = body || {};
      await DB.prepare('INSERT INTO activity (id, who, text, ago, color) VALUES (?, ?, ?, ?, ?)')
        .bind(id, who || '', text || '', ago || '', color || '#0f9d8c').run();
      return json({ id }, 201);
    }

    // --- options ---
    if (method === 'POST' && path === 'options') {
      const { category, value, meta } = body || {};
      if (category && value) {
        await DB.prepare('INSERT OR REPLACE INTO options (category, value, meta) VALUES (?, ?, ?)')
          .bind(category, value, meta || '').run();
      }
      return json({ ok: true });
    }
    if (method === 'DELETE' && path === 'options') {
      const { category, value } = body || {};
      if (category && value) {
        await DB.prepare('DELETE FROM options WHERE category = ? AND (value = ? OR LOWER(value) = LOWER(?))')
          .bind(category, value, value).run();
      }
      return json({ ok: true });
    }
    if (method === 'PUT' && path === 'options/reorder') {
      const { category, values } = body || {};
      if (category && Array.isArray(values)) {
        await DB.prepare("INSERT OR REPLACE INTO options (category, value, meta) VALUES (?, ?, '')")
          .bind('_order_' + category, JSON.stringify(values)).run();
      }
      return json({ ok: true });
    }

    // --- holidays (custom holidays & plant restrictions) ---
    if (method === 'GET' && path === 'holidays') {
      const { results } = await DB.prepare('SELECT date, type, note, locked_sites, created_at, updated_at FROM custom_holidays ORDER BY date ASC').all();
      return json((results as any[]).map((r) => ({
        date: r.date,
        type: r.type,
        note: r.note || '',
        lockedSites: parseLockedSites(r.locked_sites),
        created_at: r.created_at,
        updated_at: r.updated_at,
      })));
    }
    if (method === 'POST' && path === 'holidays/reset') {
      const year = Number(body?.year) || new Date().getFullYear();
      const prefix = `${year}-%`;
      await DB.prepare("DELETE FROM custom_holidays WHERE date LIKE ? AND type IN ('PUBLIC_HOLIDAY', 'WORKING_DAY')").bind(prefix).run();

      const actor = String(body?.actor || body?.user || 'Jordan Lee').trim();
      const desc = String(body?.description || `Reset Public Holidays to default reference list (${year})`).trim();

      const activity = await insertActivityLog(DB, {
        who: actor,
        text: desc,
        actionType: 'RESET',
        entityType: 'HOLIDAY',
        color: '#b45309',
        date: String(year),
      });

      return json({ ok: true, activity });
    }
    if (method === 'POST' && path === 'holidays') {
      const items = Array.isArray(body?.items) ? body.items : (body ? [body] : []);
      if (items.length === 0) {
        return json({ error: 'No holiday payload provided' }, 400);
      }
      for (const item of items) {
        const d = String(item.date || '').trim();
        const t = String(item.type || '').trim().toUpperCase();
        const note = String(item.note || '').trim();
        if (!d || !['PUBLIC_HOLIDAY', 'SHUTDOWN_PLANT', 'NO_CUSTOMER_AUDITS', 'WORKING_DAY'].includes(t)) {
          continue;
        }
        const lockedSitesList = parseLockedSites(item.lockedSites !== undefined ? item.lockedSites : item.locked_sites);
        const lockedSitesJson = lockedSitesList.length > 0 ? JSON.stringify(lockedSitesList) : '';

        await DB.prepare(
          `INSERT INTO custom_holidays (date, type, note, locked_sites, updated_at)
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(date) DO UPDATE SET type = excluded.type, note = excluded.note, locked_sites = excluded.locked_sites, updated_at = CURRENT_TIMESTAMP`
        ).bind(d, t, note, lockedSitesJson).run();
      }

      // Log activity into D1
      const actor = String(body?.actor || body?.user || 'Jordan Lee').trim();
      let actionType = String(body?.actionType || 'CREATE').toUpperCase();
      let desc = String(body?.description || '').trim();
      let color = '#0f9d8c';

      if (!desc) {
        if (items.length === 1) {
          const it = items[0];
          const d = String(it.date || '').trim();
          const t = String(it.type || '').trim().toUpperCase();
          const n = String(it.note || '').trim();
          if (t === 'PUBLIC_HOLIDAY') {
            desc = `Added Public Holiday "${n || 'Public Holiday'}" on ${d}`;
            color = '#b45309';
          } else if (t === 'SHUTDOWN_PLANT') {
            const sites = parseLockedSites(it.lockedSites !== undefined ? it.lockedSites : it.locked_sites);
            const sitesStr = sites.length > 0 ? (sites.length >= SITE_ORDER.length ? 'All Sites' : sites.join(', ')) : 'All Sites';
            desc = `Set Shutdown Plant (${sitesStr}) on ${d}`;
            color = '#dc2626';
          } else if (t === 'NO_CUSTOMER_AUDITS') {
            desc = `Set No Customer Audits on ${d}`;
            color = '#d97706';
          } else if (t === 'WORKING_DAY') {
            desc = `Removed Public Holiday on ${d}`;
            actionType = 'DELETE';
            color = '#64748b';
          }
        } else {
          const first = items[0];
          const last = items[items.length - 1];
          const t = String(first.type || '').trim().toUpperCase();
          if (t === 'SHUTDOWN_PLANT') {
            const sites = parseLockedSites(first.lockedSites !== undefined ? first.lockedSites : first.locked_sites);
            const sitesStr = sites.length > 0 ? (sites.length >= SITE_ORDER.length ? 'All Sites' : sites.join(', ')) : 'All Sites';
            desc = `Set Shutdown Plant (${sitesStr}) on ${first.date} to ${last.date}`;
            color = '#dc2626';
          } else {
            const typeLabel = t === 'NO_CUSTOMER_AUDITS' ? 'No Customer Audits' : 'Public Holiday';
            desc = `Set ${typeLabel} on ${first.date} to ${last.date}`;
            color = t === 'NO_CUSTOMER_AUDITS' ? '#d97706' : '#b45309';
          }
        }
      }

      const activity = await insertActivityLog(DB, {
        who: actor,
        text: desc,
        actionType,
        entityType: 'HOLIDAY',
        color,
        date: items[0]?.date || '',
        note: items[0]?.note || '',
      });

      return json({ ok: true, activity });
    }
    const holidayDateMatch = path.match(/^holidays\/(.+)$/);
    if (holidayDateMatch && method === 'DELETE') {
      const dateKey = decodeURIComponent(holidayDateMatch[1]).trim();
      const existing = await DB.prepare('SELECT type, note, locked_sites FROM custom_holidays WHERE date = ?').bind(dateKey).first() as { type?: string; note?: string; locked_sites?: string } | null;
      await DB.prepare('DELETE FROM custom_holidays WHERE date = ?').bind(dateKey).run();

      const actor = String(body?.actor || body?.user || 'Jordan Lee').trim();
      let desc = String(body?.description || '').trim();
      if (!desc) {
        if (existing?.type === 'PUBLIC_HOLIDAY') {
          desc = `Removed Public Holiday "${existing.note || 'Public Holiday'}" on ${dateKey}`;
        } else if (existing?.type === 'SHUTDOWN_PLANT') {
          const sites = parseLockedSites(existing.locked_sites);
          const sitesSuffix = sites.length > 0 ? ` (${sites.length >= SITE_ORDER.length ? 'All Sites' : sites.join(', ')})` : '';
          desc = `Removed Shutdown Plant${sitesSuffix} restriction on ${dateKey}`;
        } else if (existing?.type === 'NO_CUSTOMER_AUDITS') {
          desc = `Removed No Customer Audits restriction on ${dateKey}`;
        } else {
          desc = `Removed restriction on ${dateKey}`;
        }
      }

      const activity = await insertActivityLog(DB, {
        who: actor,
        text: desc,
        actionType: 'DELETE',
        entityType: 'HOLIDAY',
        color: '#d9534f',
        date: dateKey,
        note: existing?.note || '',
      });

      return json({ ok: true, activity });
    }
    if (method === 'DELETE' && path === 'holidays') {
      const dates = Array.isArray(body?.dates) ? body.dates : (body?.date ? [body.date] : []);
      for (const d of dates) {
        const dateKey = String(d || '').trim();
        if (dateKey) {
          await DB.prepare('DELETE FROM custom_holidays WHERE date = ?').bind(dateKey).run();
        }
      }

      const actor = String(body?.actor || body?.user || 'Jordan Lee').trim();
      let desc = String(body?.description || '').trim();
      const actionType = String(body?.actionType || 'DELETE').toUpperCase();
      if (!desc) {
        desc = dates.length > 1
          ? `Removed calendar restrictions on ${dates[0]} to ${dates[dates.length - 1]}`
          : `Removed calendar restriction on ${dates[0] || 'date'}`;
      }

      const activity = await insertActivityLog(DB, {
        who: actor,
        text: desc,
        actionType,
        entityType: 'HOLIDAY',
        color: '#d9534f',
        date: dates[0] || '',
      });

      return json({ ok: true, activity });
    }

    return json({ error: 'not found', path, method }, 404);
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      const path = url.pathname.replace(/^\/api\//, '').replace(/\/$/, '');
      return handleApi(request, env, path);
    }
    return env.ASSETS.fetch(request);
  },
};
