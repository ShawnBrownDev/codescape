-- Check what metadata we have for users
SELECT 
  id,
  email,
  raw_user_meta_data
FROM auth.users
WHERE id IN (
  '4e1cad31-0138-4e74-a060-b36644c8d5f9',
  '3a16e479-42c6-44fa-8522-3c080c4b4383'
); 