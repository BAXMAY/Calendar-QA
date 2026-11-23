-- Migration 0017: Drop legacy columns auditor1, auditor2, department1, department2 from assignments table
-- Prior migration 0016 unified auditor1/auditor2 into 'auditor' and department1/department2 into 'standard'.

ALTER TABLE assignments DROP COLUMN auditor1;
ALTER TABLE assignments DROP COLUMN auditor2;
ALTER TABLE assignments DROP COLUMN department1;
ALTER TABLE assignments DROP COLUMN department2;
