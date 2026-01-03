-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Enable Row Level Security
-- ALTER DATABASE postgres
-- SET "app.jwt_secret" TO 'your-jwt-secret';
-- =============================================
-- USERS TABLE (extends Supabase auth.users)
-- =============================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    cover_image_url TEXT,
    website TEXT,
    location TEXT,
    tags TEXT [],
    is_public BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    follower_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- =============================================
-- SOCIAL ACCOUNTS TABLE
-- =============================================
CREATE TABLE public.social_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    platform_username TEXT NOT NULL,
    platform_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- =============================================
-- FOLLOWS TABLE
-- =============================================
CREATE TABLE public.follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);
-- =============================================
-- ANALYTICS TABLE
-- =============================================
CREATE TABLE public.analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (
        event_type IN ('view', 'click', 'follow', 'share')
    ),
    social_account_id UUID REFERENCES public.social_accounts(id) ON DELETE
    SET NULL,
        metadata JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
);
-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_slug ON public.profiles(slug);
CREATE INDEX idx_profiles_is_public ON public.profiles(is_public);
CREATE INDEX idx_social_accounts_profile_id ON public.social_accounts(profile_id);
CREATE INDEX idx_social_accounts_platform ON public.social_accounts(platform);
CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX idx_follows_following_id ON public.follows(following_id);
CREATE INDEX idx_analytics_profile_id ON public.analytics(profile_id);
CREATE INDEX idx_analytics_event_type ON public.analytics(event_type);
CREATE INDEX idx_analytics_created_at ON public.analytics(created_at);
-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
-- Users table policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all active users" ON public.users FOR
SELECT USING (is_active = TRUE);
CREATE POLICY "Users can update own profile" ON public.users FOR
UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can do everything" ON public.users FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = auth.uid()
            AND role = 'admin'
    )
);
-- Profiles table policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR
SELECT USING (is_public = TRUE);
CREATE POLICY "Users can view own private profile" ON public.profiles FOR
SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own profile" ON public.profiles FOR
INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR
UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (user_id = auth.uid());
-- Social accounts table policies
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Social accounts visible if profile is public" ON public.social_accounts FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = profile_id
                AND (
                    is_public = TRUE
                    OR user_id = auth.uid()
                )
        )
    );
CREATE POLICY "Users can manage own social accounts" ON public.social_accounts FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = profile_id
            AND user_id = auth.uid()
    )
);
-- Follows table policies
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Follows are viewable by everyone" ON public.follows FOR
SELECT USING (TRUE);
CREATE POLICY "Users can follow others" ON public.follows FOR
INSERT WITH CHECK (follower_id = auth.uid());
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (follower_id = auth.uid());
-- Analytics table policies
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profile owners can view own analytics" ON public.analytics FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = profile_id
                AND user_id = auth.uid()
        )
    );
CREATE POLICY "Anyone can insert analytics" ON public.analytics FOR
INSERT WITH CHECK (TRUE);
CREATE POLICY "Admins can view all analytics" ON public.analytics FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.users
            WHERE id = auth.uid()
                AND role = 'admin'
        )
    );
-- =============================================
-- FUNCTIONS
-- =============================================
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE
UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE
UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_accounts_updated_at BEFORE
UPDATE ON public.social_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Function to update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts() RETURNS TRIGGER AS $$ BEGIN IF TG_OP = 'INSERT' THEN -- Increase following count for follower
UPDATE public.profiles
SET following_count = following_count + 1
WHERE user_id = NEW.follower_id;
-- Increase follower count for following
UPDATE public.profiles
SET follower_count = follower_count + 1
WHERE user_id = NEW.following_id;
ELSIF TG_OP = 'DELETE' THEN -- Decrease following count for follower
UPDATE public.profiles
SET following_count = following_count - 1
WHERE user_id = OLD.follower_id;
-- Decrease follower count for following
UPDATE public.profiles
SET follower_count = follower_count - 1
WHERE user_id = OLD.following_id;
END IF;
RETURN NULL;
END;
$$ LANGUAGE plpgsql;
-- Trigger for follower counts
CREATE TRIGGER update_follower_counts_trigger
AFTER
INSERT
    OR DELETE ON public.follows FOR EACH ROW EXECUTE FUNCTION update_follower_counts();
-- Function to create profile after user creation
CREATE OR REPLACE FUNCTION create_profile_for_new_user() RETURNS TRIGGER AS $$
DECLARE username_slug TEXT;
BEGIN -- Generate slug from username
username_slug := LOWER(
    REGEXP_REPLACE(NEW.username, '[^a-zA-Z0-9]', '-', 'g')
);
INSERT INTO public.profiles (user_id, display_name, slug)
VALUES (NEW.id, NEW.full_name, username_slug);
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Trigger to auto-create profile
CREATE TRIGGER create_profile_on_user_creation
AFTER
INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION create_profile_for_new_user();
-- =============================================
-- STORAGE BUCKETS
-- =============================================
-- Create storage buckets (run these in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true);
-- Storage policies
-- CREATE POLICY "Avatar images are publicly accessible"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'avatars');
-- CREATE POLICY "Users can upload own avatar"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can update own avatar"
--   ON storage.objects FOR UPDATE
--   USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);