import React, { useState, useEffect } from 'react';
import { Save, Target, TrendingUp, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { firestoreService } from '@/services/firestoreService';

export default function FinancialGoal() {
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [goalId, setGoalId] = useState<string | null>(null);
  const [goals, setGoals] = useState({
    revenue_target: 0,
    target_wedding: 0,
    target_content: 0,
    target_commercial: 0,
    target_charity: 0
  });
  const [stats, setStats] = useState({
    revenue: 0,
    profit: 0,
    expenses: 0
  });

  useEffect(() => {
    fetchGoals();
    fetchStats();
  }, [currentMonth]);

  const fetchStats = async () => {
    try {
      const [projects, tasks, expenses] = await Promise.all([
        firestoreService.getAll('projects'),
        firestoreService.getAll('tasks'),
        firestoreService.getAll('expenses')
      ]);

      const currentMonthProjects = projects.filter((p: any) => p.date && p.date.startsWith(currentMonth));
      const currentMonthExpenses = expenses.filter((e: any) => e.date && e.date.startsWith(currentMonth));
      
      const fixedRevenue = currentMonthProjects.filter((p: any) => p.category !== 'piecework').reduce((acc: number, p: any) => acc + Number(p.budget || 0), 0);
      const pieceworkRevenue = tasks.filter((t: any) => t.project_category === 'piecework' && t.status === 'done' && t.due_date && t.due_date.startsWith(currentMonth)).reduce((acc: number, t: any) => acc + (Number(t.project_item_price || 0) * Number(t.pieces_count || 1)), 0);
      
      const revenue = fixedRevenue + pieceworkRevenue;
      const monthlyExpenses = currentMonthExpenses.reduce((acc: number, e: any) => acc + Number(e.amount || 0), 0);
      const totalExpenses = expenses.reduce((acc: number, e: any) => acc + Number(e.amount || 0), 0);
      
      setStats({
        revenue: revenue,
        profit: revenue - totalExpenses,
        expenses: monthlyExpenses
      });
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const goalsData = await firestoreService.getAll('goals');
      const data = goalsData.find((g: any) => g.month === currentMonth) as any;
      
      if (data) {
        setGoalId(data.id);
        setGoals({
          revenue_target: data.revenue_target || 0,
          target_wedding: data.target_wedding || 0,
          target_content: data.target_content || 0,
          target_commercial: data.target_commercial || 0,
          target_charity: data.target_charity || 0
        });
      } else {
        setGoalId(null);
        setGoals({
          revenue_target: 0,
          target_wedding: 0,
          target_content: 0,
          target_commercial: 0,
          target_charity: 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch goals', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    try {
      const data = { 
        ...goals, 
        month: currentMonth,
        actual_revenue: stats.revenue,
        actual_profit: stats.profit,
        actual_expenses: stats.expenses
      };

      if (goalId) {
        await firestoreService.update('goals', goalId, data);
      } else {
        await firestoreService.add('goals', data);
      }
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
      fetchGoals();
    } catch (error) {
      console.error('Failed to save goals', error);
      setSaveStatus('error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">الهدف المالي</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">الشهر:</label>
          <input 
            type="month" 
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Revenue Goal */}
          <div>
            <div className="flex items-center gap-2 mb-4 text-indigo-600">
              <TrendingUp className="w-5 h-5" />
              <h3 className="text-lg font-semibold">هدف الربح الشهري</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ المستهدف (شيكل)</label>
                <input 
                  type="number" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={goals.revenue_target}
                  onChange={(e) => setGoals({...goals, revenue_target: Number(e.target.value)})}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center gap-2 mb-4 text-indigo-600">
              <Target className="w-5 h-5" />
              <h3 className="text-lg font-semibold">هدف عدد المشاريع</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">أفراح</label>
                <input 
                  type="number" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={goals.target_wedding}
                  onChange={(e) => setGoals({...goals, target_wedding: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">صناعة محتوى</label>
                <input 
                  type="number" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={goals.target_content}
                  onChange={(e) => setGoals({...goals, target_content: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تجاري</label>
                <input 
                  type="number" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={goals.target_commercial}
                  onChange={(e) => setGoals({...goals, target_commercial: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">خيري</label>
                <input 
                  type="number" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={goals.target_charity}
                  onChange={(e) => setGoals({...goals, target_charity: Number(e.target.value)})}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4">
            {saveStatus === 'success' && (
              <span className="flex items-center gap-2 text-green-600 text-sm font-medium animate-in fade-in slide-in-from-right-5">
                <CheckCircle className="w-4 h-4" />
                تم الحفظ بنجاح
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center gap-2 text-red-600 text-sm font-medium animate-in fade-in slide-in-from-right-5">
                <AlertCircle className="w-4 h-4" />
                حدث خطأ أثناء الحفظ
              </span>
            )}
            <button 
              type="submit"
              disabled={saveStatus === 'saving'}
              className={cn(
                "flex items-center gap-2 text-white px-6 py-2 rounded-lg transition-all",
                saveStatus === 'saving' ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
              )}
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  حفظ التغييرات
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
