import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle, Clock, AlertCircle, Calendar, Briefcase, CheckSquare, Star, TrendingUp, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import { format } from 'date-fns';

export default function TeamDashboard() {
  const { user, userId, role } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchData();
      fetchProfile();
    }
  }, [userId, role]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/team/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const evaluationEndpoint = role === 'trainee' 
        ? `/api/trainee-evaluations/${userId}` 
        : `/api/evaluations/${userId}`;

      const [tasksRes, projectsRes, evaluationsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/projects'),
        fetch(evaluationEndpoint)
      ]);
      
      const allTasks = await tasksRes.json();
      const allProjects = await projectsRes.json();
      const myEvaluations = await evaluationsRes.json();

      setEvaluations(myEvaluations);

      // Filter tasks for the logged-in user
      const myTasks = allTasks.filter((t: any) => {
        if (t.assigned_to === userId) return true;
        try {
          if (t.participating_trainees) {
            const trainees = JSON.parse(t.participating_trainees);
            if (Array.isArray(trainees) && trainees.includes(userId)) {
              return true;
            }
          }
        } catch(e) {}
        return false;
      });
      setTasks(myTasks);

      // Filter projects the user is involved in (has tasks in)
      const myProjectIds = new Set(myTasks.map((t: any) => t.project_id).filter(Boolean));
      const myProjects = allProjects.filter((p: any) => myProjectIds.has(p.id));
      setProjects(myProjects);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTaskStatus = async (task: any) => {
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
      }
    } catch (error) {
      console.error('Error updating task:', error);
      // Revert on failure
      setTasks(tasks.map((t: any) => t.id === task.id ? { ...t, status: task.status } : t));
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

  if (isLoading) return <LoadingSpinner />;

  const pendingTasks = tasks.filter((t: any) => t.status !== 'done').length;
  const completedTasks = tasks.filter((t: any) => t.status === 'done').length;

  const getLevelLabel = (type: string) => {
    switch (type) {
      case 'trainee_3': return 'مستوى ثالث';
      case 'trainee_2': return 'مستوى ثاني';
      case 'trainee_1': return 'مستوى أول';
      default: return 'متدرب';
    }
  };

  return (
    <div className="space-y-8">
      {profile && profile.reward > 0 && role !== 'trainee' && (
        <div className="bg-gradient-to-r from-yellow-500 to-amber-600 p-6 rounded-xl text-white shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <Star className="w-8 h-8 text-white fill-current" />
            </div>
            <div>
              <h3 className="text-xl font-bold">مكافأة مستحقة!</h3>
              <p className="text-yellow-100 mt-1">لقد حصلت على مكافأة لجهودك المتميزة.</p>
            </div>
          </div>
          <div className="text-3xl font-bold">{profile.reward} ₪</div>
        </div>
      )}

      {role === 'trainee' && profile && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">مستواك التدريبي الحالي</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-white text-indigo-600 px-3 py-1 rounded-full text-sm font-bold">
                  {getLevelLabel(profile.type)}
                </span>
                <span className="text-indigo-100 text-sm">
                  {profile.type === 'trainee_1' ? 'أنت على وشك الترقية لموظف!' : 'استمر في التميز للوصول للمستوى التالي'}
                </span>
              </div>
            </div>
          </div>
          
          {profile.description && (
            <div className="mt-4 p-3 bg-white/10 rounded-lg border border-white/20 text-sm italic">
              <p className="text-indigo-100 text-xs mb-1 font-bold uppercase tracking-wider">ملاحظات الإدارة:</p>
              " {profile.description} "
            </div>
          )}
          
          {profile.reward > 0 && (
            <div className="mt-4 p-4 bg-yellow-500/20 rounded-lg border border-yellow-400/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-300" />
                <span className="font-bold text-yellow-100">المكافآت المستحقة:</span>
              </div>
              <span className="text-xl font-bold text-yellow-300">{profile.reward} ₪</span>
            </div>
          )}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">مرحباً، {user} 👋</h1>
        <p className="text-gray-500">إليك نظرة عامة على مهامك ومشاريعك الحالية</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white rounded-full text-indigo-600">
                <CheckSquare className="w-5 h-5" />
              </div>
              <span className="font-medium text-indigo-900">المهام المتبقية</span>
            </div>
            <p className="text-2xl font-bold text-indigo-700">{pendingTasks}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white rounded-full text-green-600">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="font-medium text-green-900">المهام المنجزة</span>
            </div>
            <p className="text-2xl font-bold text-green-700">{completedTasks}</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white rounded-full text-purple-600">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="font-medium text-purple-900">المشاريع النشطة</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">{projects.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tasks List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            مهامي
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {tasks.length > 0 ? (
                tasks.map((task: any) => (
                  <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <button 
                        onClick={() => toggleTaskStatus(task)}
                        className={cn(
                          "mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                          task.status === 'done' ? "bg-green-500 border-green-500 text-white" :
                          task.status === 'failed' ? "bg-red-500 border-red-500 text-white" :
                          task.status === 'deferred' ? "bg-orange-500 border-orange-500 text-white" :
                          "border-gray-300 text-transparent hover:border-indigo-500"
                        )}
                      >
                        <CheckCircle className="w-3 h-3" />
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className={cn(
                            "font-medium text-gray-900",
                            task.status === 'done' && "line-through text-gray-400"
                          )}>
                            {task.title}
                          </h3>
                          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", getPriorityColor(task.priority))}>
                            {task.priority === 'high' ? 'عالي' : task.priority === 'medium' ? 'متوسط' : 'منخفض'}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                        
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          {task.project_title && (
                            <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                              {task.project_title}
                            </span>
                          )}
                          {task.service_name && (
                            <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100">
                              {task.service_name} ({task.service_price} ₪)
                            </span>
                          )}
                          {task.due_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {task.due_date}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  لا توجد مهام مسندة إليك حالياً
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Evaluations Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              تقييمات الأداء
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {evaluations.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {evaluations.map((ev: any) => {
                    const isTrainee = role === 'trainee';
                    const avgScore = isTrainee ? (
                      ev.discipline_score + 
                      ev.punctuality_score + 
                      ev.technical_score + 
                      ev.productivity_score + 
                      ev.teamwork_score + 
                      ev.belonging_score
                    ) / 6 : (
                      ev.attendance_score + 
                      ev.deadline_score + 
                      ev.policy_score + 
                      ev.teamwork_score + 
                      ev.development_score + 
                      ev.property_score
                    ) / 6;

                    return (
                      <div key={ev.id} className="p-6">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <span className="text-sm font-bold text-gray-900">{ev.month}</span>
                            <p className="text-xs text-gray-400 mt-1">
                              تاريخ التقييم: {format(new Date(ev.created_at), 'yyyy-MM-dd')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="font-bold text-yellow-700">{avgScore.toFixed(1)} / 5.0</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                          {isTrainee ? (
                            <>
                              <ScoreItem label="مستوى الانضباط الإداري" score={ev.discipline_score} />
                              <ScoreItem label="الالتزام بالمواعيد" score={ev.punctuality_score} />
                              <ScoreItem label="تطور المعرفة التقنية" score={ev.technical_score} />
                              <ScoreItem label="زيادة الإنتاجية" score={ev.productivity_score} />
                              <ScoreItem label="العمل الجماعي" score={ev.teamwork_score} />
                              <ScoreItem label="الانتماء للفريق" score={ev.belonging_score} />
                            </>
                          ) : (
                            <>
                              <ScoreItem label="الالتزام بالحضور" score={ev.attendance_score} />
                              <ScoreItem label="إنجاز المشاريع" score={ev.deadline_score} />
                              <ScoreItem label="احترام اللوائح" score={ev.policy_score} />
                              <ScoreItem label="العمل الجماعي" score={ev.teamwork_score} />
                              <ScoreItem label="التطوير" score={ev.development_score} />
                              <ScoreItem label="الحفاظ على الممتلكات" score={ev.property_score} />
                            </>
                          )}
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
                <div className="p-8 text-center text-gray-500">
                  لم يتم تسجيل أي تقييمات لك بعد
                </div>
              )}
            </div>
          </div>

          {/* Projects List */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              مشاريعي
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-100">
                {projects.length > 0 ? (
                  projects.map((project: any) => (
                    <div key={project.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-900">{project.title}</h3>
                        <span className={cn(
                          "text-xs font-medium px-2 py-1 rounded",
                          project.status === 'completed' ? "bg-green-50 text-green-700" :
                          project.status === 'in_progress' ? "bg-blue-50 text-blue-700" :
                          "bg-yellow-50 text-yellow-700"
                        )}>
                          {project.status === 'completed' ? 'مكتمل' :
                           project.status === 'in_progress' ? 'جاري العمل' : 'قيد الانتظار'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{project.client}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        <span>{project.date}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    لست مشاركاً في أي مشاريع حالياً
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreItem({ label, score }: { label: string, score: number }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <div 
            key={s} 
            className={cn(
              "w-2 h-2 rounded-full",
              score >= s ? "bg-yellow-400" : "bg-gray-200"
            )}
          />
        ))}
      </div>
    </div>
  );
}
