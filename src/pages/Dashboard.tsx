import React, { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { Briefcase, CheckCircle, Clock, DollarSign, Target, TrendingUp, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { firestoreService } from '@/services/firestoreService';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    projects: 0,
    tasks: 0,
    pendingTasks: 0,
    revenue: 0,
    totalExpenses: 0
  });
  const [monthlyStats, setMonthlyStats] = useState({
    revenue: 0,
    profit: 0,
    expenses: 0
  });
  const [projectTypes, setProjectTypes] = useState([]);
  const [goals, setGoals] = useState<any>(null);
  const [recentUpdates, setRecentUpdates] = useState<any[]>([]);
  const [currentMonthProjects, setCurrentMonthProjects] = useState<any>({});
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const unsubscribeProjects = firestoreService.subscribe('projects', (projects) => {
      calculateStats(projects, null, null, null);
    });

    const unsubscribeTasks = firestoreService.subscribe('tasks', (tasks) => {
      calculateStats(null, tasks, null, null);
    });

    const unsubscribeExpenses = firestoreService.subscribe('expenses', (expenses) => {
      calculateStats(null, null, expenses, null);
    });

    const currentMonth = format(new Date(), 'yyyy-MM');
    const unsubscribeGoals = firestoreService.subscribe('goals', (goalsData) => {
      const currentGoal = goalsData.find((g: any) => g.month === currentMonth);
      setGoals(currentGoal || null);
    });

    fetchRecentUpdates();

    return () => {
      unsubscribeProjects();
      unsubscribeTasks();
      unsubscribeExpenses();
      unsubscribeGoals();
    };
  }, []);

  const [allData, setAllData] = useState<{projects: any[], tasks: any[], expenses: any[]}>({
    projects: [],
    tasks: [],
    expenses: []
  });

  const calculateStats = (projects?: any, tasks?: any, expenses?: any, goalsData?: any) => {
    const newData = {
      projects: projects || allData.projects,
      tasks: tasks || allData.tasks,
      expenses: expenses || allData.expenses
    };
    setAllData(newData);

    const currentMonth = format(new Date(), 'yyyy-MM');
    const { projects: pList, tasks: tList, expenses: eList } = newData;

    // Filter projects for current month
    const currentMonthProjectsList = pList.filter((p: any) => p.date && p.date.startsWith(currentMonth));
    const typeCountCurrentMonth = currentMonthProjectsList.reduce((acc: any, p: any) => {
      acc[p.type] = (acc[p.type] || 0) + 1;
      return acc;
    }, {});
    setCurrentMonthProjects(typeCountCurrentMonth);

    // Calculate stats (Lifetime)
    const fixedTotalRevenue = pList.filter((p: any) => p.category !== 'piecework').reduce((acc: number, p: any) => acc + Number(p.budget || 0), 0);
    const pieceworkTotalRevenue = tList.filter((t: any) => t.project_category === 'piecework' && t.status === 'done').reduce((acc: number, t: any) => acc + (Number(t.project_item_price || 0) * Number(t.pieces_count || 1)), 0);
    const totalRevenue = fixedTotalRevenue + pieceworkTotalRevenue;
    const totalExpenses = eList.reduce((acc: number, e: any) => acc + Number(e.amount || 0), 0);

    // Calculate Monthly Stats
    const currentMonthExpensesList = eList.filter((e: any) => e.date && e.date.startsWith(currentMonth));
    const fixedMonthlyRevenue = currentMonthProjectsList.filter((p: any) => p.category !== 'piecework').reduce((acc: number, p: any) => acc + Number(p.budget || 0), 0);
    const pieceworkMonthlyRevenue = tList.filter((t: any) => t.project_category === 'piecework' && t.status === 'done' && t.due_date && t.due_date.startsWith(currentMonth)).reduce((acc: number, t: any) => acc + (Number(t.project_item_price || 0) * Number(t.pieces_count || 1)), 0);
    const monthlyRevenue = fixedMonthlyRevenue + pieceworkMonthlyRevenue;
    const monthlyExpenses = currentMonthExpensesList.reduce((acc: number, e: any) => acc + Number(e.amount || 0), 0);
    
    // Net Income = Monthly Revenue - Total Expenses (as requested)
    const monthlyProfit = monthlyRevenue - totalExpenses;

    setMonthlyStats({
      revenue: monthlyRevenue,
      profit: monthlyProfit,
      expenses: monthlyExpenses
    });

    // Group projects by type (All time)
    const typeCount = pList.reduce((acc: any, p: any) => {
      acc[p.type] = (acc[p.type] || 0) + 1;
      return acc;
    }, {});

    const typeData = Object.entries(typeCount).map(([name, value]) => ({
      name: translateType(name),
      value
    }));

    setStats({
      projects: pList.length,
      tasks: tList.length,
      pendingTasks: tList.filter((t: any) => t.status !== 'done').length,
      revenue: totalRevenue - totalExpenses,
      totalExpenses: totalExpenses
    });
    setProjectTypes(typeData as any);
  };

  const fetchRecentUpdates = async () => {
    // Recent updates could be from a sub-collection of projects or a separate collection
    // For now, let's just fetch from a 'updates' collection if it exists
    try {
      const updates = await firestoreService.getAll('updates');
      setRecentUpdates(updates.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5));
    } catch (e) {}
  };

  const fetchStats = async () => {
    // Handled by subscribe
  };

  const translateType = (type: string) => {
    const map: Record<string, string> = {
      'wedding': 'أفراح',
      'content': 'صناعة محتوى',
      'commercial': 'تجاري',
      'charity': 'خيري'
    };
    return map[type] || type;
  };

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

  const calculateProgress = (current: number, target: number) => {
    if (!target) return 0;
    const percentage = (current / target) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  return (
    <div className="space-y-6 relative">
      {showToast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-fade-in-down">
          <CheckCircle className="w-5 h-5" />
          <span>تم حفظ النتائج بنجاح</span>
        </div>
      )}
      <h2 className="text-2xl font-bold text-gray-900">لوحة التحكم</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="إجمالي المشاريع" 
          value={stats.projects} 
          icon={Briefcase} 
          color="blue" 
        />
        <StatCard 
          title="المهام المعلقة" 
          value={stats.pendingTasks} 
          icon={Clock} 
          color="yellow" 
        />
        <StatCard 
          title="المهام المنجزة" 
          value={stats.tasks - stats.pendingTasks} 
          icon={CheckCircle} 
          color="green" 
        />
        <StatCard 
          title="صافي الدخل (تقريبي)" 
          value={`${stats.revenue.toLocaleString()} ₪`} 
          icon={DollarSign} 
          color="indigo" 
        />
      </div>

      {/* Charts & Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">توزيع المشاريع (الكلي)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {projectTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {projectTypes.map((entry: any, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-sm text-gray-600">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Financial Goal */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              الهدف المالي الشهري
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{format(new Date(), 'MMMM yyyy')}</span>
              <button 
                onClick={async () => {
                  try {
                    const currentMonth = format(new Date(), 'yyyy-MM');
                    const existingGoal = goals || {};
                    
                    if (existingGoal.id) {
                      await firestoreService.update('goals', existingGoal.id, {
                        actual_revenue: monthlyStats.revenue,
                        actual_profit: monthlyStats.profit,
                        actual_expenses: monthlyStats.expenses
                      });
                    } else {
                      await firestoreService.add('goals', {
                        month: currentMonth,
                        actual_revenue: monthlyStats.revenue,
                        actual_profit: monthlyStats.profit,
                        actual_expenses: monthlyStats.expenses,
                        revenue_target: 10000, // Default target
                        target_wedding: 5,
                        target_content: 5,
                        target_commercial: 5,
                        target_charity: 5
                      });
                    }
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                  } catch (error) {
                    console.error('Failed to save results', error);
                    alert('فشل في حفظ النتائج');
                  }
                }}
                className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 transition-colors"
              >
                حفظ النتائج
              </button>
            </div>
          </div>

          {goals && goals.id ? (
            <div className="space-y-6">
              {/* Revenue Goal */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">الأرباح</span>
                  <span className="font-medium">{monthlyStats.profit.toLocaleString()} / {goals.revenue_target.toLocaleString()} ₪</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div 
                    className="bg-green-500 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${calculateProgress(monthlyStats.profit, goals.revenue_target)}%` }}
                  ></div>
                </div>
              </div>

              {/* Total Expenses */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">اجمالي المصروفات</span>
                  <span className="font-medium text-red-600">-{stats.totalExpenses.toLocaleString()} ₪</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div 
                    className="bg-red-500 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${calculateProgress(stats.totalExpenses, goals.revenue_target)}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <GoalProgress 
                  label="أفراح" 
                  current={currentMonthProjects['wedding'] || 0} 
                  target={goals.target_wedding} 
                  color="bg-pink-500"
                />
                <GoalProgress 
                  label="صناعة محتوى" 
                  current={currentMonthProjects['content'] || 0} 
                  target={goals.target_content} 
                  color="bg-purple-500"
                />
                <GoalProgress 
                  label="تجاري" 
                  current={currentMonthProjects['commercial'] || 0} 
                  target={goals.target_commercial} 
                  color="bg-blue-500"
                />
                <GoalProgress 
                  label="خيري" 
                  current={currentMonthProjects['charity'] || 0} 
                  target={goals.target_charity} 
                  color="bg-green-500"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <p className="mb-2">لم يتم تحديد أهداف لهذا الشهر</p>
              <a href="/goals" className="text-indigo-600 hover:underline text-sm">تحديد الأهداف</a>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Updates */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            آخر التحديثات
          </h3>
          <div className="space-y-4">
            {recentUpdates.length > 0 ? (
              recentUpdates.map((update: any) => (
                <div key={update.id} className="flex gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="bg-white p-2 rounded-full h-fit shadow-sm">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-gray-900 text-sm">{update.project_title}</h4>
                      <span className="text-[10px] text-gray-400">
                        {format(new Date(update.created_at), 'yyyy-MM-dd HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{update.content}</p>
                    <p className="text-[10px] text-indigo-600 mt-1 font-medium">بواسطة: {update.created_by}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">لا توجد تحديثات أخيرة</p>
            )}
          </div>
        </div>

        {/* Quick Actions or Info */}
        <div className="bg-indigo-600 p-6 rounded-xl shadow-lg text-white flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">نظام أوسكار ستوديو</h3>
            <p className="text-indigo-100 text-sm leading-relaxed">
              هذا النظام مصمم لمساعدتكم في إدارة المشاريع والمهام والتقييمات بكل سهولة. تأكد من تحديث حالة المهام بانتظام.
            </p>
          </div>
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white/20 p-2 rounded-lg">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-indigo-200">المهام المنجزة اليوم</p>
                <p className="text-lg font-bold">جاهز للعمل!</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/projects')}
              className="w-full bg-white text-indigo-600 py-2 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors"
            >
              عرض المشاريع
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    green: { bg: 'bg-green-50', text: 'text-green-600' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' }
  };
  
  const theme = colors[color] || colors.blue;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${theme.bg} ${theme.text}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}

function GoalProgress({ label, current, target, color }: any) {
  const progress = target ? Math.min(100, (current / target) * 100) : 0;
  
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{current} / {target}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div 
          className={`${color} h-1.5 rounded-full transition-all duration-500`} 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}
