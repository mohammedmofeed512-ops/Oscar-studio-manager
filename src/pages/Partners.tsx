import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Users, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '@/components/ConfirmationModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import Toast from '@/components/Toast';
import { firestoreService } from '@/services/firestoreService';

export default function Partners() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    description: ''
  });

  useEffect(() => {
    const unsubscribe = firestoreService.subscribe('team', (data) => {
      setPartners(data.filter((m: any) => m.type === 'partner'));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
    // Handled by subscribe
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        type: 'partner',
        role: 'شريك',
        contract_type: 'contract'
      };

      if (editingPartner) {
        await firestoreService.update('team', editingPartner.id, payload);
      } else {
        await firestoreService.add('team', payload);
      }

      setToast({ message: editingPartner ? 'تم التحديث بنجاح' : 'تمت الإضافة بنجاح', type: 'success' });
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', password: '', description: '' });
      setEditingPartner(null);
    } catch (error) {
      setToast({ message: 'حدث خطأ أثناء حفظ البيانات', type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await firestoreService.delete('team', deleteId);
        setToast({ message: 'تم الحذف بنجاح', type: 'success' });
      } catch (error) {
        setToast({ message: 'حدث خطأ أثناء الحذف', type: 'error' });
      }
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  const openEditModal = (partner: any) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name || '',
      phone: partner.phone || '',
      password: partner.password || '',
      description: partner.description || ''
    });
    setIsModalOpen(true);
  };

  if (isLoading) return <LoadingSpinner />;

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
          <Users className="w-6 h-6 text-indigo-600" />
          الشركاء
        </h2>
        <button 
          onClick={() => {
            setEditingPartner(null);
            setFormData({ name: '', phone: '', password: '', description: '' });
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          إضافة شريك
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {partners.map((partner: any) => (
          <div key={partner.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{partner.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{partner.phone}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => openEditModal(partner)}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    setDeleteId(partner.id);
                    setIsDeleteModalOpen(true);
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {partner.description && (
              <p className="text-sm text-gray-600 mt-4 line-clamp-2">{partner.description}</p>
            )}
            
            <div className="mt-6 pt-6 border-t border-gray-50">
              <button 
                onClick={() => navigate('/partner-dashboard')}
                className="w-full flex items-center justify-center gap-2 bg-gray-50 text-gray-700 py-3 rounded-xl font-bold hover:bg-indigo-600 hover:text-white transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                دخول بوابة الشريك
              </button>
            </div>
          </div>
        ))}
        {partners.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            لا يوجد شركاء حالياً
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">
                {editingPartner ? 'تعديل بيانات الشريك' : 'إضافة شريك جديد'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الشريك</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات / وصف</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
        onConfirm={handleDelete}
        title="حذف الشريك"
        message="هل أنت متأكد من حذف هذا الشريك؟ لا يمكن التراجع عن هذا الإجراء."
      />
    </div>
  );
}
