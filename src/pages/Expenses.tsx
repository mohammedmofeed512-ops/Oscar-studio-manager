import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Trash2, FileText, Calendar, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { firestoreService } from '@/services/firestoreService';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Expenses() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'general',
    date: new Date().toISOString().split('T')[0],
    project_id: ''
  });

  useEffect(() => {
    const unsubscribeExpenses = firestoreService.subscribe('expenses', (data) => {
      setExpenses(data);
      setIsLoading(false);
    });

    const unsubscribeProjects = firestoreService.subscribe('projects', (data) => {
      setProjects(data);
    });

    return () => {
      unsubscribeExpenses();
      unsubscribeProjects();
    };
  }, []);

  const fetchData = async () => {
    // Handled by subscribe
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await firestoreService.add('expenses', {
        ...formData,
        amount: parseFloat(formData.amount),
        created_by: 'Admin' // Should be dynamic based on auth
      });

      setShowModal(false);
      setFormData({
        title: '',
        amount: '',
        category: 'general',
        date: new Date().toISOString().split('T')[0],
        project_id: ''
      });
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
    
    try {
      await firestoreService.delete('expenses', id);
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) return <LoadingSpinner />;
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الفواتير والنثريات</h1>
          <p className="text-gray-500">إدارة مصروفات وفواتير الاستوديو</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          تسجيل مصروف جديد
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-50 rounded-lg">
              <ArrowDownRight className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">إجمالي المصروفات</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalExpenses.toLocaleString()} ₪</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">عدد الفواتير</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{filteredExpenses.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">هذا الشهر</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {filteredExpenses
              .filter(e => e.date.startsWith(new Date().toISOString().slice(0, 7)))
              .reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString()} ₪
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="بحث في الفواتير..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">جميع التصنيفات</option>
              <option value="general">نثريات عامة</option>
              <option value="equipment">معدات</option>
              <option value="rent">إيجار</option>
              <option value="salaries">رواتب</option>
              <option value="marketing">تسويق</option>
              <option value="maintenance">صيانة</option>
              <option value="hospitality">ضيافة</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">البند</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">التصنيف</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">المبلغ</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">التاريخ</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">المشروع المرتبط</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">بواسطة</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredExpenses.length > 0 ? (
              filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{expense.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      expense.category === 'salaries' ? "bg-green-100 text-green-800" :
                      expense.category === 'equipment' ? "bg-blue-100 text-blue-800" :
                      expense.category === 'marketing' ? "bg-purple-100 text-purple-800" :
                      "bg-gray-100 text-gray-800"
                    )}>
                      {expense.category === 'general' ? 'نثريات عامة' :
                       expense.category === 'equipment' ? 'معدات' :
                       expense.category === 'rent' ? 'إيجار' :
                       expense.category === 'salaries' ? 'رواتب' :
                       expense.category === 'marketing' ? 'تسويق' :
                       expense.category === 'maintenance' ? 'صيانة' :
                       expense.category === 'hospitality' ? 'ضيافة' :
                       expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">{expense.amount.toLocaleString()} ₪</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{expense.date}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {projects.find(p => p.id === expense.project_id)?.title || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{expense.created_by || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  لا توجد سجلات
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg">تسجيل مصروف جديد</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عنوان المصروف</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="مثال: شراء قرطاسية"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ (₪)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="general">نثريات عامة</option>
                  <option value="equipment">معدات</option>
                  <option value="rent">إيجار</option>
                  <option value="salaries">رواتب</option>
                  <option value="marketing">تسويق</option>
                  <option value="maintenance">صيانة</option>
                  <option value="hospitality">ضيافة</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ربط بمشروع (اختياري)</label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">بدون مشروع</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
