-- Migration 0015: Drop legacy columns site1, site2, utl1, utl2, utl3 from assignments table
-- Prior migration 0014 unified site data into 'site' and migrated utl1/utl2/utl3 counts into 'results' JSON.

ALTER TABLE assignments DROP COLUMN site1;
ALTER TABLE assignments DROP COLUMN site2;
ALTER TABLE assignments DROP COLUMN utl1;
ALTER TABLE assignments DROP COLUMN utl2;
ALTER TABLE assignments DROP COLUMN utl3;
