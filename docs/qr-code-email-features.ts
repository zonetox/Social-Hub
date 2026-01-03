// ============================================
// PART 1: QR CODE GENERATION
// ============================================

// ============================================
// Install QR Code library first:
// npm install qrcode @types/qrcode
// ============================================

// ============================================
// src/lib/utils/qr-code.ts
// ============================================

import QRCode from 'qrcode'

export async function generateQRCode(url: string): Promise<string> {
  try {
    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(url, {
      width: 800,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    })
    return qrCodeDataURL
  } catch (error) {
    console.error('QR Code generation error:', error)
    throw error
  }
}

export async function generateQRCodeWithLogo(
  url: string, 
  logoUrl?: string
): Promise<string> {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Cannot get canvas context')

    // Generate base QR code
    const qrCanvas = document.createElement('canvas')
    await QRCode.toCanvas(qrCanvas, url, {
      width: 800,
      margin: 2,
      errorCorrectionLevel: 'H'
    })

    // Set canvas size
    canvas.width = 800
    canvas.height = 800

    // Draw QR code
    ctx.drawImage(qrCanvas, 0, 0)

    // Add logo if provided
    if (logoUrl) {
      const logo = new Image()
      logo.crossOrigin = 'anonymous'
      await new Promise((resolve, reject) => {
        logo.onload = resolve
        logo.onerror = reject
        logo.src = logoUrl
      })

      // Draw white background for logo
      const logoSize = 120
      const logoPos = (800 - logoSize) / 2
      ctx.fillStyle = 'white'
      ctx.fillRect(logoPos - 10, logoPos - 10, logoSize + 20, logoSize + 20)

      // Draw logo
      ctx.drawImage(logo, logoPos, logoPos, logoSize, logoSize)
    }

    return canvas.toDataURL('image/png')
  } catch (error) {
    console.error('QR Code with logo generation error:', error)
    // Fallback to simple QR code
    return generateQRCode(url)
  }
}

// ============================================
// src/components/profile/QRCodeModal.tsx
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { generateQRCode } from '@/lib/utils/qr-code'
import { Download, Share2, Copy, Check } from 'lucide-react'

interface QRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  profileUrl: string
  profileName: string
}

