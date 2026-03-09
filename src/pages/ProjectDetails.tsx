import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Save, Trash2, Calendar, DollarSign, User, FileText, MessageSquare, Send, CheckCircle2, Circle, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import ConfirmationModal from '@/components/ConfirmationModal';
import { format } from 'date-fns';

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [newUpdate, setNewUpdate] = useState('');
  const [newItem, setNewItem] = useState({ name: '', price: '' });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    client: '',
    status: '',
    date: '',
    budget: '',
    description: '',
    category: 'piecework',
    payment_status: 'unpaid',
    partner_id: '',
    account_manager_id: '',
    partner_policy: '',
    partner_package: ''
  });
  const [partners, setPartners] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);

  useEffect(() => {
    fetchProject();
    fetchUpdates();
    fetchItems();
    fetchPartners();
    fetchTeam();
  }, [id]);

  const fetchPartners = async () => {
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      setPartners(data.filter((m: any) => m.type === 'partner'));
    } catch (error) {
      console.error('Error fetching partners:', error);
    }
  };

  const fetchTeam = async () => {
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      setTeam(data);
    } catch (error) {
      console.error('Error fetching team:', error);
    }
  };

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
        setFormData(data);
      } else {
        navigate('/projects');
      }
    } catch (error) {
      console.error('Failed to fetch project');
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await fetch(`/api/projects/${id}/items`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch items');
    }
  };

  const fetchUpdates = async () => {
    try {
      const res = await fetch(`/api/projects/${id}/updates`);
      if (res.ok) {
        const data = await res.json();
        setUpdates(data);
      }
    } catch (error) {
      console.error('Failed to fetch updates');
    }
  };

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpdate.trim()) return;

    try {
      const res = await fetch(`/api/projects/${id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newUpdate, created_by: user })
      });

      if (res.ok) {
        setNewUpdate('');
        fetchUpdates();
      }
    } catch (error) {
      console.error('Failed to add update');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setIsEditing(false);
    fetchProject();
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;

    try {
      const res = await fetch(`/api/projects/${id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newItem, is_paid: 0 })
      });

      if (res.ok) {
        setNewItem({ name: '', price: '' });
        fetchItems();
      }
    } catch (error) {
      console.error('Failed to add item');
    }
  };

  const toggleItemPaid = async (item: any) => {
    // Optimistic update
    setItems(items.map((i: any) => i.id === item.id ? { ...i, is_paid: !i.is_paid } : i));

    try {
      const res = await fetch(`/api/project-items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, is_paid: !item.is_paid })
      });

      if (!res.ok) {
        // Revert on failure
        setItems(items.map((i: any) => i.id === item.id ? { ...i, is_paid: item.is_paid } : i));
      }
    } catch (error) {
      console.error('Failed to toggle item payment');
      // Revert on failure
      setItems(items.map((i: any) => i.id === item.id ? { ...i, is_paid: item.is_paid } : i));
    }
  };

  const deleteItem = async (itemId: number) => {
    try {
      const res = await fetch(`/api/project-items/${itemId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchItems();
      }
    } catch (error) {
      console.error('Failed to delete item');
    }
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    navigate('/projects');
  };

  const [showSaveToast, setShowSaveToast] = useState(false);

  const handleGlobalSave = async () => {
    try {
      // 1. Calculate totals from items
      const totalBudget = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
      const allPaid = items.length > 0 && items.every(i => i.is_paid);
      const somePaid = items.some(i => i.is_paid);
      
      let paymentStatus = 'unpaid';
      if (allPaid) paymentStatus = 'paid';
      else if (somePaid) paymentStatus = 'partially_paid';

      // 2. Update project with new budget and payment status
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          budget: totalBudget,
          payment_status: paymentStatus
        })
      });

      if (res.ok) {
        setShowSaveToast(true);
        setTimeout(() => setShowSaveToast(false), 3000);
        fetchProject();
      }
    } catch (error) {
      console.error('Failed to save project actions');
    }
  };

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;
  if (!project) return null;

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      'wedding': 'أفراح',
      'content': 'صناعة محتوى',
      'commercial': 'تجاري',
      'charity': 'خيري'
    };
    return map[type] || type;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative">
      {showSaveToast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-fade-in-down">
          <CheckCircle2 className="w-5 h-5" />
          <span>تم حفظ جميع التغييرات بنجاح</span>
        </div>
      )}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/projects')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowRight className="w-6 h-6 text-gray-600" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">تفاصيل المشروع</h2>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">
              {isEditing ? 'تعديل المشروع' : project.title}
            </h1>
            {!isEditing && (
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-medium",
                project.status === 'completed' ? "bg-green-100 text-green-700" :
                project.status === 'in_progress' ? "bg-blue-100 text-blue-700" :
                "bg-yellow-100 text-yellow-700"
              )}>
                {project.status === 'completed' ? 'مكتمل' :
                 project.status === 'in_progress' ? 'جاري العمل' : 'قيد الانتظار'}
              </span>
            )}
          </div>
          
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                >
                  تعديل
                </button>
                <button 
                  onClick={handleDelete}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium"
              >
                إلغاء
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {isEditing ? (
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم المشروع</label>
                  <input 
                    type="text" 
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">العميل</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.client}
                    onChange={e => setFormData({...formData, client: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تصنيف المشروع</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="piecework">بالقطعة</option>
                    <option value="contract">عقود</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="wedding">أفراح</option>
                    <option value="content">صناعة محتوى</option>
                    <option value="commercial">تجاري</option>
                    <option value="charity">خيري</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="pending">قيد الانتظار</option>
                    <option value="in_progress">جاري العمل</option>
                    <option value="completed">مكتمل</option>
                  </select>
                </div>
                {formData.category === 'piecework' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">حالة الدفع</label>
                    <select 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                      value={formData.payment_status}
                      onChange={e => setFormData({...formData, payment_status: e.target.value})}
                    >
                      <option value="unpaid">لم يتم الدفع</option>
                      <option value="partially_paid">دفع جزئي</option>
                      <option value="paid">تم الدفع</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                  <input 
                    type="date" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الميزانية</label>
                  <input 
                    type="number" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.budget}
                    onChange={e => setFormData({...formData, budget: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الشريك المسؤول</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    value={formData.partner_id || ''}
                    onChange={e => setFormData({...formData, partner_id: e.target.value})}
                  >
                    <option value="">بدون شريك</option>
                    {partners.map(partner => (
                      <option key={partner.id} value={partner.id}>{partner.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الاكاونت مانيجر</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    value={formData.account_manager_id || ''}
                    onChange={e => setFormData({...formData, account_manager_id: e.target.value})}
                  >
                    <option value="">اختر المشرف...</option>
                    {team.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الباقة المختارة</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.partner_package || ''}
                    onChange={e => setFormData({...formData, partner_package: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">سياسة الشريك</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.partner_policy || ''}
                    onChange={e => setFormData({...formData, partner_policy: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                <textarea 
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="flex justify-end">
                <button 
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  <Save className="w-4 h-4" />
                  حفظ التغييرات
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-700">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">العميل</p>
                      <p className="font-medium">{project.client || 'غير محدد'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">النوع</p>
                      <p className="font-medium">{getTypeLabel(project.type)} ({project.category === 'contract' ? 'عقود' : 'بالقطعة'})</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">التاريخ</p>
                      <p className="font-medium">{project.date || 'غير محدد'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <DollarSign className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">الميزانية</p>
                      <p className="font-medium">{project.budget ? `${project.budget} ₪` : 'غير محدد'}</p>
                    </div>
                  </div>
                  {project.created_by && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">تم الإنشاء بواسطة</p>
                        <p className="font-medium">{project.created_by}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-2">ملاحظات</h3>
                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {project.description || 'لا توجد ملاحظات'}
                </p>
              </div>

              {/* Piecework Items Section */}
              {project.category === 'piecework' && (
                <div className="space-y-4 pt-6 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      تفاصيل القطع (Piecework Items)
                    </h3>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold",
                      project.payment_status === 'paid' ? "bg-green-100 text-green-700" :
                      project.payment_status === 'partially_paid' ? "bg-blue-100 text-blue-700" :
                      "bg-red-100 text-red-700"
                    )}>
                      {project.payment_status === 'paid' ? 'تم دفع الحساب بالكامل' :
                       project.payment_status === 'partially_paid' ? 'تم دفع جزء من الحساب' : 'الحساب لم يدفع بعد'}
                    </div>
                  </div>

                  <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <input 
                      type="text" 
                      placeholder="اسم القطعة (مثلاً: فيديو 1)"
                      className="sm:col-span-1 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      value={newItem.name}
                      onChange={e => setNewItem({...newItem, name: e.target.value})}
                    />
                    <input 
                      type="number" 
                      placeholder="السعر (₪)"
                      className="sm:col-span-1 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      value={newItem.price}
                      onChange={e => setNewItem({...newItem, price: e.target.value})}
                    />
                    <button 
                      type="submit"
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-bold flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة قطعة
                    </button>
                  </form>

                  <div className="space-y-2">
                    {items.length > 0 ? (
                      items.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => toggleItemPaid(item)}
                              className={cn(
                                "transition-colors",
                                item.is_paid ? "text-green-500" : "text-gray-300 hover:text-gray-400"
                              )}
                            >
                              {item.is_paid ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                            </button>
                            <div>
                              <p className={cn("font-medium text-sm", item.is_paid && "line-through text-gray-400")}>{item.name}</p>
                              <p className="text-xs text-indigo-600 font-bold">{item.price} ₪</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-bold",
                              item.is_paid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            )}>
                              {item.is_paid ? 'مدفوع' : 'غير مدفوع'}
                            </span>
                            <button 
                              onClick={() => deleteItem(item.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-4 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        لم يتم تحديد أي قطع لهذا المشروع بعد
                      </p>
                    )}
                  </div>

                  {items.length > 0 && (
                    <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                      <div>
                        <p className="text-xs text-indigo-600 font-bold">إجمالي الحساب</p>
                        <p className="text-xl font-black text-indigo-900">
                          {items.reduce((sum, item) => sum + (item.price || 0), 0)} ₪
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-green-600 font-bold">المبلغ المدفوع</p>
                        <p className="text-xl font-black text-green-700">
                          {items.filter(i => i.is_paid).reduce((sum, item) => sum + (item.price || 0), 0)} ₪
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Updates Section */}
              <div className="space-y-4 pt-6 border-t border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  تحديثات المشروع
                </h3>

                <form onSubmit={handleAddUpdate} className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="أضف تحديثاً جديداً..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newUpdate}
                    onChange={e => setNewUpdate(e.target.value)}
                  />
                  <button 
                    type="submit"
                    className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>

                <div className="space-y-4 mt-4">
                  {updates.length > 0 ? (
                    updates.map((update: any) => (
                      <div key={update.id} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-bold text-gray-900">{update.created_by}</span>
                          <span className="text-xs text-gray-400">
                            {format(new Date(update.created_at), 'yyyy-MM-dd HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {update.content}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4 text-sm">لا توجد تحديثات مسجلة لهذا المشروع</p>
                  )}
                </div>
              </div>

              <div className="flex justify-center pt-6 border-t border-gray-100">
                <button 
                  onClick={handleGlobalSave}
                  className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                  <Save className="w-5 h-5" />
                  حفظ وتأكيد جميع الإجراءات
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="حذف المشروع"
        message="هل أنت متأكد من حذف هذا المشروع؟ لا يمكن التراجع عن هذا الإجراء."
      />
    </div>
  );
}
