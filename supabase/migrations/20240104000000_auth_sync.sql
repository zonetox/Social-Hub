-- migration_auth_sync.sql
-- Tự động tạo bản ghi trong public.users khi có user mới trong auth.users
-- 1. Hàm xử lý tạo user tự động
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.users (id, email, username, full_name)
VALUES (
        NEW.id,
        NEW.email,
        -- Mặc định lấy phần trước @ của email làm username nếu không có metadata
        COALESCE(
            NEW.raw_user_meta_data->>'username',
            SPLIT_PART(NEW.email, '@', 1)
        ),
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            SPLIT_PART(NEW.email, '@', 1)
        )
    );
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 2. Trigger kích hoạt hàm trên
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- LƯU Ý: Hiện tại schema đã có trigger 'create_profile_on_user_creation' 
-- kích hoạt khi insert vào public.users, nên profiles sẽ được tạo tự động 
-- theo dây chuyền: auth.users -> public.users -> public.profiles