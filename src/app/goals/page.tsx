"use client";

import { useState, useEffect } from "react";
import { Plus, X, PiggyBank, Target, Trash2, Pencil, ChevronUp, ChevronDown } from "lucide-react";
import { getGoalsWithProgress, createGoal, getActiveAssets, deleteGoal, updateGoal, updateGoalsOrder } from "@/app/actions/goals";

export default function GoalTracker() {
    const [goals, setGoals] = useState<any[]>([]);
    const [activeAssets, setActiveAssets] = useState<any[]>([]);
    const [mounted, setMounted] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        target_amount: "",
        target_date: "",
        category: "upcoming_expense",
        asset_ids: [] as string[]
    });

    const fetchGoalsAndAssets = async () => {
        const [goalsData, assetsData] = await Promise.all([
            getGoalsWithProgress(),
            getActiveAssets()
        ]);
        setGoals(goalsData);
        setActiveAssets(assetsData);
    };

    useEffect(() => {
        setMounted(true);
        fetchGoalsAndAssets();
    }, []);

    const handleAddGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const amount = Number(formData.target_amount);
            if (isNaN(amount) || amount <= 0) {
                alert("請輸入有效的目標金額！");
                return;
            }

            if (editingGoalId) {
                await updateGoal(editingGoalId, {
                    name: formData.name,
                    target_amount: amount,
                    category: formData.category,
                    target_date: formData.target_date || null,
                    asset_ids: formData.asset_ids
                });
            } else {
                await createGoal({
                    name: formData.name,
                    target_amount: amount,
                    category: formData.category,
                    target_date: formData.target_date || null,
                    asset_ids: formData.asset_ids
                });
            }

            setFormData({ name: "", target_amount: "", target_date: "", category: "upcoming_expense", asset_ids: [] });
            setEditingGoalId(null);
            setIsModalOpen(false);
            await fetchGoalsAndAssets();

        } catch (error) {
            console.error(error);
            alert("新增失敗，請稍後再試！");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteGoal = async (goalId: string, goalName: string) => {
        if (!confirm(`確定要刪除目標「${goalName}」嗎？此操作無法復原。`)) return;
        try {
            await deleteGoal(goalId);
            await fetchGoalsAndAssets();
        } catch (error) {
            console.error(error);
            alert("刪除失敗，請稍後再試！");
        }
    };

    const handleEditClick = (goal: any) => {
        setEditingGoalId(goal.id);
        setFormData({
            name: goal.name,
            target_amount: goal.target_amount.toString(),
            target_date: goal.target_date || "",
            category: goal.category || "upcoming_expense",
            asset_ids: goal.goal_asset_mapping?.map((m: any) => m.asset_id) || []
        });
        setIsModalOpen(true);
    };

    const toggleAssetSelection = (assetId: string) => {
        setFormData(prev => {
            const currentSelection = new Set(prev.asset_ids);
            if (currentSelection.has(assetId)) {
                currentSelection.delete(assetId);
            } else {
                currentSelection.add(assetId);
            }
            return { ...prev, asset_ids: Array.from(currentSelection) };
        });
    };

    const handleMoveGoal = async (goalId: string, direction: 'up' | 'down') => {
        const goal = goals.find(g => g.id === goalId);
        if (!goal) return;

        const categoryGoals = goals.filter(g =>
            (goal.category === 'upcoming_expense' && g.category === 'upcoming_expense') ||
            ((goal.category === 'long_term' || !goal.category) && (g.category === 'long_term' || !g.category))
        );

        const intraIndex = categoryGoals.findIndex(g => g.id === goalId);
        if (intraIndex === -1) return;

        let swapWithId: string | null = null;
        if (direction === 'up' && intraIndex > 0) {
            swapWithId = categoryGoals[intraIndex - 1].id;
        } else if (direction === 'down' && intraIndex < categoryGoals.length - 1) {
            swapWithId = categoryGoals[intraIndex + 1].id;
        }

        if (!swapWithId) return;

        const newGoals = [...goals];
        const indexA = newGoals.findIndex(g => g.id === goalId);
        const indexB = newGoals.findIndex(g => g.id === swapWithId);

        [newGoals[indexA], newGoals[indexB]] = [newGoals[indexB], newGoals[indexA]];

        setGoals(newGoals);

        try {
            await updateGoalsOrder(newGoals.map(g => g.id));
        } catch (error) {
            console.error(error);
            alert("順序更新失敗");
            fetchGoalsAndAssets();
        }
    };

    if (!mounted) return <div className="animate-pulse space-y-8 p-4"><div className="h-32 bg-[#111A2E] rounded-2xl w-full"></div></div>;

    const upcomingExpenses = goals.filter(g => g.category === 'upcoming_expense');
    const longTermGoals = goals.filter(g => g.category === 'long_term' || !g.category);

    const formatTWD = (val: number) => {
        return new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 0 }).format(val);
    };

    const getStatusStyle = (status: string) => {
        if (status === 'achieved') return { text: "達標", color: "text-[#10B981]", dot: "bg-[#10B981]", progress: "bg-[#10B981]" };
        if (status === 'warning') return { text: "落後/警示", color: "text-[#F59E0B]", dot: "bg-[#F59E0B]", progress: "bg-[#F59E0B]" };
        return { text: "穩定累積中", color: "text-[#2E7CF6]", dot: "bg-[#2E7CF6]", progress: "bg-[#2E7CF6]" };
    };

    const renderGoalCard = (goal: any) => {
        const style = getStatusStyle(goal.status);
        return (
            <div key={goal.id} className="glass-card p-6 rounded-2xl hover:border-[#2E7CF6]/40 transition-all">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-lg font-bold text-[#E6EDF7] flex items-center gap-2">
                        <span className="text-xl">🎯</span> {goal.name}
                    </h3>
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-0.5 mr-2 border-r border-[#1F2C4A] pr-2">
                            <button
                                onClick={() => handleMoveGoal(goal.id, 'up')}
                                className="p-1 text-[#5A6B89] hover:text-[#2E7CF6] hover:bg-[#16223D] rounded transition-all"
                                title="向上移動"
                            >
                                <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleMoveGoal(goal.id, 'down')}
                                className="p-1 text-[#5A6B89] hover:text-[#2E7CF6] hover:bg-[#16223D] rounded transition-all"
                                title="向下移動"
                            >
                                <ChevronDown className="w-4 h-4" />
                            </button>
                        </div>
                        <span className="text-xs font-semibold text-[#5A6B89] bg-[#16223D] px-3 py-1 rounded-md border border-[#1F2C4A]">
                            目標日: {goal.target_date || '未設定'}
                        </span>
                        <button
                            onClick={() => handleEditClick(goal)}
                            className="p-1.5 text-[#5A6B89] hover:text-[#2E7CF6] hover:bg-[#16223D] rounded-lg transition-colors"
                            title="編輯目標"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleDeleteGoal(goal.id, goal.name)}
                            className="p-1.5 text-[#5A6B89] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors"
                            title="刪除目標"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="h-2.5 w-full bg-[#16223D] rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${style.progress}`}
                            style={{ width: `${goal.progress}%` }}
                        />
                    </div>
                </div>

                {/* Metrics */}
                <div className="flex justify-between items-end mb-4">
                    <p className="text-sm font-medium text-[#93A4C2] tabnum">
                        已分配: {formatTWD(goal.current_funding)} / 目標: {formatTWD(goal.target_amount)} TWD
                    </p>
                    <div className={`flex items-center gap-1.5 text-sm font-bold ${style.color}`}>
                        {style.text} ({goal.progress.toFixed(1)}%)
                        <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                    </div>
                </div>

                {/* Source info */}
                <p className="text-xs font-medium text-[#5A6B89]">
                    {goal.goal_asset_mapping?.length > 0
                        ? `已綁定 ${goal.goal_asset_mapping.length} 個資產帳戶來源`
                        : '尚未綁定任何資產'}
                </p>
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-[#E6EDF7] tracking-tight flex items-center gap-2">
                        <Target className="w-6 h-6 text-[#2E7CF6]" />
                        財務目標
                    </h1>
                    <p className="text-[#93A4C2] mt-1 text-sm font-medium">追蹤短期開銷與長期理財規劃的達成進度</p>
                </div>
                <button
                    onClick={() => {
                        setEditingGoalId(null);
                        setFormData({ name: "", target_amount: "", target_date: "", category: "upcoming_expense", asset_ids: [] });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-[#2E7CF6] hover:bg-[#1a6ae3] text-white rounded-xl font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
                    <Plus className="w-4 h-4" />
                    新增目標
                </button>
            </div>

            {/* Upcoming Expenses Section */}
            <section className="glass-card rounded-3xl overflow-hidden border-t-4 border-t-[#F59E0B] relative">
                <div className="p-6 md:px-8 border-b border-[#1F2C4A] flex items-center gap-3">
                    <div className="p-2 bg-[#F59E0B]/10 text-[#F59E0B] rounded-lg">
                        <PiggyBank className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#E6EDF7]">即將到來的大筆開銷</h2>
                        <p className="text-sm text-[#93A4C2]">1-3年內的短期目標，如旅遊、買車、婚禮等。</p>
                    </div>
                </div>

                <div className="p-6 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {upcomingExpenses.length === 0 ? (
                        <div className="col-span-full py-8 text-center text-[#5A6B89] text-sm">還沒有近期開銷目標，點「新增目標」建立第一筆。</div>
                    ) : upcomingExpenses.map(renderGoalCard)}
                </div>
            </section>

            {/* Long Term Goals Section */}
            <section className="glass-card rounded-3xl overflow-hidden border-t-4 border-t-[#2E7CF6] relative">
                <div className="p-6 md:px-8 border-b border-[#1F2C4A] flex items-center gap-3">
                    <div className="p-2 bg-[#2E7CF6]/10 text-[#2E7CF6] rounded-lg">
                        <Target className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#E6EDF7]">長期理財規劃</h2>
                        <p className="text-sm text-[#93A4C2]">3年以上的長遠規劃，如退休金、買房頭期款等。</p>
                    </div>
                </div>

                <div className="p-6 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {longTermGoals.length === 0 ? (
                        <div className="col-span-full py-8 text-center text-[#5A6B89] text-sm">還沒有長期理財目標，點「新增目標」建立第一筆。</div>
                    ) : longTermGoals.map(renderGoalCard)}
                </div>
            </section>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
                    <div className="glass-card rounded-2xl shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
                        <div className="sticky top-0 glass flex justify-between items-center p-6 border-b border-[#1F2C4A] z-10">
                            <h3 className="text-lg font-bold text-[#E6EDF7]">
                                {editingGoalId ? '編輯財務目標' : '新增財務目標'}
                            </h3>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setEditingGoalId(null);
                                }}
                                className="text-[#5A6B89] hover:text-[#93A4C2] transition-colors p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddGoal} className="p-6 space-y-6">

                            {/* Category Selection */}
                            <div>
                                <label className="block text-sm font-medium text-[#93A4C2] mb-3 uppercase tracking-wider text-xs">目標類型 <span className="text-[#EF4444]">*</span></label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className={`
                                        cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all
                                        ${formData.category === 'upcoming_expense' ? 'border-[#F59E0B] bg-[#F59E0B]/10 text-[#F59E0B]' : 'border-[#1F2C4A] bg-[#16223D] text-[#5A6B89] hover:border-[#2a3d60]'}
                                    `}>
                                        <input type="radio" name="category" value="upcoming_expense" className="sr-only"
                                            checked={formData.category === 'upcoming_expense'}
                                            onChange={() => setFormData({ ...formData, category: 'upcoming_expense' })}
                                        />
                                        <PiggyBank className="w-6 h-6 mb-2" />
                                        <span className="font-bold text-sm">大筆開銷（短期）</span>
                                    </label>

                                    <label className={`
                                        cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all
                                        ${formData.category === 'long_term' ? 'border-[#2E7CF6] bg-[#2E7CF6]/10 text-[#2E7CF6]' : 'border-[#1F2C4A] bg-[#16223D] text-[#5A6B89] hover:border-[#2a3d60]'}
                                    `}>
                                        <input type="radio" name="category" value="long_term" className="sr-only"
                                            checked={formData.category === 'long_term'}
                                            onChange={() => setFormData({ ...formData, category: 'long_term' })}
                                        />
                                        <Target className="w-6 h-6 mb-2" />
                                        <span className="font-bold text-sm">理財規劃（長期）</span>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#93A4C2] mb-1">目標名稱 <span className="text-[#EF4444]">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 bg-[#16223D] border border-[#1F2C4A] rounded-lg focus:ring-2 focus:ring-[#2E7CF6] focus:border-[#2E7CF6] outline-none transition-all placeholder:text-[#5A6B89] text-[#E6EDF7]"
                                        placeholder="例如：Japandi 新家裝潢、退休金"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[#93A4C2] mb-1">目標金額 (TWD) <span className="text-[#EF4444]">*</span></label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            className="w-full px-4 py-2 bg-[#16223D] border border-[#1F2C4A] rounded-lg focus:ring-2 focus:ring-[#2E7CF6] focus:border-[#2E7CF6] outline-none transition-all placeholder:text-[#5A6B89] text-[#E6EDF7] tabnum"
                                            placeholder="例如：500000"
                                            value={formData.target_amount}
                                            onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-[#93A4C2] mb-1">預計達成日期（選填）</label>
                                        <input
                                            type="date"
                                            className="w-full px-4 py-2 bg-[#16223D] border border-[#1F2C4A] rounded-lg focus:ring-2 focus:ring-[#2E7CF6] focus:border-[#2E7CF6] outline-none transition-all text-[#E6EDF7]"
                                            value={formData.target_date}
                                            onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Asset Selection */}
                            <div className="pt-2 border-t border-[#1F2C4A]">
                                <label className="block text-sm font-medium text-[#93A4C2] mb-2">綁定資產帳戶以追蹤進度（選填）</label>
                                <p className="text-xs text-[#5A6B89] mb-3">可以靈活選擇多個股票或現金帳戶，這些帳戶的現值總和將視為該目標的當前進度。</p>

                                <div className="max-h-40 overflow-y-auto border border-[#1F2C4A] rounded-lg bg-[#111A2E] p-2 space-y-1">
                                    {activeAssets.length === 0 ? (
                                        <div className="text-xs text-[#5A6B89] text-center py-4">無可用資產。</div>
                                    ) : (
                                        activeAssets.map(asset => {
                                            const isSelected = formData.asset_ids.includes(asset.id);
                                            return (
                                                <label
                                                    key={asset.id}
                                                    className={`
                                                        flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors text-sm
                                                        ${isSelected ? 'bg-[#2E7CF6]/10 border border-[#2E7CF6]/40' : 'bg-[#16223D] border border-[#1F2C4A] hover:border-[#2a3d60]'}
                                                    `}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-[#1F2C4A] focus:ring-[#2E7CF6] accent-[#2E7CF6]"
                                                        checked={isSelected}
                                                        onChange={() => toggleAssetSelection(asset.id)}
                                                    />
                                                    <div className="flex-1 font-medium text-[#E6EDF7] truncate">{asset.title}</div>

                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${asset.owner === 'PY' ? 'bg-[#10B981]/10 text-[#10B981]' :
                                                            asset.owner === 'Kigo' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                                                                'bg-[#2E7CF6]/10 text-[#2E7CF6]'
                                                            }`}>
                                                            {asset.owner === 'Both' ? '共同' : asset.owner}
                                                        </span>
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-[#16223D] text-[#93A4C2] rounded-md font-bold border border-[#1F2C4A]">
                                                            {asset.currency}
                                                        </span>
                                                        <span className="text-[10px] px-1.5 py-0.5 text-[#5A6B89] bg-[#111A2E] border border-[#1F2C4A] rounded-md">
                                                            {asset.asset_type === 'stock' || asset.asset_type === 'rsu' ? '股票' : '現金'}
                                                        </span>
                                                    </div>
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="pt-6 mt-4 flex justify-end gap-3 sticky bottom-0 glass border-t border-[#1F2C4A] p-4 -mx-6 -mb-6 rounded-b-2xl">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setEditingGoalId(null);
                                    }}
                                    className="px-4 py-2 text-[#93A4C2] font-medium hover:bg-[#16223D] rounded-lg transition-colors"
                                    disabled={isSubmitting}
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-[#2E7CF6] hover:bg-[#1a6ae3] text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        editingGoalId ? "儲存修改" : "建立目標"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
