-- Migration 0013: Ensure UTL3 is present in options table as site_code
INSERT OR IGNORE INTO options (category, value, meta) VALUES ('site_code', 'UTL3', '#1e5fa8');
