import React, { useState, useEffect } from 'react';
import { Plus, Trash2, User, Edit2, BarChart2, List, ClipboardCheck, Star, RefreshCw } from 'lucide-react';
import ConfirmationModal from '@/components/ConfirmationModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import Toast from '@/components/Toast';
import Avatar from '@/components/Avatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

export default function Team() {
  const { userId } = useAuth();
  const [team, setTeam] = useState([]);
  const [stats, setStats] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [viewMode, setViewMode] = useState<'list' | 'performance' | 'evaluations'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Evaluation State
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [evaluatingMember, setEvaluatingMember] = useState<any>(null);
  const [evaluationData, setEvaluationData] = useState({
    month: format(new Date(), 'yyyy-MM'),
    attendance_score: 0,
    deadline_score: 0,
    policy_score: 0,
    teamwork_score: 0,
    development_score: 0,
    property_score: 0,
    notes: ''
  });

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    phone: '',
    type: 'member',
    contract_type: 'piecework',
    salary: '',
    piece_name: '',
    piece_price: '',
    services: [] as { name: string; price: string }[],
    password: '',
    reward: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchTeam(), fetchStats(), fetchEvaluations()]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setToast({ message: 'حدث خطأ أثناء تحميل البيانات', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeam = async () => {
    const res = await fetch('/api/team');
    const data = await res.json();
    const members = (Array.isArray(data) ? data : []).filter((m: any) => m.type === 'member');
    setTeam(members);
  };

  const fetchStats = async () => {
    const res = await fetch('/api/team-stats');
    const data = await res.json();
    setStats(Array.isArray(data) ? data.filter((s: any) => s.type === 'member') : []);
  };

  const fetchEvaluations = async () => {
    try {
      const res = await fetch('/api/evaluations');
      const data = await res.json();
      const evals = Array.isArray(data) ? data : [];
      // We need to filter by employee type, but the API doesn't return employee type.
      // We can filter using the team state since we already fetched it.
      setEvaluations(evals);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
    }
  };

  const handleOpenModal = (member?: any) => {
    if (member) {
      setEditingMember(member);
      let parsedServices = [];
      try {
        if (member.services) {
          parsedServices = JSON.parse(member.services);
        }
      } catch (e) {
        console.error('Error parsing services', e);
      }
      setFormData({
        name: member.name,
        role: member.role,
        phone: member.phone,
        type: member.type || 'member',
        contract_type: member.contract_type || 'piecework',
        salary: member.salary || '',
        piece_name: member.piece_name || '',
        piece_price: member.piece_price || '',
        services: parsedServices,
        password: member.password || '',
        reward: member.reward || ''
      });
    } else {
      setEditingMember(null);
      setFormData({ name: '', role: '', phone: '', type: 'member', contract_type: 'piecework', salary: '', piece_name: '', piece_price: '', services: [], password: '', reward: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let res;
      if (editingMember) {
        res = await fetch(`/api/team/${editingMember.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        res = await fetch('/api/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }

      if (res.ok) {
        setToast({ 
          message: editingMember ? 'تم تحديث بيانات العضو بنجاح' : 'تم إضافة العضو بنجاح', 
          type: 'success' 
        });
        setIsModalOpen(false);
        setFormData({ name: '', role: '', phone: '', type: 'member', contract_type: 'piecework', salary: '', piece_name: '', piece_price: '', services: [], password: '', reward: '' });
        setEditingMember(null);
        fetchData();
      } else {
        throw new Error('Operation failed');
      }
    } catch (error) {
      console.error('Error saving member:', error);
      setToast({ message: 'حدث خطأ أثناء حفظ البيانات', type: 'error' });
    }
  };

  const handleOpenEvaluation = (member: any) => {
    setEvaluatingMember(member);
    setEvaluationData({
      month: format(new Date(), 'yyyy-MM'),
      attendance_score: 0,
      deadline_score: 0,
      policy_score: 0,
      teamwork_score: 0,
      development_score: 0,
      property_score: 0,
      notes: ''
    });
    setIsEvaluationModalOpen(true);
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingMember) return;

    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...evaluationData,
          employee_id: evaluatingMember.id,
          evaluator_id: userId
        })
      });

      if (res.ok) {
        setToast({ message: 'تم حفظ التقييم بنجاح', type: 'success' });
        setIsEvaluationModalOpen(false);
      } else {
        throw new Error('Failed to save evaluation');
      }
    } catch (error) {
      console.error('Error saving evaluation:', error);
      setToast({ message: 'حدث خطأ أثناء حفظ التقييم', type: 'error' });
    }
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        const res = await fetch(`/api/team/${deleteId}`, { method: 'DELETE' });
        if (res.ok) {
          setToast({ message: 'تم حذف العضو بنجاح', type: 'success' });
          fetchData();
        } else {
          throw new Error('Delete failed');
        }
      } catch (error) {
        console.error('Error deleting member:', error);
        setToast({ message: 'حدث خطأ أثناء حذف العضو', type: 'error' });
      } finally {
        setDeleteId(null);
      }
    }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
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
        <h2 className="text-2xl font-bold text-gray-900">فريق العمل</h2>
        <div className="flex gap-2">
          <div className="bg-gray-100 p-1 rounded-lg flex">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="قائمة الأعضاء"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('performance')}
              className={`p-2 rounded-md transition-all ${viewMode === 'performance' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="لوحة الأداء"
            >
              <BarChart2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('evaluations')}
              className={`p-2 rounded-md transition-all ${viewMode === 'evaluations' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="سجل التقييمات"
            >
              <Star className="w-5 h-5" />
            </button>
          </div>
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
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            إضافة عضو
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-8">
          {/* Contract Employees Section */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
              موظفي العقود
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...team].filter((m: any) => m.contract_type === 'contract').sort((a: any, b: any) => (b.avg_rating || 0) - (a.avg_rating || 0)).map((member: any) => (
                <div key={member.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:border-indigo-200 transition-colors">
                  {member.avg_rating > 0 && (
                    <div className="absolute top-0 left-0 bg-yellow-400 text-white px-2 py-0.5 rounded-br-lg flex items-center gap-1 shadow-sm">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-[10px] font-bold">{member.avg_rating.toFixed(1)}</span>
                    </div>
                  )}
                  <Avatar 
                    icon={member.avatar_icon} 
                    color={member.avatar} 
                    size="lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      {member.name}
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-indigo-100 text-indigo-700">
                        عضو فريق
                      </span>
                    </h3>
                    <p className="text-sm text-indigo-600">{member.role}</p>
                    <p className="text-xs text-gray-500 mt-1">{member.phone}</p>
                    {member.salary && (
                      <p className="text-xs font-semibold text-green-600 mt-1">
                        الراتب: {member.salary} شيكل
                      </p>
                    )}
                    {member.reward > 0 && (
                      <p className="text-xs font-semibold text-yellow-600 mt-1">
                        المكافآت: {member.reward} شيكل
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenEvaluation(member)}
                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                      title="تقييم الأداء"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleOpenModal(member)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(member.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {team.filter((m: any) => m.contract_type === 'contract').length === 0 && (
                <div className="col-span-full p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-gray-500 text-sm">لا يوجد موظفي عقود حالياً</p>
                </div>
              )}
            </div>
          </div>

          {/* Piecework Employees Section */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
              موظفي القطعة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...team].filter((m: any) => m.contract_type !== 'contract').sort((a: any, b: any) => (b.avg_rating || 0) - (a.avg_rating || 0)).map((member: any) => (
                <div key={member.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:border-emerald-200 transition-colors">
                  {member.avg_rating > 0 && (
                    <div className="absolute top-0 left-0 bg-yellow-400 text-white px-2 py-0.5 rounded-br-lg flex items-center gap-1 shadow-sm">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-[10px] font-bold">{member.avg_rating.toFixed(1)}</span>
                    </div>
                  )}
                  <Avatar 
                    icon={member.avatar_icon} 
                    color={member.avatar} 
                    size="lg"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                          {member.name}
                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-700">
                            موظف بالقطعة
                          </span>
                        </h3>
                        <p className="text-sm text-emerald-600 mt-1">{member.role}</p>
                        <p className="text-xs text-gray-500 mt-1">{member.phone}</p>
                      </div>
                    </div>
                    
                    {(() => {
                      let parsedServices = [];
                      try {
                        if (member.services) {
                          parsedServices = JSON.parse(member.services);
                        }
                      } catch (e) {}

                      if (parsedServices.length > 0) {
                        return (
                          <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                            <h4 className="text-[10px] text-emerald-600 font-medium uppercase tracking-wider mb-2">الخدمات والأسعار</h4>
                            <div className="space-y-2">
                              {parsedServices.map((service: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                  <span className="font-semibold text-gray-900">{service.name}</span>
                                  <span className="font-bold text-emerald-700">{service.price} ₪</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      } else if (member.piece_name || member.piece_price) {
                        return (
                          <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                            <div className="flex justify-between items-center">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-emerald-600 font-medium uppercase tracking-wider">اسم القطعة</span>
                                <span className="text-sm font-semibold text-gray-900">{member.piece_name || 'غير محدد'}</span>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-[10px] text-emerald-600 font-medium uppercase tracking-wider">سعر القطعة</span>
                                <span className="text-sm font-bold text-emerald-700">{member.piece_price ? `${member.piece_price} ₪` : '0 ₪'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    {member.reward > 0 && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-100">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-yellow-600 font-medium uppercase tracking-wider">المكافآت</span>
                          <span className="text-sm font-bold text-yellow-700">{member.reward} ₪</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenEvaluation(member)}
                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                      title="تقييم الأداء"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleOpenModal(member)}
                      className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(member.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {team.filter((m: any) => m.contract_type !== 'contract').length === 0 && (
                <div className="col-span-full p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-gray-500 text-sm">لا يوجد موظفي قطعة حالياً</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : viewMode === 'performance' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...stats].sort((a: any, b: any) => (b.avg_rating || 0) - (a.avg_rating || 0)).map((member: any) => {
            const completionRate = member.total_tasks > 0 
              ? Math.round((member.completed_tasks / member.total_tasks) * 100) 
              : 0;
            
            return (
              <div key={member.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                {member.avg_rating > 0 && (
                  <div className="absolute top-0 left-0 bg-yellow-400 text-white px-3 py-1 rounded-br-lg flex items-center gap-1 shadow-sm">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-xs font-bold">{member.avg_rating.toFixed(1)}</span>
                  </div>
                )}
                <div className="flex items-center gap-4 mb-6">
                  <Avatar 
                    icon={member.avatar_icon} 
                    color={member.avatar} 
                    size="lg"
                  />
                  <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      {member.name}
                      <span className={cn(
                        "px-2 py-0.5 text-[10px] rounded-full",
                        member.type === 'admin' 
                          ? "bg-purple-100 text-purple-700" 
                          : "bg-indigo-100 text-indigo-700"
                      )}>
                        {member.type === 'admin' ? 'مدير' : 'عضو فريق'}
                      </span>
                    </h3>
                    <p className="text-sm text-gray-500">{member.role}</p>
                  </div>
                  <div className="mr-auto text-right">
                    <div className="text-2xl font-bold text-indigo-600">{completionRate}%</div>
                    <div className="text-xs text-gray-500">معدل الإنجاز</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">المهام المكتملة</span>
                      <span className="font-medium">{member.completed_tasks} / {member.total_tasks}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${completionRate}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <div className="text-lg font-bold text-gray-900">{member.total_tasks}</div>
                      <div className="text-xs text-gray-500">إجمالي المهام</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <div className="text-lg font-bold text-gray-900">{member.projects_count}</div>
                      <div className="text-xs text-gray-500">المشاريع المشارك بها</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-sm font-bold text-gray-700">الموظف</th>
                  <th className="px-6 py-3 text-sm font-bold text-gray-700">الشهر</th>
                  <th className="px-6 py-3 text-sm font-bold text-gray-700">التقييم العام</th>
                  <th className="px-6 py-3 text-sm font-bold text-gray-700">المقيم</th>
                  <th className="px-6 py-3 text-sm font-bold text-gray-700">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {evaluations.filter((ev: any) => team.some((t: any) => t.id === ev.employee_id)).length > 0 ? (
                  [...evaluations].filter((ev: any) => team.some((t: any) => t.id === ev.employee_id)).sort((a: any, b: any) => {
                    const scoreA = (a.attendance_score + a.deadline_score + a.policy_score + a.teamwork_score + a.development_score + a.property_score) / 6;
                    const scoreB = (b.attendance_score + b.deadline_score + b.policy_score + b.teamwork_score + b.development_score + b.property_score) / 6;
                    return scoreB - scoreA;
                  }).map((ev: any) => {
                    const avgScore = (
                      ev.attendance_score + 
                      ev.deadline_score + 
                      ev.policy_score + 
                      ev.teamwork_score + 
                      ev.development_score + 
                      ev.property_score
                    ) / 6;
                    
                    return (
                      <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{ev.employee_name}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{ev.month}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="font-bold">{avgScore.toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{ev.evaluator_name || 'غير معروف'}</td>
                        <td className="px-6 py-4 text-xs text-gray-400">
                          {ev.created_at ? format(new Date(ev.created_at), 'yyyy-MM-dd') : '-'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      لا توجد تقييمات مسجلة بعد
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">
              {editingMember ? 'تعديل بيانات العضو' : 'إضافة عضو جديد'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الدور الوظيفي</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع التعاقد</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                  value={formData.contract_type}
                  onChange={e => setFormData({...formData, contract_type: e.target.value})}
                >
                  <option value="piecework">موظف بالقطعة</option>
                  <option value="contract">موظف عقود</option>
                </select>
              </div>

              {formData.contract_type === 'contract' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الراتب الشهري</label>
                  <input 
                    type="number" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                    value={formData.salary}
                    onChange={e => setFormData({...formData, salary: e.target.value})}
                  />
                </div>
              ) : (
                <div className="space-y-3 border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">الخدمات والأسعار</label>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, services: [...formData.services, { name: '', price: '' }]})}
                      className="text-xs flex items-center gap-1 text-emerald-600 hover:text-emerald-700"
                    >
                      <Plus className="w-3 h-3" />
                      إضافة خدمة
                    </button>
                  </div>
                  
                  {formData.services.length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-2">لم يتم إضافة خدمات بعد</p>
                  )}

                  {formData.services.map((service, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <input 
                          type="text" 
                          placeholder="اسم الخدمة"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm"
                          value={service.name}
                          onChange={e => {
                            const newServices = [...formData.services];
                            newServices[index].name = e.target.value;
                            setFormData({...formData, services: newServices});
                          }}
                        />
                      </div>
                      <div className="w-24">
                        <input 
                          type="number" 
                          placeholder="السعر"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm"
                          value={service.price}
                          onChange={e => {
                            const newServices = [...formData.services];
                            newServices[index].price = e.target.value;
                            setFormData({...formData, services: newServices});
                          }}
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          const newServices = formData.services.filter((_, i) => i !== index);
                          setFormData({...formData, services: newServices});
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 mt-0.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {formData.contract_type !== 'piecework' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    placeholder="اتركها فارغة لتعيين الافتراضي (123456)"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المكافأة (شيكل)</label>
                <input 
                  type="number" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                  value={formData.reward}
                  onChange={e => setFormData({...formData, reward: e.target.value})}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الوصف / ملاحظات</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              {/* Account Type selection removed as per request to separate Management from Team */}

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
        title="حذف العضو"
        message="هل أنت متأكد من حذف هذا العضو؟ لا يمكن التراجع عن هذا الإجراء."
      />

      {/* Evaluation Modal */}
      {isEvaluationModalOpen && evaluatingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">
                تقييم أداء: {evaluatingMember.name}
              </h3>
              <button 
                onClick={() => setIsEvaluationModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Trash2 className="w-5 h-5 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEvaluation} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">شهر التقييم</label>
                <input 
                  type="month" 
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                  value={evaluationData.month}
                  onChange={e => setEvaluationData({...evaluationData, month: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RatingField 
                  label="الالتزام بالحضور" 
                  value={evaluationData.attendance_score}
                  onChange={(val: number) => setEvaluationData({...evaluationData, attendance_score: val})}
                />
                <RatingField 
                  label="إنجاز المشاريع في وقتها" 
                  value={evaluationData.deadline_score}
                  onChange={(val: number) => setEvaluationData({...evaluationData, deadline_score: val})}
                />
                <RatingField 
                  label="احترام اللوائح والسياسات" 
                  value={evaluationData.policy_score}
                  onChange={(val: number) => setEvaluationData({...evaluationData, policy_score: val})}
                />
                <RatingField 
                  label="العمل الجماعي وروح الفريق" 
                  value={evaluationData.teamwork_score}
                  onChange={(val: number) => setEvaluationData({...evaluationData, teamwork_score: val})}
                />
                <RatingField 
                  label="التطوير وزيادة المستوى" 
                  value={evaluationData.development_score}
                  onChange={(val: number) => setEvaluationData({...evaluationData, development_score: val})}
                />
                <RatingField 
                  label="الحفاظ على ممتلكات الشركة" 
                  value={evaluationData.property_score}
                  onChange={(val: number) => setEvaluationData({...evaluationData, property_score: val})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات إضافية</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                  rows={4}
                  value={evaluationData.notes}
                  onChange={e => setEvaluationData({...evaluationData, notes: e.target.value})}
                  placeholder="أضف أي ملاحظات أو توصيات..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsEvaluationModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  حفظ التقييم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function RatingField({ label, value, onChange }: { label: string, value: number, onChange: (val: number) => void }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <label className="block text-sm font-medium text-gray-900 mb-3">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={cn(
              "p-1 transition-all hover:scale-110",
              value >= star ? "text-yellow-400" : "text-gray-300"
            )}
          >
            <Star className={cn("w-6 h-6", value >= star && "fill-current")} />
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-2 px-1">
        <span>ضعيف</span>
        <span>ممتاز</span>
      </div>
    </div>
  );
}
