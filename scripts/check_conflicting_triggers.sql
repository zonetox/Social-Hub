-- CHECK FOR CONFLICTING TRIGGERS
SELECT trigger_schema,
    trigger_name,
    event_manipulation,
    action_statement,
    action_orientation,
    action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
    AND event_object_table = 'users';