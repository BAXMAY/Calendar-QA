-- Remove legacy accounts that used a published demo password.
DELETE FROM sessions WHERE user_id IN ('usr_jordan', 'usr_100234');
DELETE FROM users WHERE id IN ('usr_jordan', 'usr_100234');

UPDATE users
SET role = 'admin'
WHERE id = (SELECT id FROM users ORDER BY created_at, id LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin');
