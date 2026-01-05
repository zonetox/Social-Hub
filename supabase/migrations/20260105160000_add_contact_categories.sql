-- =============================================
-- CONTACT CATEGORIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.contact_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);
-- Add category_id to contacts table
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.contact_categories(id) ON DELETE
SET NULL;
-- Enable RLS
ALTER TABLE public.contact_categories ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Users can manage their own categories" ON public.contact_categories FOR ALL USING (auth.uid() = user_id);
-- Indexes
CREATE INDEX IF NOT EXISTS idx_contact_categories_user_id ON public.contact_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_category_id ON public.contacts(category_id);
-- Comment
COMMENT ON TABLE public.contact_categories IS 'Phân loại danh bạ của người dùng';