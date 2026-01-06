-- Migration : Ajouter les politiques UPDATE/INSERT/DELETE pour authorized_users
-- Date : 2026-01-06
-- Description : Permet aux utilisateurs autorisés de gérer la whitelist

-- Politique UPDATE : Les utilisateurs autorisés peuvent modifier tous les enregistrements
CREATE POLICY "Authorized users can update all"
ON public.authorized_users
FOR UPDATE
TO authenticated
USING (is_authorized_user())
WITH CHECK (is_authorized_user());

-- Politique INSERT : Permet l'auto-enregistrement lors de la première connexion
CREATE POLICY "Users can insert themselves"
ON public.authorized_users
FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() ->> 'email'::text) = email);

-- Politique DELETE : Les utilisateurs autorisés peuvent supprimer tous les enregistrements
CREATE POLICY "Authorized users can delete all"
ON public.authorized_users
FOR DELETE
TO authenticated
USING (is_authorized_user());

-- Vérification des politiques
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'authorized_users'
ORDER BY cmd, policyname;
