import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, Circle, AlertCircle, UserCheck, Trash2, X, ArrowRight, Edit, RefreshCw, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import ConfirmationModal from '@/components/ConfirmationModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import Toast from '@/components/Toast';

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [team, setTeam] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [filterProject, setFilterProject] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [projectItems, setProjectItems] = useState<any[]>([]);
  const [newTask, setNewTask] = useState({
    title: '',
    project_id: '',
    assigned_to: '',
    supervisor_id: '',
    priority: 'medium',
    due_date: '',
    description: '',
    service_name: '',
    service_price: '',
    pieces_count: 1,
    project_item_id: '',
    participating_trainees: [] as number[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (newTask.project_id) {
      fetch(`/api/projects/${newTask.project_id}/items`)
        .then(res => res.json())
        .then(data => setProjectItems(Array.isArray(data) ? data : []));
    } else {
      setProjectItems([]);
    }
  }, [newTask.project_id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tasksRes, projectsRes, teamRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/projects'),
        fetch('/api/team')
      ]);
      const tasksData = await tasksRes.json();
      const projectsData = await projectsRes.json();
      const teamData = await teamRes.json();
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setTeam(Array.isArray(teamData) ? teamData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setToast({ message: 'حدث خطأ أثناء تحميل البيانات', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const filteredTasks = tasks.filter((task: any) => {
    const matchesProject = filterProject === 'all' || task.project_id?.toString() === filterProject;
    const matchesAssignee = filterAssignee === 'all' || task.assigned_to?.toString() === filterAssignee;
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    return matchesProject && matchesAssignee && matchesStatus;
  });

  const handleDelete = (id: number) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        const res = await fetch(`/api/tasks/${deleteId}`, { method: 'DELETE' });
        if (res.ok) {
          setToast({ message: 'تم حذف المهمة بنجاح', type: 'success' });
          fetchData();
        } else {
          throw new Error('Delete failed');
        }
      } catch (error) {
        console.error('Error deleting task:', error);
        setToast({ message: 'حدث خطأ أثناء حذف المهمة', type: 'error' });
      } finally {
        setDeleteId(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let res;
      if (editId) {
        res = await fetch(`/api/tasks/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTask)
        });
      } else {
        res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...newTask, created_by: user })
        });
      }

      if (res.ok) {
        setToast({ 
          message: editId ? 'تم تحديث المهمة بنجاح' : 'تم إضافة المهمة بنجاح', 
          type: 'success' 
        });
        setIsModalOpen(false);
        setNewTask({ title: '', project_id: '', assigned_to: '', supervisor_id: '', priority: 'medium', due_date: '', description: '', service_name: '', service_price: '', pieces_count: 1, project_item_id: '', participating_trainees: [] });
        setEditId(null);
        fetchData();
      } else {
        throw new Error('Operation failed');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      setToast({ message: 'حدث خطأ أثناء حفظ المهمة', type: 'error' });
    }
  };

  const handleCopy = (task: any) => {
    let parsedTrainees = [];
    try {
      if (task.participating_trainees) {
        parsedTrainees = JSON.parse(task.participating_trainees);
      }
    } catch (e) {}

    setNewTask({
      title: `${task.title} (نسخة)`,
      project_id: task.project_id || '',
      assigned_to: task.assigned_to || '',
      supervisor_id: task.supervisor_id || '',
      priority: task.priority || 'medium',
      due_date: task.due_date || '',
      description: task.description || '',
      service_name: task.service_name || '',
      service_price: task.service_price || '',
      pieces_count: task.pieces_count || 1,
      project_item_id: task.project_item_id || '',
      participating_trainees: parsedTrainees
    });
    setEditId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (task: any) => {
    let parsedTrainees = [];
    try {
      if (task.participating_trainees) {
        parsedTrainees = JSON.parse(task.participating_trainees);
      }
    } catch (e) {}

    setNewTask({
      title: task.title,
      project_id: task.project_id || '',
      assigned_to: task.assigned_to || '',
      supervisor_id: task.supervisor_id || '',
      priority: task.priority,
      due_date: task.due_date || '',
      description: task.description || '',
      service_name: task.service_name || '',
      service_price: task.service_price || '',
      pieces_count: task.pieces_count || 1,
      project_item_id: task.project_item_id || '',
      participating_trainees: parsedTrainees
    });
    setEditId(task.id);
    setIsModalOpen(true);
  };

  const toggleStatus = async (task: any) => {
    let newStatus = 'done';
    if (task.status === 'done') newStatus = 'failed';
    else if (task.status === 'failed') newStatus = 'deferred';
    else if (task.status === 'deferred') newStatus = 'todo';
    
    // Optimistic update
    setTasks(tasks.map((t: any) => t.id === task.id ? { ...t, status: newStatus } : t));

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...task, status: newStatus })
      });

      if (!res.ok) {
        // Revert on failure
        setTasks(tasks.map((t: any) => t.id === task.id ? { ...t, status: task.status } : t));
        throw new Error('Status update failed');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setToast({ message: 'حدث خطأ أثناء تحديث الحالة', type: 'error' });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
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
        <h2 className="text-2xl font-bold text-gray-900">المهام</h2>
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
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            مهمة جديدة
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">المشروع</label>
          <select 
            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm"
            value={filterProject}
            onChange={e => setFilterProject(e.target.value)}
          >
            <option value="all">الكل</option>
            {projects.map((p: any) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">المنفذ</label>
          <select 
            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm"
            value={filterAssignee}
            onChange={e => setFilterAssignee(e.target.value)}
          >
            <option value="all">الكل</option>
            {team.filter((t: any) => t.type === 'member').map((t: any) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">الحالة</label>
          <select 
            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">الكل</option>
            <option value="todo">قيد الانتظار</option>
            <option value="done">مكتملة</option>
            <option value="failed">فاشلة</option>
            <option value="deferred">مؤجلة</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {filteredTasks.map((task: any) => (
            <div key={task.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors group">
              <button 
                onClick={() => toggleStatus(task)}
                className={cn(
                  "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                  task.status === 'done' ? "bg-green-500 border-green-500 text-white" :
                  task.status === 'failed' ? "bg-red-500 border-red-500 text-white" :
                  task.status === 'deferred' ? "bg-orange-500 border-orange-500 text-white" :
                  "border-gray-300 text-transparent hover:border-indigo-500"
                )}
              >
                {task.status === 'done' && <CheckCircle className="w-4 h-4" />}
                {task.status === 'failed' && <X className="w-4 h-4" />}
                {task.status === 'deferred' && <ArrowRight className="w-4 h-4" />}
                {task.status === 'todo' && <CheckCircle className="w-4 h-4 opacity-0" />}
              </button>
              
              <div className="flex-1 min-w-0">
                <h4 className={cn(
                  "text-sm font-medium text-gray-900 truncate",
                  task.status === 'done' && "line-through text-gray-400",
                  task.status === 'failed' && "text-red-600",
                  task.status === 'deferred' && "text-orange-600"
                )}>
                  {task.title}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  {task.project_title && (
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                      {task.project_title}
                    </span>
                  )}
                  {task.assignee_name && (
                    <span>المنفذ: {task.assignee_name}</span>
                  )}
                  {task.supervisor_name && (
                    <span>المسؤول: {task.supervisor_name}</span>
                  )}
                  {(() => {
                    try {
                      if (task.participating_trainees) {
                        const traineeIds = JSON.parse(task.participating_trainees);
                        if (Array.isArray(traineeIds) && traineeIds.length > 0) {
                          const names = traineeIds.map(id => team.find((t: any) => t.id === id)?.name).filter(Boolean).join(', ');
                          if (names) {
                            return <span className="text-gray-500">المتدربين: {names}</span>;
                          }
                        }
                      }
                    } catch(e) {}
                    return null;
                  })()}
                  {task.due_date && (
                    <span>تاريخ: {task.due_date}</span>
                  )}
                  {task.project_item_name && (
                    <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100">
                      القطعة: {task.project_item_name} {task.pieces_count > 1 && `(x${task.pieces_count})`}
                    </span>
                  )}
                  {task.service_name && (
                    <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100">
                      {task.service_name} ({task.service_price} ₪)
                    </span>
                  )}
                  {task.created_by && (
                    <span className="flex items-center gap-1 text-gray-400 mr-auto">
                      <UserCheck className="w-3 h-3" />
                      {task.created_by}
                    </span>
                  )}
                </div>
              </div>

              <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", getPriorityColor(task.priority))}>
                {task.priority === 'high' ? 'عالي' : task.priority === 'medium' ? 'متوسط' : 'منخفض'}
              </span>
              
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleCopy(task)}
                  className="text-gray-400 hover:text-green-500"
                  title="نسخ المهمة"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleEdit(task)}
                  className="text-gray-400 hover:text-indigo-500"
                  title="تعديل المهمة"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(task.id)}
                  className="text-gray-400 hover:text-red-500"
                  title="حذف المهمة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          
          {filteredTasks.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              لا توجد مهام حالياً
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">{editId ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عنوان المهمة</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الوصف / ملاحظات</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none h-24 resize-none"
                  value={newTask.description}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                  placeholder="أضف تفاصيل المهمة هنا..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المشروع</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                  value={newTask.project_id}
                  onChange={e => setNewTask({...newTask, project_id: e.target.value})}
                >
                  <option value="">بدون مشروع</option>
                  {projects.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              {(() => {
                const selectedProject = projects.find((p: any) => p.id.toString() === newTask.project_id);
                if (selectedProject && selectedProject.category === 'piecework' && projectItems.length > 0) {
                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">القطعة</label>
                        <select 
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                          value={newTask.project_item_id}
                          onChange={e => setNewTask({...newTask, project_item_id: e.target.value})}
                        >
                          <option value="">اختر القطعة</option>
                          {projectItems.map((item: any) => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">عدد القطع</label>
                        <input 
                          type="number" 
                          min="1"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                          value={newTask.pieces_count}
                          onChange={e => setNewTask({...newTask, pieces_count: parseInt(e.target.value) || 1})}
                        />
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المسؤول عن المهمة</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                    value={newTask.supervisor_id}
                    onChange={e => setNewTask({...newTask, supervisor_id: e.target.value})}
                  >
                    <option value="">غير محدد</option>
                    {team.filter((t: any) => t.type === 'admin').map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المنفذ</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                    value={newTask.assigned_to}
                    onChange={e => {
                      setNewTask({...newTask, assigned_to: e.target.value, service_name: '', service_price: ''});
                    }}
                  >
                    <option value="">غير محدد</option>
                    {team.filter((t: any) => t.type === 'member').map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المتدربين المشاركين</label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-32 overflow-y-auto space-y-2">
                  {team.filter((t: any) => t.type?.startsWith('trainee_')).map((t: any) => (
                    <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                        checked={newTask.participating_trainees.includes(t.id)}
                        onChange={(e) => {
                          const newTrainees = e.target.checked 
                            ? [...newTask.participating_trainees, t.id]
                            : newTask.participating_trainees.filter((id: number) => id !== t.id);
                          setNewTask({...newTask, participating_trainees: newTrainees});
                        }}
                      />
                      <span className="text-sm text-gray-700">{t.name}</span>
                    </label>
                  ))}
                  {team.filter((t: any) => t.type?.startsWith('trainee_')).length === 0 && (
                    <span className="text-sm text-gray-500">لا يوجد متدربين متاحين</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الأولوية</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                  value={newTask.priority}
                  onChange={e => setNewTask({...newTask, priority: e.target.value})}
                >
                  <option value="low">منخفض</option>
                  <option value="medium">متوسط</option>
                  <option value="high">عالي</option>
                </select>
              </div>

              {(() => {
                const selectedMember = team.find((t: any) => t.id.toString() === newTask.assigned_to);
                if (selectedMember && selectedMember.contract_type === 'piecework') {
                  let parsedServices = [];
                  try {
                    if (selectedMember.services) {
                      parsedServices = JSON.parse(selectedMember.services);
                    }
                  } catch (e) {}

                  if (parsedServices.length > 0) {
                    return (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">الخدمة المطلوبة</label>
                        <select 
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                          value={newTask.service_name}
                          onChange={e => {
                            const service = parsedServices.find((s: any) => s.name === e.target.value);
                            setNewTask({
                              ...newTask, 
                              service_name: e.target.value,
                              service_price: service ? service.price : ''
                            });
                          }}
                        >
                          <option value="">اختر الخدمة</option>
                          {parsedServices.map((s: any, idx: number) => (
                            <option key={idx} value={s.name}>{s.name} - {s.price} ₪</option>
                          ))}
                        </select>
                      </div>
                    );
                  }
                }
                return null;
              })()}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الاستحقاق</label>
                <input 
                  type="date" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                  value={newTask.due_date}
                  onChange={e => setNewTask({...newTask, due_date: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setNewTask({ title: '', project_id: '', assigned_to: '', supervisor_id: '', priority: 'medium', due_date: '', description: '', service_name: '', service_price: '', pieces_count: 1, project_item_id: '', participating_trainees: [] });
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

      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="حذف المهمة"
        message="هل أنت متأكد من حذف هذه المهمة؟ لا يمكن التراجع عن هذا الإجراء."
      />
    </div>
  );
}
