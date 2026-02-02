-- Enable pg_net for HTTP requests if not enabled
CREATE EXTENSION IF NOT EXISTS pg_net;
-- Function to handle new service request notification
CREATE OR REPLACE FUNCTION public.handle_new_request_notification() RETURNS trigger AS $$
DECLARE project_url text := 'https://YOUR_PROJECT_REF.supabase.co';
-- Replace with your project URL or setup env
function_name text := 'notify_new_request';
payload jsonb;
BEGIN -- Construct payload with the new record
payload := jsonb_build_object('record', row_to_json(NEW));
-- Perform HTTP Request to Edge Function
-- Note: In production, use your actual Edge Function URL.
-- This assumes you have deployed the function 'notify_new_request'
-- and net extension is responding.
-- Method 1: using pg_net (async)
PERFORM net.http_post(
    url := project_url || '/functions/v1/' || function_name,
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    -- Authorization usually needed
    body := payload
);
-- Method 2: If using Database Webhooks via Dashboard (Recommended for simplicity)
-- You don't need this SQL trigger if you setup a Webhook in the Dashboard UI:
-- Table: service_requests, Event: INSERT, Type: HTTP Request, URL: .../notify_new_request
-- Since we are defining this via Code, we use pg_net.
-- WARNING: You must replace YOUR_PROJECT_REF and YOUR_SERVICE_ROLE_KEY 
-- OR configure this via Supabase Secrets/Vault if possible.
-- For now, we return, assuming the user might configure Webhook visually or update this.
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger definition
DROP TRIGGER IF EXISTS on_new_service_request ON public.service_requests;
CREATE TRIGGER on_new_service_request
AFTER
INSERT ON public.service_requests FOR EACH ROW
    WHEN (NEW.status = 'open') EXECUTE FUNCTION public.handle_new_request_notification();