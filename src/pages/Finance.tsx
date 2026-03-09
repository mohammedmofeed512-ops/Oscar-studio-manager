import React, { useState, useEffect } from 'react';
import { Plus, Trash2, TrendingDown, TrendingUp, UserCheck, Edit, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ConfirmationModal from '@/components/ConfirmationModal';
import { firestoreService } from '@/services/firestoreService';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Finance() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    category: 'equipment',
    date: '',
    project_id: ''
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSalariesModalOpen, setIsSalariesModalOpen] = useState(false);
  const [salaryMonth, setSalaryMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isRecordingSalaries, setIsRecordingSalaries] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = {
        ...newExpense,
        amount: parseFloat(newExpense.amount),
        created_by: user
      };

      if (editId) {
        await firestoreService.update('expenses', editId, data);
      } else {
        await firestoreService.add('expenses', data);
      }

      setIsModalOpen(false);
      setNewExpense({ title: '', amount: '', category: 'equipment', date: '', project_id: '' });
      setEditId(null);
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const handleEdit = (expense: any) => {
    setNewExpense({
      title: expense.title,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date,
      project_id: expense.project_id || ''
    });
    setEditId(expense.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await firestoreService.delete('expenses', deleteId);
      } catch (error) {
        console.error('Error deleting expense:', error);
      } finally {
        setDeleteId(null);
      }
    }
  };

  const handleRecordSalaries = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRecordingSalaries(true);
    try {
      // Fetch team members
      const team = await firestoreService.getAll('team');
      
      let total = 0;
      let count = 0;

      for (const member of team as any[]) {
        let salary = 0;
        if (member.contract_type === 'contract') {
          salary = Number(member.salary || 0);
        } else if (member.contract_type === 'piecework') {
          // For piecework, we'd need to fetch completed tasks for this month
          // This is a bit more complex, let's just use a placeholder or skip for now
          // Or we can fetch tasks
          const tasks = await firestoreService.getAll('tasks');
          const memberTasks = tasks.filter((t: any) => 
            t.status === 'done' && 
            t.due_date && t.due_date.startsWith(salaryMonth) &&
            t.participating_trainees && t.participating_trainees.includes(member.name)
          );
          
          salary = memberTasks.reduce((acc: number, t: any) => {
            // Calculate share
            const traineesCount = JSON.parse(t.participating_trainees || '[]').length || 1;
            const itemPrice = Number(t.project_item_price || 0);
            const piecesCount = Number(t.pieces_count || 1);
            return acc + (itemPrice * piecesCount / traineesCount);
          }, 0);
        }

        if (salary > 0) {
          await firestoreService.add('expenses', {
            title: `راتب ${member.name} - ${salaryMonth}`,
            amount: salary,
            category: 'salaries',
            date: new Date().toISOString().split('T')[0],
            created_by: user
          });
          total += salary;
          count++;
        }
      }

      alert(`تم صرف الرواتب بنجاح. إجمالي الرواتب: ${total} شيكل لـ ${count} موظف.`);
      setIsSalariesModalOpen(false);
    } catch (error) {
      console.error('Error recording salaries:', error);
      alert('حدث خطأ أثناء صرف الرواتب');
    } finally {
      setIsRecordingSalaries(false);
    }
  };

  const totalExpenses = expenses.reduce((acc, curr: any) => acc + (curr.amount || 0), 0);

  if (isLoading) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">المالية والمصاريف</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsSalariesModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            صرف الرواتب
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            تسجيل مصروف
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-lg">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي المصروفات</p>
              <p className="text-2xl font-bold text-gray-900">{totalExpenses.toLocaleString()} ₪</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-50 text-gray-500 text-sm">
            <tr>
              <th className="px-6 py-3 font-medium">البند</th>
              <th className="px-6 py-3 font-medium">التصنيف</th>
              <th className="px-6 py-3 font-medium">التاريخ</th>
              <th className="px-6 py-3 font-medium">بواسطة</th>
              <th className="px-6 py-3 font-medium">المبلغ</th>
              <th className="px-6 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {expenses.map((expense: any) => (
              <tr key={expense.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-900 font-medium">{expense.title}</td>
                <td className="px-6 py-4 text-gray-500 text-sm">
                  {expense.category === 'equipment' ? 'معدات' :
                   expense.category === 'salaries' ? 'رواتب' :
                   expense.category === 'marketing' ? 'تسويق' : 'أخرى'}
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm">{expense.date}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {expense.created_by && (
                    <div className="flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />
                      {expense.created_by}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-red-600 font-medium">-{expense.amount} ₪</td>
                <td className="px-6 py-4 flex items-center gap-2">
                  <button 
                    onClick={() => handleEdit(expense)}
                    className="text-gray-400 hover:text-indigo-500"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(expense.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">{editId ? 'تعديل المصروف' : 'تسجيل مصروف جديد'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البند</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                  value={newExpense.title}
                  onChange={e => setNewExpense({...newExpense, title: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ</label>
                  <input 
                    type="number" 
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                    value={newExpense.amount}
                    onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                    value={newExpense.category}
                    onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                  >
                    <option value="equipment">معدات</option>
                    <option value="salaries">رواتب</option>
                    <option value="marketing">تسويق</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                <input 
                  type="date" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                  value={newExpense.date}
                  onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المشروع (اختياري)</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                  value={newExpense.project_id}
                  onChange={e => setNewExpense({...newExpense, project_id: e.target.value})}
                >
                  <option value="">بدون مشروع</option>
                  {projects.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setNewExpense({ title: '', amount: '', category: 'equipment', date: '', project_id: '' });
                    setEditId(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Salaries Modal */}
      {isSalariesModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">صرف الرواتب</h3>
            <form onSubmit={handleRecordSalaries} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الشهر</label>
                <input 
                  type="month" 
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                  value={salaryMonth}
                  onChange={e => setSalaryMonth(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-2">
                  سيتم احتساب رواتب العقود الثابتة، ورواتب القطعة بناءً على المهام المنجزة في هذا الشهر.
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsSalariesModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  disabled={isRecordingSalaries}
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  disabled={isRecordingSalaries}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isRecordingSalaries ? 'جاري الصرف...' : 'صرف الرواتب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="حذف المصروف"
        message="هل أنت متأكد من حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء."
      />
    </div>
  );
}
