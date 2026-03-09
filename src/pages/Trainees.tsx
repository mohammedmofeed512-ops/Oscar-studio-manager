import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, RefreshCw, GraduationCap, ArrowUpCircle, Star } from 'lucide-react';
import ConfirmationModal from '@/components/ConfirmationModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import Toast from '@/components/Toast';
import Avatar from '@/components/Avatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { firestoreService } from '@/services/firestoreService';

export default function Trainees() {
  const { userId } = useAuth();
  const [trainees, setTrainees] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'evaluations'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrainee, setEditingTrainee] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Evaluation State
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [evaluatingTrainee, setEvaluatingTrainee] = useState<any>(null);
  const [evaluationData, setEvaluationData] = useState({
    month: new Date().toISOString().slice(0, 7),
    discipline_score: 0,
    punctuality_score: 0,
    technical_score: 0,
    productivity_score: 0,
    teamwork_score: 0,
    belonging_score: 0,
    notes: ''
  });

  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [rewardingTrainee, setRewardingTrainee] = useState<any>(null);
  const [rewardAmount, setRewardAmount] = useState('');

  const handleOpenRewardModal = (trainee: any) => {
    setRewardingTrainee(trainee);
    setRewardAmount('');
    setIsRewardModalOpen(true);
  };

  const handleRewardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardingTrainee) return;

    try {
      const currentReward = Number(rewardingTrainee.reward || 0);
      const newReward = currentReward + Number(rewardAmount);
      
      await firestoreService.update('team', rewardingTrainee.id, {
        reward: newReward
      });

      setToast({ message: 'تم إضافة المكافأة بنجاح', type: 'success' });
      setIsRewardModalOpen(false);
      setRewardingTrainee(null);
    } catch (error) {
      console.error('Error adding reward:', error);
      setToast({ message: 'حدث خطأ أثناء إضافة المكافأة', type: 'error' });
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    phone: '',
    type: 'trainee_3', // trainee_3, trainee_2, trainee_1
    password: '',
    description: '',
    reward: ''
  });

  useEffect(() => {
    const unsubscribeTeam = firestoreService.subscribe('team', (data) => {
      const members = data.filter((m: any) => m.type && m.type.startsWith('trainee_'));
      setTrainees(members);
      setIsLoading(false);
    });

    const unsubscribeEvals = firestoreService.subscribe('trainee_evaluations', (data) => {
      setEvaluations(data);
    });

    return () => {
      unsubscribeTeam();
      unsubscribeEvals();
    };
  }, []);

  const fetchTrainees = async () => {
    // Handled by subscribe
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTrainees();
    setIsRefreshing(false);
  };

  const handleOpenModal = (trainee?: any) => {
    if (trainee) {
      setEditingTrainee(trainee);
      let parsedServices = [];
      try {
        if (trainee.services) {
          parsedServices = JSON.parse(trainee.services);
        }
      } catch (e) {
        console.error('Error parsing services', e);
      }
      setFormData({
        name: trainee.name,
        role: trainee.role,
        phone: trainee.phone,
        type: trainee.type || 'trainee_3',
        password: trainee.password || '',
        description: trainee.description || '',
        reward: trainee.reward || ''
      });
    } else {
      setEditingTrainee(null);
      setFormData({ name: '', role: '', phone: '', type: 'trainee_3', password: '', description: '', reward: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTrainee) {
        await firestoreService.update('team', editingTrainee.id, formData);
      } else {
        await firestoreService.add('team', formData);
      }

      setToast({ 
        message: editingTrainee ? 'تم تحديث بيانات المتدرب بنجاح' : 'تم إضافة المتدرب بنجاح', 
        type: 'success' 
      });
      setIsModalOpen(false);
      setFormData({ name: '', role: '', phone: '', type: 'trainee_3', password: '', description: '', reward: '' });
      setEditingTrainee(null);
    } catch (error) {
      console.error('Error saving trainee:', error);
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
        setToast({ message: 'تم حذف المتدرب بنجاح', type: 'success' });
      } catch (error) {
        console.error('Error deleting trainee:', error);
        setToast({ message: 'حدث خطأ أثناء حذف المتدرب', type: 'error' });
      } finally {
        setDeleteId(null);
      }
    }
  };

  const promoteTrainee = async (trainee: any) => {
    let nextType = '';
    let successMessage = '';
    
    if (trainee.type === 'trainee_3') {
      nextType = 'trainee_2';
      successMessage = 'تمت ترقية المتدرب إلى المستوى الثاني';
    } else if (trainee.type === 'trainee_2') {
      nextType = 'trainee_1';
      successMessage = 'تمت ترقية المتدرب إلى المستوى الأول';
    } else if (trainee.type === 'trainee_1') {
      nextType = 'member';
      successMessage = 'تمت ترقية المتدرب إلى موظف بنجاح!';
    } else {
      return;
    }

    try {
      await firestoreService.update('team', trainee.id, { type: nextType });
      setToast({ message: successMessage, type: 'success' });
    } catch (error) {
      console.error('Error promoting trainee:', error);
      setToast({ message: 'حدث خطأ أثناء ترقية المتدرب', type: 'error' });
    }
  };

  const handleOpenEvaluationModal = (trainee: any) => {
    setEvaluatingTrainee(trainee);
    setEvaluationData({
      month: new Date().toISOString().slice(0, 7),
      discipline_score: 0,
      punctuality_score: 0,
      technical_score: 0,
      productivity_score: 0,
      teamwork_score: 0,
      belonging_score: 0,
      notes: ''
    });
    setIsEvaluationModalOpen(true);
  };

  const handleEvaluationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingTrainee) return;

    try {
      await firestoreService.add('trainee_evaluations', {
        ...evaluationData,
        trainee_id: evaluatingTrainee.id,
        trainee_name: evaluatingTrainee.name,
        evaluator_id: userId,
        created_at: new Date().toISOString()
      });

      setToast({ message: 'تم حفظ التقييم بنجاح', type: 'success' });
      setIsEvaluationModalOpen(false);
      setEvaluatingTrainee(null);
    } catch (error) {
      console.error('Error saving evaluation:', error);
      setToast({ message: 'حدث خطأ أثناء حفظ التقييم', type: 'error' });
    }
  };

  const getLevelLabel = (type: string) => {
    switch (type) {
      case 'trainee_3': return 'مستوى ثالث';
      case 'trainee_2': return 'مستوى ثاني';
      case 'trainee_1': return 'مستوى أول';
      default: return 'متدرب';
    }
  };

  const getLevelColor = (type: string) => {
    switch (type) {
      case 'trainee_3': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'trainee_2': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'trainee_1': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
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
          <GraduationCap className="w-6 h-6 text-indigo-600" />
          المتدربين
        </h2>
        <div className="flex gap-2">
          <div className="bg-gray-100 p-1 rounded-lg flex gap-1 ml-4">
            <button 
              onClick={() => setViewMode('list')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              القائمة
            </button>
            <button 
              onClick={() => setViewMode('evaluations')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'evaluations' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              التقييمات
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
            إضافة متدرب
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainees.map((trainee: any) => {
            const traineeEvals = evaluations.filter((ev: any) => ev.trainee_id === trainee.id);
            const latestEval = traineeEvals.length > 0 ? traineeEvals[0] : null;
            let latestScore = 0;
            if (latestEval) {
              latestScore = (
                latestEval.discipline_score + 
                latestEval.punctuality_score + 
                latestEval.technical_score + 
                latestEval.productivity_score + 
                latestEval.teamwork_score + 
                latestEval.belonging_score
              ) / 6;
            }

            return (
              <div key={trainee.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:border-indigo-200 transition-colors">
                <Avatar 
                  icon={trainee.avatar_icon} 
                  color={trainee.avatar} 
                  size="lg"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    {trainee.name}
                    <span className={cn("px-2 py-0.5 text-[10px] rounded-full border", getLevelColor(trainee.type))}>
                      {getLevelLabel(trainee.type)}
                    </span>
                  </h3>
                  <p className="text-sm text-indigo-600 mt-1">{trainee.role || 'متدرب'}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">{trainee.phone}</p>
                    {latestEval && (
                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-100">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span className="text-xs font-bold text-yellow-700">{latestScore.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  
                  {trainee.reward > 0 && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-100">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-yellow-600 font-medium uppercase tracking-wider">المكافآت</span>
                        <span className="text-sm font-bold text-yellow-700">{trainee.reward} ₪</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 flex gap-2">
                    <button 
                      onClick={() => handleOpenRewardModal(trainee)}
                      className="flex-1 flex items-center justify-center gap-1 bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-yellow-100 transition-colors"
                    >
                      <Star className="w-3.5 h-3.5" />
                      مكافأة
                    </button>
                    <button 
                      onClick={() => promoteTrainee(trainee)}
                      className="flex-1 flex items-center justify-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors"
                    >
                      <ArrowUpCircle className="w-3.5 h-3.5" />
                      {trainee.type === 'trainee_1' ? 'ترقية لموظف' : 'ترقية للمستوى التالي'}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleOpenEvaluationModal(trainee)}
                    className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-md transition-colors"
                    title="تقييم"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleOpenModal(trainee)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    title="تعديل"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(trainee.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {trainees.length === 0 && (
            <div className="col-span-full p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-500 text-sm">لا يوجد متدربين حالياً</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {evaluations.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {evaluations.map((ev: any) => {
                const avgScore = (
                  ev.discipline_score + 
                  ev.punctuality_score + 
                  ev.technical_score + 
                  ev.productivity_score + 
                  ev.teamwork_score + 
                  ev.belonging_score
                ) / 6;

                return (
                  <div key={ev.id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-gray-900">{ev.trainee_name}</h3>
                          <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {ev.month}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          المُقيِّم: {ev.evaluator_name} • تاريخ التقييم: {new Date(ev.created_at).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="font-bold text-yellow-700">{avgScore.toFixed(1)} / 5.0</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <ScoreItem label="مستوى الانضباط الإداري" score={ev.discipline_score} />
                      <ScoreItem label="الالتزام بالمواعيد" score={ev.punctuality_score} />
                      <ScoreItem label="تطور المعرفة التقنية" score={ev.technical_score} />
                      <ScoreItem label="زيادة الإنتاجية" score={ev.productivity_score} />
                      <ScoreItem label="العمل الجماعي" score={ev.teamwork_score} />
                      <ScoreItem label="الانتماء للفريق" score={ev.belonging_score} />
                    </div>

                    {ev.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100 italic text-sm text-gray-600">
                        " {ev.notes} "
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-1">لا توجد تقييمات</p>
              <p>لم يتم تسجيل أي تقييمات للمتدربين حتى الآن</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Trainee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">
              {editingTrainee ? 'تعديل بيانات المتدرب' : 'إضافة متدرب جديد'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">الدور الوظيفي / التخصص</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">المستوى</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option value="trainee_3">مستوى ثالث</option>
                  <option value="trainee_2">مستوى ثاني</option>
                  <option value="trainee_1">مستوى أول</option>
                </select>
              </div>

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
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
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
        title="حذف المتدرب"
        message="هل أنت متأكد من حذف هذا المتدرب؟ لا يمكن التراجع عن هذا الإجراء."
      />

      {/* Reward Modal */}
      {isRewardModalOpen && rewardingTrainee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              إضافة مكافأة للمتدرب
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              سيتم إضافة هذه المكافأة إلى رصيد المتدرب {rewardingTrainee.name} وإرسال إشعار بذلك.
            </p>
            <form onSubmit={handleRewardSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">قيمة المكافأة (شيكل)</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-yellow-500"
                  value={rewardAmount}
                  onChange={e => setRewardAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsRewardModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium"
                >
                  تأكيد المكافأة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evaluation Modal */}
      {isEvaluationModalOpen && evaluatingTrainee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-500" />
                تقييم المتدرب: {evaluatingTrainee.name}
              </h3>
              <button 
                onClick={() => setIsEvaluationModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEvaluationSubmit} className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-bold text-gray-700 mb-2">شهر التقييم</label>
                <input 
                  type="month" 
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={evaluationData.month}
                  onChange={e => setEvaluationData({...evaluationData, month: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <EvaluationField 
                  label="مستوى الانضباط الإداري" 
                  value={evaluationData.discipline_score}
                  onChange={(val) => setEvaluationData({...evaluationData, discipline_score: val})}
                />
                <EvaluationField 
                  label="الالتزام بالمواعيد" 
                  value={evaluationData.punctuality_score}
                  onChange={(val) => setEvaluationData({...evaluationData, punctuality_score: val})}
                />
                <EvaluationField 
                  label="تطور المعرفة التقنية" 
                  value={evaluationData.technical_score}
                  onChange={(val) => setEvaluationData({...evaluationData, technical_score: val})}
                />
                <EvaluationField 
                  label="زيادة الإنتاجية" 
                  value={evaluationData.productivity_score}
                  onChange={(val) => setEvaluationData({...evaluationData, productivity_score: val})}
                />
                <EvaluationField 
                  label="العمل الجماعي" 
                  value={evaluationData.teamwork_score}
                  onChange={(val) => setEvaluationData({...evaluationData, teamwork_score: val})}
                />
                <EvaluationField 
                  label="الانتماء للفريق" 
                  value={evaluationData.belonging_score}
                  onChange={(val) => setEvaluationData({...evaluationData, belonging_score: val})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">ملاحظات التقييم</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={4}
                  placeholder="أضف أي ملاحظات إضافية حول أداء المتدرب..."
                  value={evaluationData.notes}
                  onChange={e => setEvaluationData({...evaluationData, notes: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsEvaluationModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2"
                >
                  <Star className="w-4 h-4" />
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

function ScoreItem({ label, score }: { label: string, score: number }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <div 
            key={s} 
            className={cn(
              "w-3 h-3 rounded-full transition-colors",
              score >= s ? "bg-yellow-400 shadow-sm" : "bg-gray-200"
            )}
          />
        ))}
      </div>
    </div>
  );
}

function EvaluationField({ label, value, onChange }: { label: string, value: number, onChange: (val: number) => void }) {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <label className="text-sm font-bold text-gray-700">{label}</label>
        <span className="text-lg font-bold text-indigo-600">{value}/5</span>
      </div>
      <div className="flex justify-between gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={cn(
              "flex-1 py-2 rounded-md text-sm font-medium transition-all",
              value >= score 
                ? "bg-yellow-400 text-yellow-900 shadow-inner" 
                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
            )}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  );
}
