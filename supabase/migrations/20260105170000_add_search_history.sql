-- =============================================
-- SEARCH HISTORY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Users can manage their own search history" ON public.search_history FOR ALL USING (auth.uid() = user_id);
-- Indexes
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON public.search_history(created_at DESC);
-- Comment
COMMENT ON TABLE public.search_history IS 'Lưu trữ lịch sử tìm kiếm của người dùng để cá nhân hóa gợi ý AI';