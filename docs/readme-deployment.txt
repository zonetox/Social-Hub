# 🌐 Social Hub - Complete Full-Stack Application

A professional social media hub platform where users can consolidate all their social profiles in one place. Built with Next.js 14, TypeScript, Supabase, and deployed on Vercel.

## ✨ Features

### 🔐 **Authentication & Authorization**
- Email/Password authentication with Supabase Auth
- Role-based access control (User/Admin)
- Protected routes with middleware
- Secure session management

### 👤 **User Profiles**
- Customizable profile pages with cover images and avatars
- Bio, location, website, and tags
- Public/private profile visibility
- Profile verification badges
- Shareable profile links (`/username`)

### 🔗 **Social Account Management**
- Support for 15+ social platforms
- Add, edit, delete, and reorder accounts
- Show/hide individual accounts
- Click tracking for each account
- Drag-and-drop reordering

### 🤝 **Social Features**
- Follow/unfollow system
- Follower/following counts
- Profile view tracking
- One-click follow all accounts

### 📊 **Analytics & Admin Panel**
- Real-time platform statistics
- User management dashboard
- Profile view analytics
- Click tracking per social account
- Admin-only access controls

### 🎨 **Modern UI/UX**
- Clean, professional design
- Fully responsive (mobile, tablet, desktop)
- Smooth animations and transitions
- Dark mode ready
- Accessible components

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Backend:** Next.js API Routes, Supabase
- **Database:** PostgreSQL (Supabase)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **Styling:** Tailwind CSS
- **Deployment:** Vercel
- **Validation:** Zod
- **Icons:** Lucide React

## 📋 Prerequisites

- Node.js 18+ and npm
- Git
- Supabase account
- Vercel account (for deployment)

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/social-hub.git
cd social-hub
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Supabase

#### A. Create a New Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details and create

#### B. Run Database Migrations
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy the entire content from `supabase/migrations/20240101000000_initial_schema.sql`
4. Paste and run the SQL

#### C. Create Storage Buckets
1. Go to **Storage** in Supabase dashboard
2. Create two public buckets:
   - `avatars`
   - `covers`
3. Set both buckets to **Public**

#### D. Configure Storage Policies
Run these SQL commands in SQL Editor:

```sql
-- Avatar bucket policies
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Cover bucket policies (same structure)
CREATE POLICY "Cover images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'covers');

CREATE POLICY "Users can upload own cover"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'covers' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own cover"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'covers' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 4. Configure Environment Variables

Create `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Social Hub

# Admin
ADMIN_EMAIL=admin@yourdomain.com
```

**Where to find Supabase keys:**
- Go to Project Settings → API
- `NEXT_PUBLIC_SUPABASE_URL`: Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon/public key
- `SUPABASE_SERVICE_ROLE_KEY`: service_role key (keep secret!)

### 5. Create Admin User

#### A. Sign up in Supabase Auth
1. Go to **Authentication** → **Users** in Supabase dashboard
2. Click "Add user" → "Create new user"
3. Enter admin email and password
4. Copy the UUID of the created user

#### B. Update User Role
Run this SQL in SQL Editor (replace UUID):

```sql
UPDATE public.users 
SET role = 'admin', is_verified = true
WHERE id = 'paste-user-uuid-here';
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 7. Test the Application

1. **Register a new user:** Go to `/register`
2. **Login:** Use your credentials at `/login`
3. **Complete your profile:** Add bio, social accounts
4. **Test Hub:** Browse profiles at `/hub`
5. **Admin access:** Login with admin account, visit `/admin`

## 📦 Deployment to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

### 3. Set Environment Variables

In Vercel dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add all variables from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (use your Vercel URL)
   - `NEXT_PUBLIC_APP_NAME`
   - `ADMIN_EMAIL`

### 4. Update Supabase Redirect URLs

1. Go to Supabase **Authentication** → **URL Configuration**
2. Add your Vercel URLs to **Redirect URLs:**
   - `https://your-app.vercel.app/**`
   - `https://your-app.vercel.app/auth/callback`

### 5. Deploy

Click **Deploy** in Vercel. Your app will be live in ~2 minutes!

## 📁 Project Structure

