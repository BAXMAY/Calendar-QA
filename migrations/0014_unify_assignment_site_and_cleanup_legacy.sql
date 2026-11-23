-- Migration 0014: Unify site1/site2 into site column and cleanup legacy utl1/utl2/utl3 finding counters into results JSON

-- 1. Ensure 'site' column exists on assignments
ALTER TABLE assignments ADD COLUMN site TEXT NOT NULL DEFAULT '';

-- 2. Populate 'site' from existing site1 (Customer Audit) or site2 (Internal Audit)
UPDATE assignments
SET site = CASE
  WHEN site1 IS NOT NULL AND TRIM(site1) != '' THEN site1
  WHEN site2 IS NOT NULL AND TRIM(site2) != '' THEN site2
  ELSE ''
END
WHERE site = '' OR site IS NULL;

-- 3. Synchronize site1 and site2 to match unified site for backward compatibility
UPDATE assignments
SET site1 = site
WHERE (site1 = '' OR site1 IS NULL) AND site != '';

UPDATE assignments
SET site2 = site
WHERE (site2 = '' OR site2 IS NULL) AND site != '';

-- 4. Migrate any positive legacy finding counts (utl1, utl2, utl3) into modern results (JSON) if results is empty or '{}'
UPDATE assignments
SET results = json_object(
  'UTL1', json_object('findings', utl1, 'major', 0, 'minor', 0, 'ofi', 0, 'obs', 0),
  'UTL2', json_object('findings', utl2, 'major', 0, 'minor', 0, 'ofi', 0, 'obs', 0),
  'UTL3', json_object('findings', utl3, 'major', 0, 'minor', 0, 'ofi', 0, 'obs', 0)
)
WHERE (results IS NULL OR results = '' OR results = '{}')
  AND (COALESCE(utl1, 0) > 0 OR COALESCE(utl2, 0) > 0 OR COALESCE(utl3, 0) > 0);

-- 5. Zero out legacy finding count columns
UPDATE assignments
SET utl1 = 0, utl2 = 0, utl3 = 0
WHERE COALESCE(utl1, 0) > 0 OR COALESCE(utl2, 0) > 0 OR COALESCE(utl3, 0) > 0;
