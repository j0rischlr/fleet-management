-- Script pour créer ou promouvoir un utilisateur en administrateur
-- 
-- UTILISATION :
-- 1. Remplacez 'email@example.com' par l'email de l'utilisateur
-- 2. Exécutez ce script dans l'éditeur SQL de Supabase

-- Promouvoir un utilisateur existant en admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'email@example.com';

-- Vérifier que le changement a été effectué
SELECT id, email, full_name, role, created_at 
FROM profiles 
WHERE email = 'email@example.com';

-- Pour voir tous les administrateurs
-- SELECT id, email, full_name, role, created_at 
-- FROM profiles 
-- WHERE role = 'admin';