export function QRCodeModal({ isOpen, onClose, profileUrl, profileName }: QRCodeModalProps) {
  const [qrCode, setQrCode] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen) {
      generateQR()
    }
  }, [isOpen, profileUrl])

  const generateQR = async () => {
    setLoading(true)
    try {
      const qr = await generateQRCode(profileUrl)
      setQrCode(qr)
    } catch (error) {
      console.error('QR generation error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.download = `${profileName}-qr-code.png`
    link.href = qrCode
    link.click()
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Copy error:', error)
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profileName}'s Profile`,
          text: `Check out my profile on Social Hub!`,
          url: profileUrl,
        })
      } else {
        handleCopyLink()
      }
    } catch (error) {
      console.error('Share error:', error)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="QR Code" size="md">
      <div className="text-center">
        {loading ? (
          <div className="py-20">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600 mt-4">Generating QR Code...</p>
          </div>
        ) : (
          <>
            {/* QR Code Display */}
            <div className="bg-white p-8 rounded-xl border-2 border-gray-200 mb-6 inline-block">
              <img 
                src={qrCode} 
                alt="QR Code" 
                className="w-64 h-64 mx-auto"
              />
            </div>

            {/* Profile Info */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {profileName}
              </h3>
              <p className="text-sm text-gray-600 break-all">
                {profileUrl}
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <h4 className="font-semibold text-blue-900 mb-2 text-sm">
                📱 How to use:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Scan with any QR code scanner</li>
                <li>• Share on social media</li>
                <li>• Print on business cards</li>
                <li>• Add to email signatures</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex-col h-auto py-3"
              >
                <Download className="w-5 h-5 mb-1" />
                <span className="text-xs">Download</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex-col h-auto py-3"
              >
                <Share2 className="w-5 h-5 mb-1" />
                <span className="text-xs">Share</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="flex-col h-auto py-3"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5 mb-1 text-green-600" />
                    <span className="text-xs text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 mb-1" />
                    <span className="text-xs">Copy Link</span>
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

// ============================================
// Add QR button to ProfileHeader.tsx
// Update the existing ProfileHeader component
// ============================================

/*
// Add this import at the top
import { QRCodeModal } from './QRCodeModal'
import { QrCode } from 'lucide-react'

// Add state
const [showQRModal, setShowQRModal] = useState(false)

// Add button next to Share button
<Button
  size="sm"
  variant="outline"
  onClick={() => setShowQRModal(true)}
>
  <QrCode className="w-4 h-4" />
  QR Code
</Button>

// Add modal at the end of component
<QRCodeModal
  isOpen={showQRModal}
  onClose={() => setShowQRModal(false)}
  profileUrl={`${window.location.origin}/${profile.slug}`}
  profileName={profile.display_name}
/>
*/

// ============================================
// PART 2: EMAIL NOTIFICATIONS
// ============================================

// ============================================
// Setup Supabase Email Templates
// Go to: Authentication → Email Templates
// ============================================

// ============================================
// src/lib/email/templates.ts
// ============================================

export const emailTemplates = {
  welcome: (userName: string, profileUrl: string) => ({
    subject: '🎉 Welcome to Social Hub!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Social Hub</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #0ea5e9 0%, #d946ef 100%); border-radius: 16px 16px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">Welcome to Social Hub! 🎉</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">Hi ${userName}! 👋</h2>
                    
                    <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Thank you for joining Social Hub! We're excited to have you as part of our community.
                    </p>
                    
                    <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Your profile is now live and ready to share with the world. Here's what you can do next:
                    </p>
                    
                    <!-- Features List -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                      <tr>
                        <td style="padding: 15px; background-color: #f9fafb; border-radius: 8px; margin-bottom: 10px;">
                          <strong style="color: #0ea5e9; font-size: 18px;">📱</strong>
                          <strong style="color: #111827; font-size: 16px; margin-left: 10px;">Add Your Social Accounts</strong>
                          <p style="margin: 5px 0 0 35px; color: #6b7280; font-size: 14px;">Connect all your social media profiles in one place</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 15px; background-color: #f9fafb; border-radius: 8px; margin-bottom: 10px;">
                          <strong style="color: #d946ef; font-size: 18px;">✨</strong>
                          <strong style="color: #111827; font-size: 16px; margin-left: 10px;">Customize Your Profile</strong>
                          <p style="margin: 5px 0 0 35px; color: #6b7280; font-size: 14px;">Make it yours with photos, bio, and tags</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 15px; background-color: #f9fafb; border-radius: 8px;">
                          <strong style="color: #10b981; font-size: 18px;">🚀</strong>
                          <strong style="color: #111827; font-size: 16px; margin-left: 10px;">Share Your Link</strong>
                          <p style="margin: 5px 0 0 35px; color: #6b7280; font-size: 14px;">Start sharing your unique profile URL</p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${profileUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #0ea5e9 0%, #d946ef 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px;">
                            View My Profile →
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      Need help? Reply to this email or check out our <a href="https://socialhub.com/help" style="color: #0ea5e9;">Help Center</a>.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; background-color: #f9fafb; border-radius: 0 0 16px 16px; text-align: center;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                      <strong>Social Hub</strong> - One Link For All Your Socials
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      © 2024 Social Hub. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `
      Welcome to Social Hub!
      
      Hi ${userName}!
      
      Thank you for joining Social Hub! We're excited to have you as part of our community.
      
      Your profile is now live at: ${profileUrl}
      
      What's next?
      - Add your social accounts
      - Customize your profile
      - Share your link
      
      Need help? Visit our Help Center or reply to this email.
      
      Best regards,
      The Social Hub Team
    `
  }),

  newFollower: (followerName: string, followerUsername: string, followerUrl: string, profileUrl: string) => ({
    subject: `🎉 ${followerName} started following you!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <tr>
                  <td style="padding: 40px; text-align: center;">
                    <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: linear-gradient(135deg, #0ea5e9 0%, #d946ef 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px;">
                      ❤️
                    </div>
                    
                    <h1 style="margin: 0 0 10px 0; color: #111827; font-size: 28px; font-weight: bold;">New Follower!</h1>
                    
                    <p style="margin: 0 0 30px 0; color: #6b7280; font-size: 16px;">
                      <strong style="color: #0ea5e9;">${followerName}</strong> (@${followerUsername}) started following you
                    </p>
                    
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${followerUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #0ea5e9 0%, #d946ef 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; margin-right: 10px;">
                            View Their Profile
                          </a>
                          <a href="${profileUrl}" style="display: inline-block; padding: 14px 28px; background: #ffffff; color: #0ea5e9; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; border: 2px solid #0ea5e9;">
                            My Profile
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px;">
                      <a href="{{unsubscribe_url}}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe from follower notifications</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `
      New Follower!
      
      ${followerName} (@${followerUsername}) started following you.
      
      View their profile: ${followerUrl}
      View your profile: ${profileUrl}
      
      Social Hub
    `
  }),

  weeklyDigest: (userName: string, stats: any, profileUrl: string) => ({
    subject: `📊 Your Weekly Social Hub Report`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px;">
                <tr>
                  <td style="padding: 40px;">
                    <h1 style="margin: 0 0 10px 0; color: #111827; font-size: 28px;">Hi ${userName}! 👋</h1>
                    <p style="margin: 0 0 30px 0; color: #6b7280; font-size: 16px;">Here's your weekly activity summary:</p>
                    
                    <!-- Stats Grid -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                      <tr>
                        <td width="50%" style="padding: 20px; background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%); border-radius: 12px; text-align: center;">
                          <p style="margin: 0 0 5px 0; color: #1e40af; font-size: 32px; font-weight: bold;">${stats.views || 0}</p>
                          <p style="margin: 0; color: #6b7280; font-size: 14px;">Profile Views</p>
                        </td>
                        <td width="10"></td>
                        <td width="50%" style="padding: 20px; background: linear-gradient(135deg, #fce7f3 0%, #fae8ff 100%); border-radius: 12px; text-align: center;">
                          <p style="margin: 0 0 5px 0; color: #a21caf; font-size: 32px; font-weight: bold;">${stats.clicks || 0}</p>
                          <p style="margin: 0; color: #6b7280; font-size: 14px;">Link Clicks</p>
                        </td>
                      </tr>
                      <tr><td colspan="3" height="10"></td></tr>
                      <tr>
                        <td width="50%" style="padding: 20px; background: linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%); border-radius: 12px; text-align: center;">
                          <p style="margin: 0 0 5px 0; color: #15803d; font-size: 32px; font-weight: bold;">${stats.followers || 0}</p>
                          <p style="margin: 0; color: #6b7280; font-size: 14px;">New Followers</p>
                        </td>
                        <td width="10"></td>
                        <td width="50%" style="padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; text-align: center;">
                          <p style="margin: 0 0 5px 0; color: #a16207; font-size: 32px; font-weight: bold;">${stats.shares || 0}</p>
                          <p style="margin: 0; color: #6b7280; font-size: 14px;">Profile Shares</p>
                        </td>
                      </tr>
                    </table>
                    
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${profileUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #0ea5e9 0%, #d946ef 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600;">
                            View Full Analytics
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  })
}

// ============================================
// src/lib/email/send.ts
// ============================================

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
) {
  // Using Supabase Edge Function for email
  // You'll need to create this function in Supabase
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        subject,
        html,
        text
      }
    })

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error }
  }
}

// ============================================
// src/app/api/webhooks/user-created/route.ts
// ============================================

import { createServerClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/send'
import { emailTemplates } from '@/lib/email/templates'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { user } = body

    if (!user) {
      return NextResponse.json({ error: 'No user data' }, { status: 400 })
    }

    // Get user profile
    const supabase = createServerClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('slug, display_name')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Send welcome email
    const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${profile.slug}`
    const template = emailTemplates.welcome(profile.display_name, profileUrl)

    await sendEmail(
      user.email,
      template.subject,
      template.html,
      template.text
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// ============================================
// Add to follows table trigger
// Run this in Supabase SQL Editor
// ============================================

/*
CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER AS $$
DECLARE
  follower_data RECORD;
  following_data RECORD;
BEGIN
  -- Get follower info
  SELECT u.username, u.full_name, u.email, p.slug
  INTO follower_data
  FROM users u
  JOIN profiles p ON p.user_id = u.id
  WHERE u.id = NEW.follower_id;

  -- Get following user info
  SELECT u.email, p.display_name, p.slug
  INTO following_data
  FROM users u
  JOIN profiles p ON p.user_id = u.id
  WHERE u.id = NEW.following_id;

  -- Call Edge Function to send email
  PERFORM
    net.http_post(
      url:=current_setting('app.api_url') || '/api/webhooks/new-follower',
      headers:='{"Content-Type": "application/json"}'::jsonb,
      body:=jsonb_build_object(
        'follower', jsonb_build_object(
          'name', follower_data.full_name,
          'username', follower_data.username,
          'slug', follower_data.slug
        ),
        'following', jsonb_build_object(
          'email', following_data.email,
          'name', following_data.display_name,
          'slug', following_data.slug
        )
      )
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER on_new_follower
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_follower();
*/

// ============================================
// package.json - Add QR code dependency
// ============================================

/*
{
  "dependencies": {
    ...existing dependencies,
    "qrcode": "^1.5.3"
  },
  "devDependencies": {
    ...existing dev dependencies,
    "@types/qrcode": "^1.5.5"
  }
}
*/