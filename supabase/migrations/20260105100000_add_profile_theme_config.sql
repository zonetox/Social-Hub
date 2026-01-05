-- Add theme_config column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS theme_config JSONB DEFAULT NULL;
-- Example of configuration structure (for reference):
/*
 {
 "primaryColor": "#6366f1",
 "backgroundType": "gradient",
 "backgroundValue": "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
 "fontFamily": "Inter, sans-serif",
 "borderRadius": "1.5rem",
 "glassOpacity": 0.6,
 "cardStyle": "glass"
 }
 */
-- Add comment explaining the column
COMMENT ON COLUMN public.profiles.theme_config IS 'Custom theme configuration for Premium users';