/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
      'ljesrsxpoilowocubnlz.supabase.co',
      // Add your supabase project domain here, e.g.:
      // 'xmkhhjsakhjksahDSA.supabase.co',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  // experimental: {
  //   serverActions: true,
  // },
}

module.exports = nextConfig
