import Link from 'next/link';
import { Home, PlusCircle, Target, Wallet, FileText, TrendingUp, ReceiptText, PieChart, Upload, Repeat } from 'lucide-react';

export default function Navbar() {
    return (
        <>
            {/* Desktop Navbar */}
            <nav className="fixed top-0 w-full z-50 glass border-b border-[#1F2C4A] hidden sm:block">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link href="/" className="flex items-center gap-2 group">
                                <div className="bg-[#2E7CF6] p-2 rounded-xl group-hover:bg-[#1a6ae3] transition-colors">
                                    <Wallet className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#22D3EE] to-[#2E7CF6]">
                                    AlexFinance
                                </span>
                            </Link>
                        </div>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                            <NavLink href="/" icon={<Home className="w-4 h-4" />} label="戰情室" />
                            <NavLink href="/holdings" icon={<PieChart className="w-4 h-4" />} label="持倉" />
                            <NavLink href="/goals" icon={<Target className="w-4 h-4" />} label="財務目標" />
                            <NavLink href="/planning" icon={<TrendingUp className="w-4 h-4" />} label="投資策略" />
                            <NavLink href="/expenses" icon={<ReceiptText className="w-4 h-4" />} label="支出" />
                            <NavLink href="/subscriptions" icon={<Repeat className="w-4 h-4" />} label="訂閱" />
                            <NavLink href="/import" icon={<Upload className="w-4 h-4" />} label="批次匯入" />
                            <NavLink href="/wizard" icon={<PlusCircle className="w-4 h-4" />} label="結算精靈" />
                            <NavLink href="/report" icon={<FileText className="w-4 h-4" />} label="季度結算" />

                            {/* Docs Dropdown */}
                            <div className="relative group/docs">
                                <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#93A4C2] hover:text-[#22D3EE] hover:bg-[#111A2E] transition-all">
                                    <FileText className="w-4 h-4" />
                                    <span className="hidden sm:inline">文件</span>
                                </button>
                                <div className="absolute right-0 mt-1 w-48 bg-[#111A2E] rounded-xl shadow-xl border border-[#1F2C4A] py-2 hidden group-hover/docs:block animate-in fade-in slide-in-from-top-2 duration-200">
                                    <a href="https://github.com/lind23132111-coder/PyKigoFinanceDashboard/wiki/User-Guide" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-[#93A4C2] hover:bg-[#16223D] hover:text-[#22D3EE]">使用指南</a>
                                    <a href="https://github.com/lind23132111-coder/PyKigoFinanceDashboard/wiki/Design-Document" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-[#93A4C2] hover:bg-[#16223D] hover:text-[#22D3EE]">設計文件</a>
                                    <a href="https://github.com/lind23132111-coder/PyKigoFinanceDashboard/wiki/Project-Work-Log" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-[#93A4C2] hover:bg-[#16223D] hover:text-[#22D3EE]">工作日誌</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Header */}
            <div className="fixed top-0 w-full z-50 glass border-b border-[#1F2C4A] sm:hidden flex items-center justify-between px-4 h-16">
                <Link href="/" className="flex items-center gap-2">
                    <div className="bg-[#2E7CF6] p-1.5 rounded-lg">
                        <Wallet className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#22D3EE] to-[#2E7CF6]">
                        AlexFinance
                    </span>
                </Link>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 w-full z-50 glass border-t border-[#1F2C4A] sm:hidden">
                <div className="grid grid-cols-7 h-16">
                    <MobileNavLink href="/" icon={<Home className="w-4 h-4" />} label="戰情室" />
                    <MobileNavLink href="/holdings" icon={<PieChart className="w-4 h-4" />} label="持倉" />
                    <MobileNavLink href="/planning" icon={<TrendingUp className="w-4 h-4" />} label="策略" />
                    <MobileNavLink href="/expenses" icon={<ReceiptText className="w-4 h-4" />} label="支出" />
                    <MobileNavLink href="/subscriptions" icon={<Repeat className="w-4 h-4" />} label="訂閱" />
                    <MobileNavLink href="/import" icon={<Upload className="w-4 h-4" />} label="匯入" />
                    <MobileNavLink href="/wizard" icon={<PlusCircle className="w-4 h-4" />} label="結算" />
                    <MobileNavLink href="/report" icon={<FileText className="w-4 h-4" />} label="報表" />
                </div>
            </nav>
        </>
    );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#93A4C2] hover:text-[#22D3EE] hover:bg-[#111A2E] transition-all active:scale-95"
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
        </Link>
    );
}

function MobileNavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="flex flex-col items-center justify-center gap-1 text-[10px] font-bold text-[#5A6B89] hover:text-[#22D3EE] active:scale-95 transition-all"
        >
            <div className="p-1">
                {icon}
            </div>
            <span>{label}</span>
        </Link>
    );
}
