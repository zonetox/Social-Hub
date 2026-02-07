-- =========================================================
-- CHECK RLS POLICIES ON CRITICAL TABLES
-- =========================================================
-- Check RLS status
SELECT schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN (
        'users',
        'profiles',
        'user_subscriptions',
        'card_credits'
    )
    AND schemaname = 'public';
-- Check policies on users table
SELECT schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users'
    AND schemaname = 'public';
-- Check policies on profiles table
SELECT schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles'
    AND schemaname = 'public';
-- Check policies on user_subscriptions table
SELECT schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_subscriptions'
    AND schemaname = 'public';
-- Check policies on card_credits table
SELECT schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'card_credits'
    AND schemaname = 'public';