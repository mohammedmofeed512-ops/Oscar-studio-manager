import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, Lock, Save, FileText, Palette, Smile, X, Search } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import Toast from '@/components/Toast';
import { cn } from '@/lib/utils';
import Avatar, { ICONS_MAP } from '@/components/Avatar';
import { firestoreService } from '@/services/firestoreService';

const AVATAR_COLORS = [
  'bg-indigo-100 text-indigo-600',
  'bg-red-100 text-red-600',
  'bg-green-100 text-green-600',
  'bg-blue-100 text-blue-600',
  'bg-yellow-100 text-yellow-600',
  'bg-purple-100 text-purple-600',
  'bg-pink-100 text-pink-600',
  'bg-gray-100 text-gray-600',
  'bg-orange-100 text-orange-600',
  'bg-teal-100 text-teal-600',
  'bg-cyan-100 text-cyan-600',
  'bg-lime-100 text-lime-600',
  'bg-emerald-100 text-emerald-600',
  'bg-rose-100 text-rose-600',
  'bg-slate-100 text-slate-600',
];

const EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
  '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
  '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
  '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '👽', '👾', '🤖',
  '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈',
  '🙉', '🙊', '🐵', '🐶', '🐺', '🐱', '🦁', '🐯', '🦒', '🦊',
  '🦝', '🐮', '🐷', '🐗', '🐭', '🐹', '🐰', '🐻', '🐨', '🐼',
  '🐸', '🦓', '🐴', '🦄', '🐔', '🐲', '🐽', '🐾', '🐒', '🦍',
  '🦧', '🦮', '🐕', '🐩', '🐈', '🐅', '🐆', '🐎', '🦌', '🦏',
  '🦛', '🐂', '🐃', '🐄', '🐖', '🐏', '🐑', '🐐', '🐪', '🐫',
  '🦙', '🦘', '🦥', '🦨', '🦡', '🐘', '🐁', '🐀', '🦔', '🐇',
  '🐿', '🦎', '🐊', '🐢', '🐍', '🐉', '🦕', '🦖', '🦦', '🦈',
  '🐬', '🐳', '🐋', '🐟', '🐠', '🐡', '🦐', '🦑', '🐙', '🦞',
  '🦀', '🐚', '🦆', '🐓', '🦃', '🦅', '🕊', '🦢', '🦜', '🦩',
  '🦚', '🦉', '🐦', '🐧', '🐥', '🐤', '🐣', '🦇', '🦋', '🐌',
  '🐛', '🦟', '🦗', '🐜', '🐝', '🐞', '🦂', '🕷', '🕸', '🦠',
  '💐', '🌸', '💮', '🏵', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷',
  '🌱', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘', '🍀', '🍁',
  '🍂', '🍃', '🍄', '🌰', '🌍', '🌎', '🌏', '🌑', '🌒', '🌓',
  '🌔', '🌕', '🌖', '🌗', '🌘', '🌙', '🌚', '🌛', '🌜', '☀',
  '🌝', '🌞', '⭐', '🌟', '🌠', '☁', '⛅', '⛈', '🌤', '🌥',
  '🌦', '🌧', '🌨', '🌩', '🌪', '🌫', '🌬', '🌀', '🌈', '🌂',
  '☂', '☔', '⛱', '⚡', '❄', '☃', '⛄', '☄', '🔥', '💧',
  '🌊', '🎄', '✨', '🎋', '🎍', '🎎', '🎏', '🎐', '🎑', '🧧',
  '🎀', '🎁', '🎗', '🎟', '🎫', '🎖', '🏆', '🏅', '🥇', '🥈',
  '🥉', '⚽', '⚾', '🥎', '🏀', '🏐', '🏈', '🏉', '🎾', '🥏',
  '🎳', '🏏', '🏑', '🏒', '🥍', '🏓', '🏸', '🥊', '🥋', '🥅',
  '⛳', '⛸', '🎣', '🤿', '🎽', '🎿', '🛷', '🥌', '🎯', '🪀',
  '🪁', '🎱', '🔮', '🧿', '🎮', '🕹', '🎰', '🎲', '🧩', '🧸',
  '♠', '♥', '♦', '♣', '♟', '🃏', '🀄', '🎴', '🎭', '🖼',
  '🎨', '🧵', '🧶', '👓', '🕶', '🥽', '🥼', '🦺', '👔', '👕',
  '👖', '🧣', '🧤', '🧥', '🧦', '👗', '👘', '🥻', '🩱', '🩲',
  '🩳', '👙', '👚', '👛', '👜', '👝', '🛍', '🎒', '👞', '👟',
  '🥾', '🥿', '👠', '👡', '🩰', '👢', '👑', '👒', '🎩', '🎓',
  '🧢', '⛑', '📿', '💄', '💍', '💎', '🔇', '🔈', '🔉', '🔊',
  '📢', '📣', '📯', '🔔', '🔕', '🎼', '🎵', '🎶', '🎙', '🎚',
  '🎛', '🎤', '🎧', '📻', '🎷', '🎸', '🎹', '🎺', '🎻', '🪕',
  '🥁', '📱', '📲', '☎', '📞', '📟', '📠', '🔋', '🔌', '💻',
  '🖥', '🖨', '⌨', '🖱', '🖲', '💽', '💾', '💿', '📀', '🧮',
  '🎥', '🎞', '📽', '🎬', '📺', '📷', '📸', '📹', '📼', '🔍',
  '🔎', '🕯', '💡', '🔦', '🏮', '🪔', '📔', '📕', '📖', '📗',
  '📘', '📙', '📚', '📓', '📒', '📃', '📜', '📄', '📰', '🗞',
  '📑', '🔖', '🏷', '💰', '💴', '💵', '💶', '💷', '💸', '💳',
  '🧾', '💹', '✉', '📧', '📨', '📩', '📤', '📥', '📦', '📫',
  '📪', '📬', '📭', '📮', '🗳', '✏', '✒', '🖋', '🖊', '🖌',
  '🖍', '📝', '💼', '📁', '📂', '🗂', '📅', '📆', '🗒', '🗓',
  '📇', '📈', '📉', '📊', '📋', '📌', '📍', '📎', '🖇', '📏',
  '📐', '✂', '🗃', '🗄', '🗑', '🔒', '🔓', '🔏', '🔐', '🔑',
  '🗝', '🔨', '🪓', '⛏', '⚒', '🛠', '🗡', '⚔', '🔫', '🪃',
  '🏹', '🛡', '🔧', '🔩', '⚙', '🗜', '⚖', '🦯', '🔗', '⛓',
  '🧰', '🧲', '⚗', '🧪', '🧫', '🧬', '🔬', '🔭', '📡', '💉',
  '🩸', '💊', '🩹', '🩺', '🚪', '🛏', '🛋', '🪑', '🚽', '🚿',
  '🛁', '🪒', '🧴', '🧷', '🧹', '🧺', '🧻', '🧼', '🧽', '🧯',
  '🛒', '🚬', '⚰', '⚱', '🗿', '🏧', '🚮', '🚰', '♿', '🚹',
  '🚺', '🚻', '🚼', '🚾', '🛂', '🛃', '🛄', '🛅', '⚠', '🚸',
  '⛔', '🚫', '🚳', '🚭', '🚯', '🚱', '🚷', '📵', '🔞', '☢',
  '☣', '⬆', '↗', '➡', '↘', '⬇', '↙', '⬅', '↖', '↕',
  '↔', '↩', '↪', '⤴', '⤵', '🔃', '🔄', '🔙', '🔚', '🔛',
  '🔜', '🔝', '🛐', '⚛', '🕉', '✡', '☸', '☯', '✝', '☦',
  '☪', '☮', '🕎', '🔯', '♈', '♉', '♊', '♋', '♌', '♍',
  '♎', '♏', '♐', '♑', '♒', '♓', '⛎', '🔀', '🔁', '🔂',
  '▶', '⏩', '⏭', '⏯', '◀', '⏪', '⏮', '🔼', '⏫', '🔽',
  '⏬', '⏸', '⏹', '⏺', '⏏', '🎦', '🔅', '🔆', '📶', '📳',
  '📴', '♀', '♂', '⚕', '♾', '♻', '⚜', '🔱', '📛', '🔰',
  '⭕', '✅', '☑', '✔', '✖', '❌', '❎', '➕', '➖', '➗',
  '➰', '➿', '〽', '✳', '✴', '❇', '‼', '⁉', '❓', '❔',
  '❕', '❗', '〰', '©', '®', '™', '#', '*', '0', '1',
  '2', '3', '4', '5', '6', '7', '8', '9', '🔟', '💯',
  '🔠', '🔡', '🔢', '🔣', '🔤', '🅰', '🆎', '🅱', '🆑', '🆒',
  '🆓', 'ℹ', '🆔', 'Ⓜ', '🆕', '🆖', '🅾', '🆗', '🅿', '🆘',
  '🆙', '🆚', '🈁', '🈂', '🈷', '🈶', '指', '🉐', '🈹', '🈚',
  '🈲', '🉑', '🈸', '🈴', '🈳', '㊗', '㊙', '🈺', '🈵', '🔴',
  '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '⚫', '⚪', '🟥', '🟧',
  '🟨', '🟩', '🟦', '🟪', '🟫', '⬛', '⬜', '◼', '◻', '◾',
  '◽', '▪', '▫', '🔶', '🔷', '🔸', '🔹', '🔺', '🔻', '💠',
  '🔘', '🔳', '🔲', '🏁', '🚩', '🎌', '🏴', '🏳', '🏳‍🌈', '🏴‍☠'
];

