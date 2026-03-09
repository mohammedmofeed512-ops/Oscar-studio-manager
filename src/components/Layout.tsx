import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import Avatar from '@/components/Avatar';
import { 
  LayoutDashboard, 
  Briefcase, 
  CheckSquare, 
  Users, 
  DollarSign, 
  Settings,
  Menu,
  X,
  LogOut,
  FileText,
  ShieldCheck,
  User,
  GraduationCap,
  Handshake,
  ChevronDown,
  ChevronLeft,
  TrendingUp,
  Target
} from 'lucide-react';

import Notifications from '@/components/Notifications';

type NavigationItem = {
  name: string;
  href?: string;
  icon: any;
  children?: NavigationItem[];
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>(['الإنتاج', 'الكادر', 'النمو المالي']); // Default open
  const location = useLocation();
  const { user, role, logout, avatar, avatarIcon } = useAuth();

  const toggleMenu = (name: string) => {
    setOpenMenus(prev => 
      prev.includes(name) 
        ? prev.filter(item => item !== name) 
        : [...prev, name]
    );
  };

  const adminNavigation: NavigationItem[] = [
    { name: 'لوحة التحكم', href: '/', icon: LayoutDashboard },
    { 
      name: 'الإنتاج', 
      icon: Briefcase,
      children: [
        { name: 'المشاريع', href: '/projects', icon: Briefcase },
        { name: 'المهام', href: '/tasks', icon: CheckSquare },
      ]
    },
    {
      name: 'الكادر',
      icon: Users,
      children: [
        { name: 'الإدارة', href: '/management', icon: ShieldCheck },
        { name: 'الفريق', href: '/team', icon: Users },
        { name: 'المتدربين', href: '/trainees', icon: GraduationCap },
        { name: 'الشركاء', href: '/partners', icon: Handshake },
      ]
    },
    {
      name: 'النمو المالي',
      icon: TrendingUp,
      children: [
        { name: 'المالية', href: '/finance', icon: DollarSign },
        { name: 'الفواتير والنثريات', href: '/expenses', icon: FileText },
        { name: 'الهدف المالي', href: '/goals', icon: Target },
        { name: 'سجل النتائج', href: '/financial-history', icon: FileText },
      ]
    },
    { name: 'الملف الشخصي', href: '/profile', icon: User },
  ];

  const teamNavigation = [
    { name: 'لوحتي', href: '/team-dashboard', icon: LayoutDashboard },
    { name: 'الملف الشخصي', href: '/profile', icon: User },
  ];

  const traineeNavigation = [
    { name: 'الواجهة', href: '/team-dashboard', icon: LayoutDashboard },
    { name: 'الملف الشخصي', href: '/profile', icon: User },
  ];

  const partnerNavigation = [
    { name: 'بوابة الشركاء', href: '/partner-dashboard', icon: LayoutDashboard },
  ];

  const navigation = role === 'admin' ? adminNavigation : (role === 'trainee' ? traineeNavigation : (role === 'partner' ? partnerNavigation : teamNavigation));

  const renderNavItem = (item: NavigationItem) => {
    if (item.children) {
      const isOpen = openMenus.includes(item.name);
      // Check if any child is active to highlight the parent
      const isChildActive = item.children.some(child => child.href === location.pathname);
      
      return (
        <div key={item.name} className="space-y-1">
          <button
            onClick={() => toggleMenu(item.name)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors",
              isChildActive ? "text-indigo-700 bg-indigo-50/50" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5" />
              {item.name}
            </div>
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          
          {isOpen && (
            <div className="pr-8 space-y-1">
              {item.children.map(child => (
                <Link
                  key={child.name}
                  to={child.href!}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                    location.pathname === child.href
                      ? "bg-indigo-50 text-indigo-700" 
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <child.icon className="w-4 h-4" />
                  {child.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    const isActive = location.pathname === item.href;
    return (
      <Link
        key={item.name}
        to={item.href!}
        className={cn(
          "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
          isActive 
            ? "bg-indigo-50 text-indigo-700" 
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        )}
        onClick={() => setIsSidebarOpen(false)}
      >
        <item.icon className="w-5 h-5" />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans" dir="rtl">
      <Notifications />
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 right-0 z-50 w-64 bg-white border-l border-gray-200 transform transition-transform duration-200 ease-in-out lg:transform-none overflow-y-auto",
        isSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="h-16 flex items-center justify-center border-b border-gray-100 shrink-0">
          <h1 className="text-xl font-bold text-indigo-600">
            {role === 'admin' ? 'مدير الاستوديو' : (role === 'trainee' ? 'بوابة المتدربين' : (role === 'partner' ? 'بوابة الشركاء' : 'بوابة الفريق'))}
          </h1>
        </div>
        
        <nav className="p-4 space-y-1">
          {navigation.map((item) => renderNavItem(item as NavigationItem))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-md"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex-1"></div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-gray-900">{user}</span>
              <span className="text-xs text-gray-500">
                {role === 'admin' ? 'مدير' : (role === 'trainee' ? 'متدرب' : 'عضو فريق')}
              </span>
            </div>
            <Avatar 
              icon={avatarIcon || undefined}
              color={avatar || undefined}
              size="sm"
            />
            <button 
              onClick={logout}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
