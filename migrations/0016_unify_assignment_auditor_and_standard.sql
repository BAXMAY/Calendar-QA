-- Migration 0016: Unify auditor1/auditor2 into 'auditor' and department1/department2 into 'standard'

-- 1. Ensure canonical 'auditor' and 'standard' columns exist on assignments
ALTER TABLE assignments ADD COLUMN auditor TEXT NOT NULL DEFAULT '';
ALTER TABLE assignments ADD COLUMN standard TEXT NOT NULL DEFAULT '';

-- 2. Populate 'auditor' from existing auditor1 (Customer) or auditor2 (Internal)
UPDATE assignments
SET auditor = CASE
  WHEN auditor1 IS NOT NULL AND TRIM(auditor1) != '' THEN TRIM(auditor1)
  WHEN auditor2 IS NOT NULL AND TRIM(auditor2) != '' THEN TRIM(auditor2)
  ELSE ''
END
WHERE auditor = '' OR auditor IS NULL;

-- 3. Populate 'standard' from existing department1 (Customer) or department2 (Internal)
UPDATE assignments
SET standard = CASE
  WHEN department1 IS NOT NULL AND TRIM(department1) != '' THEN TRIM(department1)
  WHEN department2 IS NOT NULL AND TRIM(department2) != '' THEN TRIM(department2)
  ELSE ''
END
WHERE standard = '' OR standard IS NULL;
