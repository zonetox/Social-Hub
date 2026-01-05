
'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import {
    Upload,
    FileText,
    CheckCircle,
    XCircle,
    AlertCircle,
    ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

export default function BulkImportPage() {
    const [csvData, setCsvData] = useState('')
    const [defaultPassword, setDefaultPassword] = useState('SocialHub123!')
    const [isImporting, setIsImporting] = useState(false)
    const [results, setResults] = useState<any[] | null>(null)

    const handleImport = async () => {
        if (!csvData.trim()) return alert('Vui lòng nhập dữ liệu CSV')

        // Basic CSV Parsing (Email, Name, Username)
        const rows = csvData.split('\n').filter(row => row.trim())
        const users = rows.map(row => {
            const [email, full_name, username, bio] = row.split(',').map(s => s.trim())
            return { email, full_name, username, bio }
        })

        if (users.some(u => !u.email || !u.username || !u.full_name)) {
            return alert('Định dạng CSV không hợp lệ. Vui lòng sử dụng định dạng: Email, Tên đầy đủ, Username, Bio (tùy chọn)')
        }

        setIsImporting(true)
        setResults(null)

        try {
            const response = await fetch('/api/admin/bulk-import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ users, defaultPassword })
            })

            const data = await response.json()
            setResults(data.results)
        } catch (error) {
            console.error('Import error:', error)
            alert('Đã xảy ra lỗi trong quá trình nhập dữ liệu')
        } finally {
            setIsImporting(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/users"
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Nhập dữ liệu Profile hàng loạt</h1>
                    <p className="text-gray-500">Tạo hàng loạt tài khoản người dùng và profile từ danh sách CSV</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Input Section */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText className="w-5 h-5 text-primary-600" />
                            <h2 className="font-bold text-gray-900">Dữ liệu CSV</h2>
                        </div>
                        <p className="text-xs text-gray-500 mb-4">
                            Định dạng: <code className="bg-gray-100 px-1 rounded text-primary-600">email, full_name, username, bio</code> (mỗi người 1 dòng)
                        </p>
                        <textarea
                            className="w-full h-80 p-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                            placeholder="an@example.com, Nguyễn Văn An, an_designer, Chuyên gia thiết kế nội thất..."
                            value={csvData}
                            onChange={(e) => setCsvData(e.target.value)}
                        />
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertCircle className="w-5 h-5 text-secondary-600" />
                            <h2 className="font-bold text-gray-900">Cài đặt mặc định</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mặc định</label>
                                <Input
                                    value={defaultPassword}
                                    onChange={(e) => setDefaultPassword(e.target.value)}
                                    type="text"
                                />
                                <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">Mật khẩu này sẽ dùng để đăng nhập cho tất cả tài khoản mới</p>
                            </div>
                        </div>
                    </Card>

                    <Button
                        onClick={handleImport}
                        disabled={isImporting || !csvData.trim()}
                        className="w-full py-4 text-lg"
                    >
                        {isImporting ? (
                            <><LoadingSpinner size="sm" /> Đang nhập dữ liệu...</>
                        ) : (
                            <><Upload className="mr-2 w-5 h-5" /> Bắt đầu tạo Profiles</>
                        )}
                    </Button>
                </div>

                {/* Instructions & Results */}
                <div className="space-y-6">
                    <Card className="p-6 bg-primary-50 border-primary-100">
                        <h3 className="font-bold text-primary-900 mb-4">Hướng dẫn nhanh</h3>
                        <ul className="space-y-3">
                            {[
                                "Chuẩn bị danh sách theo định dạng CSV.",
                                "Mỗi người dùng chiếm một dòng.",
                                "Hệ thống sẽ tự động tạo tài khoản Auth và Profile.",
                                "Tài khoản sẽ được kích hoạt sẵn (Active)."
                            ].map((step, i) => (
                                <li key={i} className="flex gap-2 text-sm text-primary-700">
                                    <span className="shrink-0 w-5 h-5 rounded-full bg-primary-200 text-primary-700 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                                    {step}
                                </li>
                            ))}
                        </ul>
                    </Card>

                    {results && (
                        <Card className="p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Kết quả nhập</h3>
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                                {results.map((res, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 text-xs border border-gray-100">
                                        <span className="truncate max-w-[120px] font-medium">{res.email}</span>
                                        {res.status === 'success' ? (
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <div className="flex items-center gap-1 group relative">
                                                <XCircle className="w-4 h-4 text-red-500" />
                                                <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-48 p-2 bg-gray-900 text-white rounded shadow-xl z-30">
                                                    {res.message}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
