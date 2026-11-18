-- Migration 0011: Optional metadata columns for activity table
ALTER TABLE activity ADD COLUMN action_type TEXT DEFAULT '';
ALTER TABLE activity ADD COLUMN entity_type TEXT DEFAULT '';
ALTER TABLE activity ADD COLUMN date TEXT DEFAULT '';
ALTER TABLE activity ADD COLUMN note TEXT DEFAULT '';
ALTER TABLE activity ADD COLUMN timestamp TEXT DEFAULT '';