export default function Profile() {
  const { userId, refreshProfile } = useAuth();
  const [member, setMember] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Icon selection modal state
  const [isIconModalOpen, setIsIconModalOpen] = useState(false);
  const [iconTab, setIconTab] = useState<'icons' | 'emojis'>('icons');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    password: '',
    description: '',
    avatar: '',
    avatarIcon: ''
  });

  useEffect(() => {
    if (userId) {
      const unsubscribe = firestoreService.subscribe('team', (data) => {
        const myProfile = data.find((m: any) => m.id === userId);
        if (myProfile) {
          setMember(myProfile);
          setFormData({
            password: myProfile.password || '',
            description: myProfile.description || '',
            avatar: myProfile.avatar || AVATAR_COLORS[0],
            avatarIcon: myProfile.avatar_icon || ''
          });
        }
        setIsLoading(false);
      });
      return () => unsubscribe();
    }
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    try {
      await firestoreService.update('team', member.id, {
        ...member,
        password: formData.password,
        description: formData.description,
        avatar: formData.avatar,
        avatar_icon: formData.avatarIcon
      });

      setToast({ message: 'تم تحديث البيانات بنجاح', type: 'success' });
      await refreshProfile(); // Update global context
    } catch (error) {
      console.error('Error updating profile:', error);
      setToast({ message: 'حدث خطأ أثناء حفظ البيانات', type: 'error' });
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (!member) return <div>Member not found</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-indigo-600 h-32 flex items-end justify-center pb-6 relative">
          <div className="absolute -bottom-12 w-24 h-24 bg-white rounded-full p-1 shadow-lg group">
            <Avatar 
              icon={formData.avatarIcon} 
              color={formData.avatar} 
              size="xl" 
              className="w-full h-full cursor-pointer hover:opacity-90"
              onClick={() => setIsIconModalOpen(true)}
            />
            <button 
              onClick={() => setIsIconModalOpen(true)}
              className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1.5 rounded-full shadow-md hover:bg-indigo-700 transition-colors"
              title="تغيير الأيقونة"
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="pt-16 pb-8 px-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">{member.name}</h1>
          <p className="text-indigo-600 font-medium">{member.role}</p>
          <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {member.type === 'admin' ? 'مدير' : 'عضو فريق'}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-600" />
          بيانات الحساب
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Smile className="w-4 h-4" />
              أيقونة الملف الشخصي
            </label>
            <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto p-2 border border-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, avatarIcon: '' })}
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-all hover:bg-gray-50",
                  !formData.avatarIcon ? "border-indigo-600 bg-indigo-50 text-indigo-600" : "border-transparent text-gray-500"
                )}
                title="افتراضي"
              >
                <User className="w-5 h-5" />
              </button>
              {Object.keys(ICONS_MAP).map((iconName) => {
                const Icon = ICONS_MAP[iconName];
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setFormData({ ...formData, avatarIcon: iconName })}
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-all hover:bg-gray-50",
                      formData.avatarIcon === iconName ? "border-indigo-600 bg-indigo-50 text-indigo-600" : "border-transparent text-gray-500"
                    )}
                    title={iconName}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              لون الأيقونة الشخصية
            </label>
            <div className="flex flex-wrap gap-3">
              {AVATAR_COLORS.map((colorClass) => (
                <button
                  key={colorClass}
                  type="button"
                  onClick={() => setFormData({ ...formData, avatar: colorClass })}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    colorClass,
                    formData.avatar === colorClass ? "border-gray-900 scale-110" : "border-transparent hover:scale-105"
                  )}
                >
                  <Avatar icon={formData.avatarIcon} color="bg-transparent" size="sm" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الاسم (للقراءة فقط)</label>
            <input 
              type="text" 
              value={member.name}
              disabled
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني (للقراءة فقط)</label>
            <input 
              type="email" 
              value={member.email || 'غير مسجل'}
              disabled
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">لا يمكن تعديل البيانات الأساسية إلا من قبل الإدارة</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              كلمة المرور
            </label>
            <input 
              type="text" 
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="أدخل كلمة المرور الجديدة"
            />
            <p className="text-xs text-gray-400 mt-1">يمكنك تغيير كلمة المرور، وستكون مرئية للإدارة</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              نبذة / وصف
            </label>
            <textarea 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="أضف نبذة عنك أو ملاحظات..."
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button 
              type="submit"
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              حفظ التغييرات
            </button>
          </div>
        </form>
      </div>

      {/* Icon Selection Modal */}
      {isIconModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">اختر أيقونة شخصية</h3>
              <button 
                onClick={() => setIsIconModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-100">
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setIconTab('icons')}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium rounded-lg transition-colors",
                    iconTab === 'icons' 
                      ? "bg-indigo-50 text-indigo-600" 
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  أيقونات
                </button>
                <button
                  onClick={() => setIconTab('emojis')}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium rounded-lg transition-colors",
                    iconTab === 'emojis' 
                      ? "bg-indigo-50 text-indigo-600" 
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  رموز تعبيرية
                </button>
              </div>
              
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="بحث..."
                  className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-4">
                {iconTab === 'icons' ? (
                  Object.keys(ICONS_MAP)
                    .filter(name => name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((name) => {
                      const Icon = ICONS_MAP[name];
                      return (
                        <button
                          key={name}
                          onClick={() => {
                            setFormData({ ...formData, avatarIcon: name });
                            setIsIconModalOpen(false);
                          }}
                          className={cn(
                            "aspect-square rounded-lg flex items-center justify-center transition-all hover:bg-gray-50",
                            formData.avatarIcon === name ? "bg-indigo-50 text-indigo-600 ring-2 ring-indigo-600" : "text-gray-600 border border-gray-100"
                          )}
                          title={name}
                        >
                          <Icon className="w-6 h-6" />
                        </button>
                      );
                    })
                ) : (
                  EMOJIS
                    .filter(emoji => emoji.includes(searchQuery))
                    .map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setFormData({ ...formData, avatarIcon: emoji });
                          setIsIconModalOpen(false);
                        }}
                        className={cn(
                          "aspect-square rounded-lg flex items-center justify-center text-2xl transition-all hover:bg-gray-50",
                          formData.avatarIcon === emoji ? "bg-indigo-50 ring-2 ring-indigo-600" : "border border-gray-100"
                        )}
                      >
                        {emoji}
                      </button>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
