import React, { useState, useEffect } from 'react';
import { useAuth, MANAGERS } from '../context/AuthContext';
import { UserCircle, Users, GraduationCap, Handshake } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [loginType, setLoginType] = useState<'admin' | 'team' | 'trainee' | 'partner'>('admin');
  const [selectedManager, setSelectedManager] = useState('');
  const [selectedTeamMember, setSelectedTeamMember] = useState('');
  const [selectedTrainee, setSelectedTrainee] = useState('');
  const [selectedPartner, setSelectedPartner] = useState('');
  const [password, setPassword] = useState('');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [trainees, setTrainees] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch('/api/team')
      .then(res => res.json())
      .then(data => {
        const adminList = data.filter((m: any) => m.type === 'admin');
        const memberList = data.filter((m: any) => m.type === 'member');
        const traineeList = data.filter((m: any) => m.type && m.type.startsWith('trainee_'));
        const partnerList = data.filter((m: any) => m.type === 'partner');
        
        setAdmins(adminList);
        setTeamMembers(memberList);
        setTrainees(traineeList);
        setPartners(partnerList);

        if (adminList.length > 0) setSelectedManager(adminList[0].name);
        if (memberList.length > 0) setSelectedTeamMember(memberList[0].id);
        if (traineeList.length > 0) setSelectedTrainee(traineeList[0].id);
        if (partnerList.length > 0) setSelectedPartner(partnerList[0].id);
      })
      .catch(err => console.error('Error fetching team:', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (loginType === 'admin' && !selectedManager) {
        setError('يرجى اختيار مدير');
        setIsLoading(false);
        return;
      }
      if (loginType === 'team' && !selectedTeamMember) {
        setError('يرجى اختيار عضو فريق');
        setIsLoading(false);
        return;
      }
      if (loginType === 'trainee' && !selectedTrainee) {
        setError('يرجى اختيار متدرب');
        setIsLoading(false);
        return;
      }
      if (loginType === 'partner' && !selectedPartner) {
        setError('يرجى اختيار شريك');
        setIsLoading(false);
        return;
      }

      let payload;
      if (loginType === 'admin') {
        payload = { username: selectedManager, password, type: 'admin' };
      } else if (loginType === 'team') {
        payload = { id: selectedTeamMember, password, type: 'team' };
      } else if (loginType === 'partner') {
        payload = { id: selectedPartner, password, type: 'partner' };
      } else {
        payload = { id: selectedTrainee, password, type: 'trainee' };
      }

      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (loginType === 'admin') {
          login(data.user.name, 'admin', data.user.id);
        } else if (loginType === 'team') {
          login(data.user.name, 'team', data.user.id);
        } else if (loginType === 'partner') {
          login(data.user.name, 'partner', data.user.id);
        } else {
          login(data.user.name, 'trainee', data.user.id);
        }
      } else {
        setError(data.error || 'فشل تسجيل الدخول');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {loginType === 'admin' ? (
              <UserCircle className="w-10 h-10 text-indigo-600" />
            ) : loginType === 'team' ? (
              <Users className="w-10 h-10 text-indigo-600" />
            ) : loginType === 'partner' ? (
              <Handshake className="w-10 h-10 text-indigo-600" />
            ) : (
              <GraduationCap className="w-10 h-10 text-indigo-600" />
            )}
          </div>
          <h2 className="text-xl font-bold text-indigo-600 mb-2">أهلاً بك 👋</h2>
          <h1 className="text-2xl font-bold text-gray-900">تسجيل الدخول</h1>
          <p className="text-gray-500 mt-2">
            {loginType === 'admin' ? 'دخول الإدارة' : loginType === 'team' ? 'دخول فريق العمل' : loginType === 'partner' ? 'دخول الشركاء' : 'دخول المتدربين'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
          <button
            onClick={() => setLoginType('admin')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              loginType === 'admin' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            الإدارة
          </button>
          <button
            onClick={() => setLoginType('team')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              loginType === 'team' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            الفريق
          </button>
          <button
            onClick={() => setLoginType('trainee')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              loginType === 'trainee' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            متدرب
          </button>
          <button
            onClick={() => setLoginType('partner')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              loginType === 'partner' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            شريك
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {loginType === 'admin' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم المدير
              </label>
              <select
                value={selectedManager}
                onChange={(e) => setSelectedManager(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {admins.length > 0 ? (
                  admins.map((admin) => (
                    <option key={admin.id} value={admin.name}>
                      {admin.name}
                    </option>
                  ))
                ) : (
                  MANAGERS.map((manager) => (
                    <option key={manager} value={manager}>
                      {manager}
                    </option>
                  ))
                )}
              </select>
            </div>
          ) : loginType === 'team' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم العضو
              </label>
              <select
                value={selectedTeamMember}
                onChange={(e) => setSelectedTeamMember(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          ) : loginType === 'partner' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم الشريك
              </label>
              <select
                value={selectedPartner}
                onChange={(e) => setSelectedPartner(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {partners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم المتدرب
              </label>
              <select
                value={selectedTrainee}
                onChange={(e) => setSelectedTrainee(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {trainees.map((trainee) => (
                  <option key={trainee.id} value={trainee.id}>
                    {trainee.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="أدخل كلمة المرور"
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'جاري التحقق...' : 'دخول'}
          </button>
        </form>
      </div>
    </div>
  );
}
