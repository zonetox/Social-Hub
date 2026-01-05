'use client'

import { ThemeConfig } from '@/types/user.types'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Palette, Type, Layout, Image as ImageIcon, Sliders } from 'lucide-react'

interface ThemeEditorProps {
    config: ThemeConfig
    onChange: (config: ThemeConfig) => void
}

const FONT_OPTIONS = [
    { label: 'Inter (Sans Serif)', value: 'Inter, sans-serif' },
    { label: 'Roboto (Modern)', value: 'Roboto, sans-serif' },
    { label: 'Playfair Display (Serif)', value: 'Playfair Display, serif' },
    { label: 'Outfit (Premium)', value: 'Outfit, sans-serif' },
    { label: 'JetBrains Mono (Tech)', value: 'JetBrains Mono, monospace' },
]

const CARD_STYLES = [
    { label: 'Glassmorphism', value: 'glass' },
    { label: 'Solid Color', value: 'solid' },
    { label: 'Outline Only', value: 'outline' },
]

const BACKGROUND_TYPES = [
    { label: 'Solid Color', value: 'solid' },
    { label: 'Gradient', value: 'gradient' },
    { label: 'Background Image', value: 'image' },
]

export function ThemeEditor({ config, onChange }: ThemeEditorProps) {
    const updateConfig = (key: keyof ThemeConfig, value: any) => {
        onChange({ ...config, [key]: value })
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Colors Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-900 border-b pb-2">
                    <Palette className="w-5 h-5 text-primary-600" />
                    <h3 className="font-bold">Màu sắc & Chủ đạo</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Màu chủ đạo (Primary)</label>
                        <div className="flex gap-3 items-center">
                            <input
                                type="color"
                                value={config.primaryColor || '#6366f1'}
                                onChange={(e) => updateConfig('primaryColor', e.target.value)}
                                className="w-12 h-12 rounded-lg cursor-pointer border-2 border-white shadow-sm"
                            />
                            <Input
                                value={config.primaryColor || '#6366f1'}
                                onChange={(e) => updateConfig('primaryColor', e.target.value)}
                                className="font-mono text-sm uppercase"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Background Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-900 border-b pb-2">
                    <ImageIcon className="w-5 h-5 text-primary-600" />
                    <h3 className="font-bold">Hình nền (Background)</h3>
                </div>
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {BACKGROUND_TYPES.map((type) => (
                            <button
                                key={type.value}
                                onClick={() => updateConfig('backgroundType', type.value)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${config.backgroundType === type.value
                                        ? 'bg-primary-600 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>

                    <Input
                        label={
                            config.backgroundType === 'image'
                                ? 'URL Hình ảnh'
                                : config.backgroundType === 'gradient'
                                    ? 'CSS Gradient (linear-gradient...)'
                                    : 'Màu nền (Hex/RGB)'
                        }
                        placeholder={
                            config.backgroundType === 'image'
                                ? 'https://images.unsplash.com/...'
                                : config.backgroundType === 'gradient'
                                    ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)'
                                    : '#f8fafc'
                        }
                        value={config.backgroundValue || ''}
                        onChange={(e) => updateConfig('backgroundValue', e.target.value)}
                    />
                </div>
            </div>

            {/* Typography Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-900 border-b pb-2">
                    <Type className="w-5 h-5 text-primary-600" />
                    <h3 className="font-bold">Font chữ</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {FONT_OPTIONS.map((font) => (
                        <button
                            key={font.value}
                            onClick={() => updateConfig('fontFamily', font.value)}
                            className={`p-3 rounded-xl text-sm transition-all border-2 text-left space-y-1 ${config.fontFamily === font.value
                                    ? 'border-primary-600 bg-primary-50'
                                    : 'border-gray-100 bg-white hover:border-gray-200'
                                }`}
                            style={{ fontFamily: font.value }}
                        >
                            <span className="block font-bold">{font.label.split(' ')[0]}</span>
                            <span className="text-xs text-gray-400">Sample Text</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Layout Section */}
            <div className="space-y-4 text-gray-900">
                <div className="flex items-center gap-2 border-b pb-2">
                    <Layout className="w-5 h-5 text-primary-600" />
                    <h3 className="font-bold">Thẻ Profile (Cards)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-sm font-medium">Kiểu thẻ</label>
                        <div className="flex flex-col gap-2">
                            {CARD_STYLES.map((style) => (
                                <button
                                    key={style.value}
                                    onClick={() => updateConfig('cardStyle', style.value)}
                                    className={`p-3 rounded-xl text-sm font-bold border-2 transition-all text-left ${config.cardStyle === style.value
                                            ? 'border-primary-600 bg-primary-50 text-primary-700'
                                            : 'border-gray-100 hover:border-gray-200'
                                        }`}
                                >
                                    {style.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Độ mờ kính (Glass Opacity)</label>
                                <span className="text-xs font-bold text-primary-600">{Math.round((config.glassOpacity || 0.6) * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0.1"
                                max="1"
                                step="0.05"
                                value={config.glassOpacity || 0.6}
                                onChange={(e) => updateConfig('glassOpacity', parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Bo góc (Border Radius)</label>
                                <span className="text-xs font-bold text-primary-600">{config.borderRadius || '1.5rem'}</span>
                            </div>
                            <select
                                value={config.borderRadius || '1.5rem'}
                                onChange={(e) => updateConfig('borderRadius', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                            >
                                <option value="0">Không bo</option>
                                <option value="0.5rem">Hơi bo (8px)</option>
                                <option value="1rem">Bo vừa (16px)</option>
                                <option value="1.5rem">Bo nhiều (24px)</option>
                                <option value="2.5rem">Bo cực mạnh (40px)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Banner */}
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-xs text-amber-700 font-medium">
                    <span className="font-bold">Lưu ý:</span> Các thay đổi sẽ được áp dụng trực tiếp cho trang cá nhân công khai của bạn sau khi nhấn Lưu.
                </p>
            </div>
        </div>
    )
}
