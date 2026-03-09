import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle, 
  FileText, 
  Hash, 
  Instagram, 
  User, 
  Edit2, 
  X, 
  Plus, 
  Target, 
  TrendingUp, 
  Video, 
  Shield, 
  Package, 
  Briefcase,
  Trash2,
  Save,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import Toast from '@/components/Toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type Tab = 'strategies' | 'content' | 'ads' | 'reels' | 'info';

export default function PartnerDashboard() {
  const { userId, role } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('content');
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Data states
  const [tasks, setTasks] = useState<any[]>([]);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [projectItems, setProjectItems] = useState<any[]>([]);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<Tab | 'task'>('task');
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    fetchInitialData();
  }, [userId]);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectData();
    }
  }, [selectedProject]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [projectsRes, teamRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/team')
      ]);
      
      const projectsData = await projectsRes.json();
      const teamData = await teamRes.json();
      setTeam(teamData);

      // Filter projects based on role
      let filteredProjects = projectsData;
      if (role === 'partner') {
        filteredProjects = projectsData.filter((p: any) => p.partner_id === userId);
      }
      
      setProjects(filteredProjects);
      if (filteredProjects.length > 0) {
        setSelectedProject(filteredProjects[0]);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjectData = async () => {
    if (!selectedProject) return;
    try {
      const [tasksRes, strategiesRes, adsRes, reelsRes, itemsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch(`/api/projects/${selectedProject.id}/marketing-strategies`),
        fetch(`/api/projects/${selectedProject.id}/sponsored-ads`),
        fetch(`/api/projects/${selectedProject.id}/reels-schedule`),
        fetch(`/api/projects/${selectedProject.id}/items`)
      ]);

      const allTasks = await tasksRes.json();
      setTasks(allTasks.filter((t: any) => t.project_id === selectedProject.id));
      setStrategies(await strategiesRes.json());
      setAds(await adsRes.json());
      setReels(await reelsRes.json());
      setProjectItems(await itemsRes.json());
    } catch (error) {
      console.error('Error fetching project data:', error);
    }
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedProject)
      });
      if (res.ok) {
        setToast({ message: 'تم حفظ المعلومات بنجاح', type: 'success' });
      }
    } catch (error) {
      setToast({ message: 'حدث خطأ أثناء الحفظ', type: 'error' });
    }
  };

  const handleAddItem = async (data: any) => {
    let url = '';
    let method = 'POST';
    
    if (editingItem) {
      method = 'PUT';
      if (modalType === 'task') url = `/api/tasks/${editingItem.id}`;
      if (modalType === 'reels') url = `/api/reels-schedule/${editingItem.id}`;
      if (modalType === 'ads') url = `/api/sponsored-ads/${editingItem.id}`;
      if (modalType === 'strategies') url = `/api/marketing-strategies/${editingItem.id}`;
    } else {
      if (modalType === 'strategies') url = `/api/projects/${selectedProject.id}/marketing-strategies`;
      if (modalType === 'ads') url = `/api/projects/${selectedProject.id}/sponsored-ads`;
      if (modalType === 'reels') url = `/api/projects/${selectedProject.id}/reels-schedule`;
      if (modalType === 'task') url = `/api/tasks`;
    }

    if (!url) return;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...data, 
          project_id: selectedProject.id,
          pieces_count: data.pieces_count ? parseInt(data.pieces_count as string) : 1,
          project_item_id: data.project_item_id || null
        })
      });
      if (res.ok) {
        setToast({ message: editingItem ? 'تم التحديث بنجاح' : 'تمت الإضافة بنجاح', type: 'success' });
        setIsModalOpen(false);
        setEditingItem(null);
        fetchProjectData();
      }
    } catch (error) {
      setToast({ message: 'حدث خطأ أثناء العملية', type: 'error' });
    }
  };

  const handleApproval = async (type: 'task' | 'reel' | 'ad', id: number, approval: string) => {
    let url = '';
    let item = null;

    if (type === 'task') {
      url = `/api/tasks/${id}`;
      item = tasks.find(t => t.id === id);
    } else if (type === 'reel') {
      url = `/api/reels-schedule/${id}`;
      item = reels.find(r => r.id === id);
    } else if (type === 'ad') {
      url = `/api/sponsored-ads/${id}`;
      item = ads.find(a => a.id === id);
    }
    
    if (!item) return;

    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, client_approval: approval })
      });
      if (res.ok) {
        setToast({ message: 'تم تحديث حالة الموافقة', type: 'success' });
        fetchProjectData();
      }
    } catch (error) {
      setToast({ message: 'حدث خطأ أثناء التحديث', type: 'error' });
    }
  };

  const handleDeleteItem = async (type: Tab, id: number) => {
    let url = '';
    if (type === 'strategies') url = `/api/marketing-strategies/${id}`;
    if (type === 'ads') url = `/api/sponsored-ads/${id}`;
    if (type === 'reels') url = `/api/reels-schedule/${id}`;
    if (type === 'content') url = `/api/tasks/${id}`;

    try {
      const res = await fetch(url, { method: 'DELETE' });
      if (res.ok) {
        setToast({ message: 'تم الحذف بنجاح', type: 'success' });
        fetchProjectData();
      }
    } catch (error) {
      setToast({ message: 'حدث خطأ أثناء الحذف', type: 'error' });
    }
  };

  if (isLoading) return <LoadingSpinner />;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const itemsByDate = [
    ...tasks, 
    ...reels.map(r => ({ ...r, isReel: true, due_date: r.publish_date })),
    ...ads.map(a => ({ ...a, isAd: true, title: `إعلان: ${a.platform}`, due_date: a.start_date }))
  ].reduce((acc: any, item: any) => {
    if (!item.due_date) return acc;
    const dateStr = item.due_date.split('T')[0];
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(item);
    return acc;
  }, {});

  const selectedItems = itemsByDate[format(selectedDate, 'yyyy-MM-dd')] || [];

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header & Project Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">بوابة إدارة الشركاء</h2>
          <p className="text-gray-500 mt-1">إدارة الاستراتيجيات، المحتوى، والنشاط الإعلاني</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Briefcase className="w-5 h-5 text-indigo-600" />
          <select 
            className="flex-1 md:w-64 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
            value={selectedProject?.id || ''}
            onChange={(e) => setSelectedProject(projects.find(p => p.id === parseInt(e.target.value)))}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-2 p-1 bg-gray-100 rounded-xl no-scrollbar">
        {[
          { id: 'info', label: 'معلومات الشريك', icon: Shield },
          { id: 'strategies', label: 'الاستراتيجيات', icon: Target },
          { id: 'content', label: 'خطة المحتوى', icon: CalendarIcon },
          { id: 'ads', label: 'الإعلانات الممولة', icon: TrendingUp },
          { id: 'reels', label: 'الريلز والفيديو', icon: Video },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-white text-indigo-600 shadow-sm" 
                : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'info' && selectedProject && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <Shield className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">سياسة الشريك والباقة</h3>
                <p className="text-sm text-gray-500">تحديد تفاصيل التعاقد والإشراف</p>
              </div>
            </div>

            <form onSubmit={handleSaveInfo} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">الباقة المختارة</label>
                  <input 
                    type="text"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="مثال: الباقة الذهبية - 12 منشور"
                    value={selectedProject.partner_package || ''}
                    onChange={e => setSelectedProject({...selectedProject, partner_package: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">الاكاونت مانيجر (المشرف)</label>
                  <select 
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    value={selectedProject.account_manager_id || ''}
                    onChange={e => setSelectedProject({...selectedProject, account_manager_id: parseInt(e.target.value)})}
                  >
                    <option value="">اختر المشرف...</option>
                    {team.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">سياسة الشريك / ملاحظات خاصة</label>
                  <textarea 
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 h-40 resize-none"
                    placeholder="اكتب سياسة العمل المتفق عليها هنا..."
                    value={selectedProject.partner_policy || ''}
                    onChange={e => setSelectedProject({...selectedProject, partner_policy: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button 
                  type="submit"
                  className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  <Save className="w-5 h-5" />
                  حفظ المعلومات
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'strategies' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">الحملات والاستراتيجيات التسويقية</h3>
              <button 
                onClick={() => { setModalType('strategies'); setEditingItem(null); setIsModalOpen(true); }}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all"
              >
                <Plus className="w-4 h-4" />
                إضافة استراتيجية
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {strategies.map(s => (
                <div key={s.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative group">
                  <button 
                    onClick={() => handleDeleteItem('strategies', s.id)}
                    className="absolute top-4 left-4 p-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h4>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{s.content}</p>
                  <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                    <div className="text-xs text-gray-400">
                      تم الإنشاء في: {format(parseISO(s.created_at), 'yyyy/MM/dd HH:mm')}
                    </div>
                    <button 
                      onClick={() => { setEditingItem(s); setModalType('strategies'); setIsModalOpen(true); }}
                      className="p-2 text-gray-400 hover:text-indigo-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {strategies.length === 0 && (
                <div className="md:col-span-2 text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">لا توجد استراتيجيات مضافة بعد</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900">{format(currentMonth, 'MMMM yyyy', { locale: ar })}</h3>
                <div className="flex gap-1">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-4 h-4" /></button>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'].map(d => <div key={d} className="text-xs font-bold text-gray-400 py-2">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: monthStart.getDay() }).map((_, i) => <div key={i} />)}
                  {calendarDays.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayItems = itemsByDate[dateStr] || [];
                    const isSelected = isSameDay(day, selectedDate);
                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          "aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all relative",
                          isSelected ? "bg-indigo-600 text-white font-bold" : "hover:bg-gray-50 text-gray-700",
                          isSameDay(day, new Date()) && !isSelected && "bg-indigo-50 text-indigo-600 font-bold"
                        )}
                      >
                        {format(day, 'd')}
                        {dayItems.length > 0 && (
                          <div className="flex gap-0.5 mt-1">
                            {dayItems.slice(0, 3).map((item: any, i: number) => (
                              <span key={i} className={cn("w-1 h-1 rounded-full", isSelected ? "bg-white" : item.isReel ? "bg-red-500" : "bg-indigo-600")} />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
              </div>
              <button 
                onClick={() => { setModalType('task'); setEditingItem(null); setIsModalOpen(true); }}
                className="w-full mt-6 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 py-3 rounded-xl font-bold hover:bg-indigo-100 transition-all"
              >
                <Plus className="w-4 h-4" />
                إضافة محتوى لهذا اليوم
              </button>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  محتوى يوم {format(selectedDate, 'EEEE، d MMMM', { locale: ar })}
                </h3>
                {selectedItems.length > 0 ? (
                  <div className="space-y-6">
                    {selectedItems.map((item: any) => (
                      <div key={item.id} className={cn("border border-gray-100 rounded-2xl p-6 bg-gray-50/50 relative group", item.isReel && "border-red-100 bg-red-50/20")}>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            {item.isReel && <Video className="w-5 h-5 text-red-500" />}
                            {item.isAd && <TrendingUp className="w-5 h-5 text-indigo-600" />}
                            <h4 className="text-lg font-bold text-gray-900">{item.title}</h4>
                            {item.isReel && <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-bold">فيديو/ريلز</span>}
                            {item.isAd && <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full font-bold">إعلان ممول</span>}
                            {!item.isReel && !item.isAd && item.content_type && <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full font-bold">{item.content_type}</span>}
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full font-bold",
                              item.client_approval === 'approved' ? "bg-green-100 text-green-600" :
                              item.client_approval === 'needs_revision' ? "bg-orange-100 text-orange-600" :
                              "bg-gray-100 text-gray-600"
                            )}>
                              {item.client_approval === 'approved' ? 'تمت الموافقة' :
                               item.client_approval === 'needs_revision' ? 'يتطلب تعديل' : 'بانتظار الموافقة'}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleApproval(item.isReel ? 'reel' : item.isAd ? 'ad' : 'task', item.id, 'approved')}
                              className="p-2 text-gray-400 hover:text-green-600 title='موافقة'"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleApproval(item.isReel ? 'reel' : item.isAd ? 'ad' : 'task', item.id, 'needs_revision')}
                              className="p-2 text-gray-400 hover:text-orange-600 title='طلب تعديل'"
                            >
                              <AlertCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setEditingItem(item); setModalType(item.isReel ? 'reels' : item.isAd ? 'ads' : 'task'); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-indigo-600"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteItem(item.isReel ? 'reels' : item.isAd ? 'ads' : 'content', item.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>المنفذ: <span className="font-bold text-gray-900">{item.assignee_name || 'غير محدد'}</span></span>
                          </div>
                          {!item.isReel && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Shield className="w-4 h-4 text-indigo-400" />
                              <span>المشرف: <span className="font-bold text-gray-900">{item.supervisor_name || 'غير محدد'}</span></span>
                            </div>
                          )}
                          {!item.isReel && (() => {
                            try {
                              if (item.participating_trainees) {
                                const traineeIds = JSON.parse(item.participating_trainees);
                                if (Array.isArray(traineeIds) && traineeIds.length > 0) {
                                  const names = traineeIds.map(id => team.find((t: any) => t.id === id)?.name).filter(Boolean).join('، ');
                                  if (names) {
                                    return (
                                      <div className="flex items-center gap-2 text-gray-600 md:col-span-2">
                                        <User className="w-4 h-4 text-indigo-400" />
                                        <span>المتدربين: <span className="font-bold text-gray-900">{names}</span></span>
                                      </div>
                                    );
                                  }
                                }
                              }
                            } catch(e) {}
                            return null;
                          })()}
                          {item.isReel && item.shoot_date && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <CalendarIcon className="w-4 h-4 text-red-400" />
                              <span>تاريخ التصوير: <span className="font-bold text-gray-900">{item.shoot_date}</span></span>
                            </div>
                          )}
                          {item.project_item_name && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Package className="w-4 h-4 text-indigo-400" />
                              <span>القطعة: <span className="font-bold text-gray-900">{item.project_item_name} {item.pieces_count > 1 && `(x${item.pieces_count})`}</span></span>
                            </div>
                          )}
                        </div>
                        {(item.content_text || item.caption) && (
                          <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-3">
                            {item.content_text && <div><p className="text-xs font-bold text-gray-400 mb-1">نص المحتوى</p><p className="text-sm text-gray-800">{item.content_text}</p></div>}
                            {item.caption && <div><p className="text-xs font-bold text-gray-400 mb-1">الكابشن</p><p className="text-sm text-gray-800">{item.caption}</p></div>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 text-gray-400">لا يوجد محتوى مجدول لهذا اليوم</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ads' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">جدول الإعلانات الممولة المقترحة</h3>
              <button 
                onClick={() => { setModalType('ads'); setEditingItem(null); setIsModalOpen(true); }}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all"
              >
                <Plus className="w-4 h-4" />
                إضافة إعلان
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ads.map(ad => (
                <div key={ad.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative group">
                  <div className="absolute top-4 left-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => { setEditingItem(ad); setModalType('ads'); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-indigo-600"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteItem('ads', ad.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-indigo-600" />
                      <span className="font-bold text-gray-900">{ad.platform}</span>
                    </div>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-bold",
                      ad.client_approval === 'approved' ? "bg-green-100 text-green-600" :
                      ad.client_approval === 'needs_revision' ? "bg-orange-100 text-orange-600" :
                      "bg-gray-100 text-gray-600"
                    )}>
                      {ad.client_approval === 'approved' ? 'موافق' :
                       ad.client_approval === 'needs_revision' ? 'تعديل' : 'بانتظار'}
                    </span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">الميزانية:</span><span className="font-bold text-indigo-600">{ad.budget} ر.س</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">الفترة:</span><span className="text-gray-900">{ad.start_date} - {ad.end_date}</span></div>
                    {ad.notes && <p className="text-gray-600 mt-2 pt-2 border-t border-gray-50">{ad.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reels' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">جدول الريلز والفيديوهات القصيرة</h3>
              <button 
                onClick={() => { setModalType('reels'); setEditingItem(null); setIsModalOpen(true); }}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all"
              >
                <Plus className="w-4 h-4" />
                إضافة فيديو
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-right">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-sm font-bold text-gray-600">العنوان</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-600">تاريخ التصوير</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-600">تاريخ النشر</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-600">المنفذ</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-600">الحالة</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-600"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reels.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{r.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{r.shoot_date}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{r.publish_date}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{r.assignee_name || 'غير محدد'}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold text-center">{r.status}</span>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold text-center",
                            r.client_approval === 'approved' ? "bg-green-50 text-green-600" :
                            r.client_approval === 'needs_revision' ? "bg-orange-50 text-orange-600" :
                            "bg-gray-50 text-gray-600"
                          )}>
                            {r.client_approval === 'approved' ? 'موافق عليه' :
                             r.client_approval === 'needs_revision' ? 'تعديل' : 'بانتظار'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => handleApproval('reel', r.id, 'approved')} className="text-gray-400 hover:text-green-600"><CheckCircle2 className="w-4 h-4" /></button>
                          <button onClick={() => handleApproval('reel', r.id, 'needs_revision')} className="text-gray-400 hover:text-orange-600"><AlertCircle className="w-4 h-4" /></button>
                          <button onClick={() => { setEditingItem(r); setModalType('reels'); setIsModalOpen(true); }} className="text-gray-400 hover:text-indigo-600"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteItem('reels', r.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-gray-900">
                {modalType === 'strategies' ? 'إضافة استراتيجية' : 
                 modalType === 'ads' ? 'إضافة إعلان ممول' :
                 modalType === 'reels' ? 'إضافة فيديو/ريلز' : 'إضافة محتوى للتقويم'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());
              if (modalType === 'task') {
                data.participating_trainees = formData.getAll('participating_trainees').map(Number) as any;
              }
              handleAddItem(data);
            }} className="p-6 space-y-4 overflow-y-auto">
              {modalType === 'strategies' && (
                <>
                  <div><label className="block text-sm font-bold mb-1">العنوان</label><input name="title" required defaultValue={editingItem?.title || ''} className="w-full border rounded-xl px-4 py-2" /></div>
                  <div><label className="block text-sm font-bold mb-1">المحتوى</label><textarea name="content" required defaultValue={editingItem?.content || ''} className="w-full border rounded-xl px-4 py-2 h-32" /></div>
                </>
              )}
              {modalType === 'ads' && (
                <>
                  <div><label className="block text-sm font-bold mb-1">المنصة</label><input name="platform" required defaultValue={editingItem?.platform || ''} className="w-full border rounded-xl px-4 py-2" /></div>
                  <div><label className="block text-sm font-bold mb-1">الميزانية</label><input name="budget" type="number" required defaultValue={editingItem?.budget || ''} className="w-full border rounded-xl px-4 py-2" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-bold mb-1">البداية</label><input name="start_date" type="date" required defaultValue={editingItem?.start_date || ''} className="w-full border rounded-xl px-4 py-2" /></div>
                    <div><label className="block text-sm font-bold mb-1">النهاية</label><input name="end_date" type="date" required defaultValue={editingItem?.end_date || ''} className="w-full border rounded-xl px-4 py-2" /></div>
                  </div>
                  <div><label className="block text-sm font-bold mb-1">ملاحظات</label><textarea name="notes" defaultValue={editingItem?.notes || ''} className="w-full border rounded-xl px-4 py-2" /></div>
                  <div>
                    <label className="block text-sm font-bold mb-1">حالة موافقة العميل</label>
                    <select name="client_approval" defaultValue={editingItem?.client_approval || 'pending'} className="w-full border rounded-xl px-4 py-2 bg-white">
                      <option value="pending">بانتظار الموافقة</option>
                      <option value="approved">تمت الموافقة</option>
                      <option value="needs_revision">يتطلب تعديل</option>
                    </select>
                  </div>
                </>
              )}
              {modalType === 'reels' && (
                <>
                  <div><label className="block text-sm font-bold mb-1">العنوان</label><input name="title" required defaultValue={editingItem?.title || ''} className="w-full border rounded-xl px-4 py-2" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-bold mb-1">تاريخ التصوير</label><input name="shoot_date" type="date" defaultValue={editingItem?.shoot_date || ''} className="w-full border rounded-xl px-4 py-2" /></div>
                    <div><label className="block text-sm font-bold mb-1">تاريخ النشر</label><input name="publish_date" type="date" defaultValue={editingItem?.publish_date || ''} className="w-full border rounded-xl px-4 py-2" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-1">المنفذ</label>
                      <select name="assigned_to" defaultValue={editingItem?.assigned_to || ''} className="w-full border rounded-xl px-4 py-2 bg-white">
                        <option value="">اختر المنفذ...</option>
                        {team.filter(m => m.type === 'member').map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">حالة موافقة العميل</label>
                      <select name="client_approval" defaultValue={editingItem?.client_approval || 'pending'} className="w-full border rounded-xl px-4 py-2 bg-white">
                        <option value="pending">بانتظار الموافقة</option>
                        <option value="approved">تمت الموافقة</option>
                        <option value="needs_revision">يتطلب تعديل</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
              {modalType === 'task' && (
                <>
                  <div><label className="block text-sm font-bold mb-1">عنوان المحتوى</label><input name="title" required defaultValue={editingItem?.title || ''} className="w-full border rounded-xl px-4 py-2" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-bold mb-1">التاريخ</label><input name="due_date" type="date" defaultValue={editingItem?.due_date ? editingItem.due_date.split('T')[0] : format(selectedDate, 'yyyy-MM-dd')} className="w-full border rounded-xl px-4 py-2" /></div>
                    <div>
                      <label className="block text-sm font-bold mb-1">نوع المحتوى</label>
                      <select name="content_type" defaultValue={editingItem?.content_type || ''} className="w-full border rounded-xl px-4 py-2 bg-white">
                        <option value="">اختر النوع...</option>
                        <option value="بوست">بوست</option>
                        <option value="ستوري">ستوري</option>
                        <option value="ريلز">ريلز</option>
                        <option value="مقال">مقال</option>
                        <option value="تغريدة">تغريدة</option>
                        <option value="أخرى">أخرى</option>
                      </select>
                    </div>
                  </div>
                  {selectedProject?.category === 'piecework' && projectItems.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold mb-1">القطعة</label>
                        <select name="project_item_id" defaultValue={editingItem?.project_item_id || ''} className="w-full border rounded-xl px-4 py-2 bg-white">
                          <option value="">اختر القطعة...</option>
                          {projectItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-1">عدد القطع</label>
                        <input name="pieces_count" type="number" min="1" defaultValue={editingItem?.pieces_count || 1} className="w-full border rounded-xl px-4 py-2" />
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-1">المنفذ</label>
                      <select name="assigned_to" defaultValue={editingItem?.assigned_to || ''} className="w-full border rounded-xl px-4 py-2 bg-white">
                        <option value="">اختر المنفذ...</option>
                        {team.filter(m => m.type === 'member').map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">المشرف (المسؤول)</label>
                      <select name="supervisor_id" defaultValue={editingItem?.supervisor_id || ''} className="w-full border rounded-xl px-4 py-2 bg-white">
                        <option value="">اختر المشرف...</option>
                        {team.filter(m => m.type === 'admin').map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">المتدربين المشاركين</label>
                    <div className="border border-gray-300 rounded-xl p-3 max-h-32 overflow-y-auto space-y-2 bg-white">
                      {team.filter(m => m.type?.startsWith('trainee_')).map(m => {
                        let isChecked = false;
                        try {
                          if (editingItem?.participating_trainees) {
                            const parsed = JSON.parse(editingItem.participating_trainees);
                            isChecked = Array.isArray(parsed) && parsed.includes(m.id);
                          }
                        } catch(e) {}
                        return (
                          <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              name="participating_trainees"
                              value={m.id}
                              defaultChecked={isChecked}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">{m.name}</span>
                          </label>
                        );
                      })}
                      {team.filter(m => m.type?.startsWith('trainee_')).length === 0 && (
                        <span className="text-sm text-gray-500">لا يوجد متدربين متاحين</span>
                      )}
                    </div>
                  </div>
                  <div><label className="block text-sm font-bold mb-1">نص المحتوى</label><textarea name="content_text" defaultValue={editingItem?.content_text || ''} className="w-full border rounded-xl px-4 py-2 h-24" /></div>
                  <div><label className="block text-sm font-bold mb-1">الكابشن</label><textarea name="caption" defaultValue={editingItem?.caption || ''} className="w-full border rounded-xl px-4 py-2 h-20" /></div>
                  <div>
                    <label className="block text-sm font-bold mb-1">حالة موافقة العميل</label>
                    <select name="client_approval" defaultValue={editingItem?.client_approval || 'pending'} className="w-full border rounded-xl px-4 py-2 bg-white">
                      <option value="pending">بانتظار الموافقة</option>
                      <option value="approved">تمت الموافقة</option>
                      <option value="needs_revision">يتطلب تعديل</option>
                    </select>
                  </div>
                </>
              )}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border rounded-xl font-bold">إلغاء</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
