-- Migration 0012: Add locked_sites column to custom_holidays table
ALTER TABLE custom_holidays ADD COLUMN locked_sites TEXT NOT NULL DEFAULT '';
