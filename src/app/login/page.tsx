'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { login } from '@/app/actions/auth'

export default function LoginPage() {
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const result = await login(password)
            if (result.success) {
                router.push('/')
                router.refresh()
            } else {
                setError(result.error || '密碼錯誤')
            }
        } catch (err) {
            setError('發生錯誤，請稍後再試。')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans" style={{background:'#0B1220'}}>
            {/* Dynamic Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#2E7CF6]/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#22D3EE]/10 blur-[120px] rounded-full" />
            </div>

            <div className="w-full max-w-md glass-card rounded-3xl p-8 md:p-10 relative z-10 animate-in fade-in zoom-in-95 duration-700">
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#2E7CF6] to-[#22D3EE] rounded-2xl flex items-center justify-center shadow-lg shadow-[#2E7CF6]/30 mb-6 group transition-transform hover:scale-110 duration-300">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-[#E6EDF7] tracking-tight mb-3">
                        家庭財務戰情室
                    </h1>
                    <p className="text-[#93A4C2] text-sm font-medium flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#22D3EE]" />
                        安全存取 · 家庭財務管理系統
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[#5A6B89] uppercase tracking-widest ml-1">
                            輸入存取密碼
                        </label>
                        <div className="relative group">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                className={`
                  w-full px-5 py-4 bg-[#16223D] border-2 rounded-2xl outline-none transition-all duration-300
                  text-[#E6EDF7] font-medium text-lg tracking-widest
                  ${error ? 'border-[#EF4444]/50 focus:border-[#EF4444]' : 'border-[#1F2C4A] focus:border-[#2E7CF6] focus:bg-[#111A2E]'}
                `}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5A6B89] hover:text-[#93A4C2] p-2 rounded-lg transition-colors"
                                title={showPassword ? '隱藏密碼' : '顯示密碼'}
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-sm font-bold px-4 py-3 rounded-xl animate-in shake duration-300">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !password}
                        className={`
              w-full py-4 rounded-2xl font-black text-white text-lg tracking-wide
              flex items-center justify-center gap-2 shadow-xl transition-all duration-300
              ${loading || !password
                                ? 'bg-[#1F2C4A] shadow-none cursor-not-allowed text-[#5A6B89]'
                                : 'bg-gradient-to-r from-[#2E7CF6] to-[#22D3EE] hover:from-[#1a6ae3] hover:to-[#0db8d4] shadow-[#2E7CF6]/25 -translate-y-0.5 active:translate-y-0 active:shadow-md'
                            }
            `}
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                進入戰情室 <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-10 pt-8 border-t border-[#1F2C4A] text-center">
                    <p className="text-xs text-[#5A6B89] font-medium">
                        &copy; 2026 PY & KIGO 家庭財務戰情室. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    )
}
