'use client'

import { QRCodeSVG } from 'qrcode.react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Download, Share2, Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface QRCodeModalProps {
    isOpen: boolean
    onClose: () => void
    url: string
    display_name: string
}

export function QRCodeModal({ isOpen, onClose, url, display_name }: QRCodeModalProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const downloadQR = () => {
        const svg = document.querySelector('#profile-qr svg')
        if (!svg) return

        const svgData = new XMLSerializer().serializeToString(svg)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()

        img.onload = () => {
            canvas.width = img.width
            canvas.height = img.height
            ctx?.drawImage(img, 0, 0)
            const pngFile = canvas.toDataURL('image/png')
            const downloadLink = document.createElement('a')
            downloadLink.download = `${display_name}-social-hub-qr.png`
            downloadLink.href = pngFile
            downloadLink.click()
        }

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Digital Business Card">
            <div className="flex flex-col items-center p-6 bg-white rounded-3xl overflow-hidden relative">
                {/* Artistic background blur */}
                <div className="absolute -top-20 -right-20 w-40 h-40 premium-gradient blur-[80px] opacity-30" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary-400 blur-[80px] opacity-30" />

                <div className="relative mb-8 p-6 bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 animate-float" id="profile-qr">
                    <QRCodeSVG
                        value={url}
                        size={200}
                        level="H"
                        includeMargin={false}
                        fgColor="#111827"
                    />
                </div>

                <div className="text-center mb-8 relative z-10 font-bold">
                    <h3 className="text-xl text-gray-900 mb-1">{display_name}</h3>
                    <p className="text-sm text-primary-600 truncate max-w-[250px]">
                        {url.replace(/^https?:\/\//, '')}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full relative z-10">
                    <Button
                        onClick={handleCopy}
                        variant="outline"
                        className="rounded-2xl h-12 flex items-center justify-center gap-2 font-bold"
                    >
                        {copied ? (
                            <Check className="w-4 h-4 text-green-600" />
                        ) : (
                            <Copy className="w-4 h-4" />
                        )}
                        {copied ? 'Copied!' : 'Copy Link'}
                    </Button>
                    <Button
                        onClick={downloadQR}
                        className="premium-gradient border-none rounded-2xl h-12 flex items-center justify-center gap-2 text-white font-bold shadow-lg"
                    >
                        <Download className="w-4 h-4" />
                        Save QR
                    </Button>
                </div>

                <p className="mt-6 text-[10px] text-gray-400 font-medium uppercase tracking-[0.2em]">
                    Powered by Social Hub Premium
                </p>
            </div>
        </Modal>
    )
}
