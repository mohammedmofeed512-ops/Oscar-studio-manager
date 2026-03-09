import React, { useState, useEffect } from 'react';
import { Plus, Trash2, User, Edit2, BarChart2, List, ClipboardCheck, Star, RefreshCw, ShieldCheck } from 'lucide-react';
import ConfirmationModal from '@/components/ConfirmationModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import Toast from '@/components/Toast';
import Avatar from '@/components/Avatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { firestoreService } from '@/services/firestoreService';

export default function Management() {
  const { userId } = useAuth();
  const [team, setTeam] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    phone: '',
    type: 'admin',
    contract_type: 'contract',
    salary: '',
    piece_name: '',
    piece_price: '',
    password: ''
  });

  useEffect(() => {
    const unsubscribe = firestoreService.subscribe('team', (data) => {
      const admins = data.filter((m: any) => m.type === 'admin');
      setTeam(admins);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
    // Handled by subscribe
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const handleOpenModal = (member?: any) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        name: member.name,
        email: member.email || '',
        role: member.role,
        phone: member.phone,
        type: 'admin',
        contract_type: member.contract_type || 'contract',
        salary: member.salary || '',
        piece_name: member.piece_name || '',
        piece_price: member.piece_price || '',
        password: member.password || ''
      });
    } else {
      setEditingMember(null);
      setFormData({ name: '', email: '', role: '', phone: '', type: 'admin', contract_type: 'contract', salary: '', piece_name: '', piece_price: '', password: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMember) {
        await firestoreService.update('team', editingMember.id, formData);
      } else {
        await firestoreService.add('team', formData);
      }

      setToast({ 
        message: editingMember ? 'تم تحديث بيانات المدير بنجاح' : 'تم إضافة المدير بنجاح', 
        type: 'success' 
      });
      setIsModalOpen(false);
      setFormData({ name: '', email: '', role: '', phone: '', type: 'admin', contract_type: 'contract', salary: '', piece_name: '', piece_price: '', password: '' });
      setEditingMember(null);
    } catch (error) {
      console.error('Error saving member:', error);
      setToast({ message: 'حدث خطأ أثناء حفظ البيانات', type: 'error' });
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await firestoreService.delete('team', deleteId);
        setToast({ message: 'تم حذف المدير بنجاح', type: 'success' });
      } catch (error) {
        console.error('Error deleting member:', error);
        setToast({ message: 'حدث خطأ أثناء حذف العضو', type: 'error' });
      } finally {
        setDeleteId(null);
      }
    }
  };

  if (isLoading && !isRefreshing) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-purple-600" />
          الإدارة والمسؤولين
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50"
            title="تحديث القائمة"
          >
            <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            إضافة مدير
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Contract Admins Section */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((member: any) => (
              <div key={member.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:border-purple-200 transition-colors">
                <Avatar 
                  icon={member.avatar_icon} 
                  color={member.avatar} 
                  size="lg"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    {member.name}
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-purple-100 text-purple-700">
                      مدير
                    </span>
                  </h3>
                  <p className="text-sm text-gray-500">{member.role}</p>
                  <p className="text-xs text-gray-400 mt-1">{member.phone}</p>
                  {member.salary && (
                    <p className="text-xs font-semibold text-green-600 mt-1">
                      الراتب: {member.salary} شيكل
                    </p>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleOpenModal(member)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    title="تعديل"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(member.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {team.length === 0 && (
              <div className="col-span-full p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-500 text-sm">لا يوجد مديرين حالياً</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Admin Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">{editingMember ? 'تعديل بيانات المدير' : 'إضافة مدير جديد'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني (لتسجيل الدخول)</label>
                <input 
                  type="email" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="example@studio.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المسمى الوظيفي</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الراتب الشهري</label>
                <input 
                  type="number" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                  value={formData.salary}
                  onChange={e => setFormData({...formData, salary: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
                <input 
                  type="password" 
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  placeholder="كلمة مرور الدخول"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold"
                >
                  حفظ
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
        title="حذف المدير"
        message="هل أنت متأكد من حذف هذا المدير؟ سيؤدي ذلك إلى فقدان صلاحيات الوصول الخاصة به."
      />
    </div>
  );
}