```
social-hub/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth pages (login, register)
│   │   ├── (dashboard)/       # Protected pages (hub, profile, admin)
│   │   ├── [username]/        # Public profile pages
│   │   ├── api/               # API routes
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── auth/             # Authentication components
│   │   ├── dashboard/        # Dashboard components
│   │   ├── profile/          # Profile components
│   │   ├── admin/            # Admin components
│   │   ├── ui/               # Reusable UI components
│   │   └── shared/           # Shared components
│   ├── lib/                   # Utilities and helpers
│   │   ├── supabase/         # Supabase clients
│   │   ├── hooks/            # Custom React hooks
│   │   └── utils/            # Helper functions
│   └── types/                 # TypeScript types
├── supabase/
│   ├── migrations/           # Database migrations
│   └── seed.sql              # Seed data
└── public/                    # Static assets
```

## 🔒 Security Best Practices

### Environment Variables
- ✅ Never commit `.env.local` to Git
- ✅ Use different keys for development and production
- ✅ Keep `service_role_key` secret (server-side only)

### Database Security
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Policies restrict data access by user
- ✅ Admin actions require `role = 'admin'`

### Authentication
- ✅ Passwords hashed by Supabase Auth
- ✅ JWT tokens for session management
- ✅ Protected routes with middleware

## 🎨 Customization

### Change Brand Colors

Edit `tailwind.config.ts`:

```typescript
colors: {
  primary: {
    // Your primary color shades
    500: '#YOUR_COLOR',
    600: '#YOUR_COLOR',
  },
  secondary: {
    // Your secondary color shades
  }
}
```

### Add More Social Platforms

Edit `src/lib/utils/constants.ts`:

```typescript
export const SOCIAL_PLATFORMS = [
  // Add new platform
  { 
    name: 'NewPlatform',
    icon: 'icon-name',
    color: '#HEX_COLOR',
    urlPattern: 'https://platform.com/'
  },
  // ... existing platforms
]
```

### Modify Email Templates

1. Go to Supabase **Authentication** → **Email Templates**
2. Customize:
   - Confirm signup
   - Invite user
   - Magic link
   - Password reset

## 📊 Database Schema Overview

### Main Tables:
- **users** - User accounts (extends auth.users)
- **profiles** - Public profile information
- **social_accounts** - Linked social media accounts
- **follows** - Follow relationships
- **analytics** - Event tracking

### Key Features:
- Auto-updating `updated_at` timestamps
- Auto-creating profile on user signup
- Auto-updating follower counts
- Comprehensive indexes for performance

## 🧪 Testing

### Manual Testing Checklist:
- [ ] User registration
- [ ] User login/logout
- [ ] Profile creation and editing
- [ ] Social account CRUD operations
- [ ] Follow/unfollow functionality
- [ ] Search and filtering
- [ ] Admin panel access
- [ ] Mobile responsiveness

## 🐛 Troubleshooting

### Issue: "Failed to fetch" errors
**Solution:** Check if Supabase URL and keys are correct in `.env.local`

### Issue: RLS policy violations
**Solution:** Ensure RLS policies are created from the migration SQL

### Issue: Images not loading
**Solution:** 
1. Check if storage buckets exist
2. Verify bucket policies are set
3. Ensure images are in correct bucket

### Issue: Admin panel not accessible
**Solution:** Verify user role is set to 'admin' in database

## 📝 API Documentation

### User Endpoints
```
GET  /api/users - Get all users (admin only)
GET  /api/users/[id] - Get user by ID
PUT  /api/users/[id] - Update user
```

### Profile Endpoints
```
GET  /api/profiles - Get all public profiles
GET  /api/profiles/[slug] - Get profile by slug
PUT  /api/profiles/[id] - Update profile
```

### Social Account Endpoints
```
GET    /api/social-accounts - Get accounts by profile
POST   /api/social-accounts - Create account
PUT    /api/social-accounts/[id] - Update account
DELETE /api/social-accounts/[id] - Delete account
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Supabase for the backend infrastructure
- Vercel for hosting
- Tailwind CSS for styling utilities

## 📧 Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/yourusername/social-hub/issues)
- Email: support@yourdomain.com

---

**Built with ❤️ using Next.js, TypeScript, and Supabase**