import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, Calendar, DollarSign, UserCheck, Trash2, LayoutGrid, List, Clock, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import ConfirmationModal from '@/components/ConfirmationModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import Toast from '@/components/Toast';

export default function Projects() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [newProject, setNewProject] = useState({
    title: '',
    type: 'wedding',
    category: 'piecework',
    client: '',
    date: '',
    budget: '',
    description: '',
    partner_id: '',
    account_manager_id: '',
    partner_policy: '',
    partner_package: ''
  });

  useEffect(() => {
    fetchProjects();
    fetchPartners();
    fetchTeam();
  }, []);

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

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setToast({ message: 'حدث خطأ أثناء تحميل المشاريع', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchProjects();
    setIsRefreshing(false);
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        const res = await fetch(`/api/projects/${deleteId}`, { method: 'DELETE' });
        if (res.ok) {
          setToast({ message: 'تم حذف المشروع بنجاح', type: 'success' });
          fetchProjects();
        } else {
          throw new Error('Delete failed');
        }
      } catch (error) {
        console.error('Error deleting project:', error);
        setToast({ message: 'حدث خطأ أثناء حذف المشروع', type: 'error' });
      } finally {
        setDeleteId(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newProject, created_by: user })
      });

      if (res.ok) {
        setToast({ message: 'تم إضافة المشروع بنجاح', type: 'success' });
        setIsModalOpen(false);
        setNewProject({
          title: '',
          type: 'wedding',
          category: 'piecework',
          client: '',
          date: '',
          budget: '',
          description: '',
          partner_id: '',
          account_manager_id: '',
          partner_policy: '',
          partner_package: ''
        });
        fetchProjects();
      } else {
        throw new Error('Create failed');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      setToast({ message: 'حدث خطأ أثناء إضافة المشروع', type: 'error' });
    }
  };

  const filteredProjects = Array.isArray(projects) 
    ? (filter === 'all' ? projects : projects.filter((p: any) => p.type === filter))
    : [];

  const sortedProjects = [...filteredProjects].sort((a: any, b: any) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      'wedding': 'أفراح',
      'content': 'صناعة محتوى',
      'commercial': 'تجاري',
      'charity': 'خيري'
    };
    return map[type] || type;
  };

  const getCategoryLabel = (category: string) => {
    const map: Record<string, string> = {
      'piecework': 'بالقطعة',
      'contract': 'عقود'
    };
    return map[category] || category;
  };

  const getTypeColor = (type: string) => {
    const map: Record<string, string> = {
      'wedding': 'bg-pink-100 text-pink-700',
      'content': 'bg-purple-100 text-purple-700',
      'commercial': 'bg-blue-100 text-blue-700',
      'charity': 'bg-green-100 text-green-700'
    };
    return map[type] || 'bg-gray-100 text-gray-700';
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">المشاريع</h2>
        <div className="flex gap-2">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50"
            title="تحديث القائمة"
          >
            <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
          </button>
          <div className="bg-gray-100 p-1 rounded-lg flex">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="شبكة"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`p-2 rounded-md transition-all ${viewMode === 'timeline' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="الجدول الزمني"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            مشروع جديد
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'wedding', 'content', 'commercial', 'charity'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap",
              filter === type 
                ? "bg-gray-900 text-white" 
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            )}
          >
            {type === 'all' ? 'الكل' : getTypeLabel(type)}
          </button>
        ))}
      </div>

      {/* Projects View */}
      {viewMode === 'grid' ? (
        <div className="space-y-12">
          {[
            { id: 'contract', title: 'مشاريع العقود', data: filteredProjects.filter((p: any) => p.category === 'contract') },
            { id: 'piecework', title: 'مشاريع بالقطعة', data: filteredProjects.filter((p: any) => p.category !== 'contract') }
          ].map((section) => (
            section.data.length > 0 && (
              <div key={section.id} className="space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-200 pb-2">
                  <div className={cn(
                    "w-1.5 h-6 rounded-full",
                    section.id === 'contract' ? "bg-indigo-600" : "bg-emerald-500"
                  )}></div>
                  <h3 className="text-xl font-bold text-gray-900">{section.title}</h3>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
                    {section.data.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {section.data.map((project: any) => (
                    <div 
                      key={project.id} 
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", getTypeColor(project.type))}>
                          {getTypeLabel(project.type)}
                        </span>
                        <button 
                          onClick={(e) => handleDelete(e, project.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="حذف المشروع"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{project.title}</h3>
                      <p className="text-sm text-gray-500 mb-4">{project.client}</p>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{project.date || 'غير محدد'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span>{project.budget ? `${project.budget} ₪` : 'غير محدد'}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                        <div className="flex flex-col gap-1">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded w-fit",
                            project.status === 'completed' ? "bg-green-50 text-green-700" :
                            project.status === 'in_progress' ? "bg-blue-50 text-blue-700" :
                            "bg-yellow-50 text-yellow-700"
                          )}>
                            {project.status === 'completed' ? 'مكتمل' :
                             project.status === 'in_progress' ? 'جاري العمل' : 'قيد الانتظار'}
                          </span>
                          {project.category === 'piecework' && (
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded w-fit",
                              project.payment_status === 'paid' ? "bg-emerald-100 text-emerald-700" :
                              project.payment_status === 'partially_paid' ? "bg-sky-100 text-sky-700" :
                              "bg-rose-100 text-rose-700"
                            )}>
                              {project.payment_status === 'paid' ? 'مدفوع' :
                               project.payment_status === 'partially_paid' ? 'مدفوع جزئياً' : 'غير مدفوع'}
                            </span>
                          )}
                        </div>
                        {project.created_by && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <UserCheck className="w-3 h-3" />
                            <span>{project.created_by}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
          {filteredProjects.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">لا توجد مشاريع لعرضها</p>
            </div>
          )}
        </div>
      ) : (
        <div className="relative border-r-2 border-gray-200 mr-4 md:mr-8 space-y-8 py-4">
          {sortedProjects.map((project: any) => {
            const progress = project.total_tasks > 0 
              ? Math.round((project.completed_tasks / project.total_tasks) * 100) 
              : 0;
            
            return (
              <div key={project.id} className="relative pr-8 md:pr-12">
                {/* Timeline Dot */}
                <div className={cn(
                  "absolute -right-[9px] top-6 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10",
                  project.status === 'completed' ? "bg-green-500" :
                  project.status === 'in_progress' ? "bg-indigo-600" : "bg-gray-300"
                )}></div>
                
                <div 
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
                >
                  {/* Project Info */}
                  <div className="md:col-span-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">{project.title}</h3>
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium", getTypeColor(project.type))}>
                        {getTypeLabel(project.type)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{project.client}</p>
                  </div>

                  {/* Date & Status */}
                  <div className="md:col-span-3 flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{project.date || 'غير محدد'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className={cn(
                        "text-xs font-medium",
                        project.status === 'completed' ? "text-green-600" :
                        project.status === 'in_progress' ? "text-blue-600" : "text-yellow-600"
                      )}>
                        {project.status === 'completed' ? 'مكتمل' :
                         project.status === 'in_progress' ? 'جاري العمل' : 'قيد الانتظار'}
                      </span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="md:col-span-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">التقدم</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className={cn(
                          "h-2 rounded-full transition-all duration-500",
                          progress === 100 ? "bg-green-500" : "bg-indigo-600"
                        )}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {project.completed_tasks || 0} من {project.total_tasks || 0} مهام مكتملة
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-1 flex justify-end">
                    <button 
                      onClick={(e) => handleDelete(e, project.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-2"
                      title="حذف المشروع"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {sortedProjects.length === 0 && (
            <div className="pr-8 text-gray-500">
              لا توجد مشاريع لعرضها
            </div>
          )}
        </div>
      )}

      {/* Add Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">إضافة مشروع جديد</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المشروع</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newProject.title}
                  onChange={e => setNewProject({...newProject, title: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تصنيف المشروع</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newProject.category}
                    onChange={e => setNewProject({...newProject, category: e.target.value})}
                  >
                    <option value="piecework">بالقطعة</option>
                    <option value="contract">عقود</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newProject.type}
                    onChange={e => setNewProject({...newProject, type: e.target.value})}
                  >
                    <option value="wedding">أفراح</option>
                    <option value="content">صناعة محتوى</option>
                    <option value="commercial">تجاري</option>
                    <option value="charity">خيري</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">العميل</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newProject.client}
                    onChange={e => setNewProject({...newProject, client: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                  <input 
                    type="date" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newProject.date}
                    onChange={e => setNewProject({...newProject, date: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الميزانية</label>
                <input 
                  type="number" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newProject.budget}
                  onChange={e => setNewProject({...newProject, budget: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الشريك المسؤول</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newProject.partner_id}
                    onChange={e => setNewProject({...newProject, partner_id: e.target.value})}
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newProject.account_manager_id}
                    onChange={e => setNewProject({...newProject, account_manager_id: e.target.value})}
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
                    value={newProject.partner_package}
                    onChange={e => setNewProject({...newProject, partner_package: e.target.value})}
                    placeholder="مثال: الباقة الذهبية"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">سياسة الشريك</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newProject.partner_policy}
                    onChange={e => setNewProject({...newProject, partner_policy: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                  rows={3}
                  value={newProject.description}
                  onChange={e => setNewProject({...newProject, description: e.target.value})}
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
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
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
        title="حذف المشروع"
        message="هل أنت متأكد من حذف هذا المشروع؟ لا يمكن التراجع عن هذا الإجراء."
      />
    </div>
  );
}
