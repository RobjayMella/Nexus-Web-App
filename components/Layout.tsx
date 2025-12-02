
import React, { useState, useEffect } from 'react';
import { User, Notification } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User | null;
  notifications: Notification[];
  activeTab: string;
  onNavigate: (tab: string) => void;
  onClearNotifications: () => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentUser, 
  notifications, 
  activeTab, 
  onNavigate,
  onClearNotifications,
  onLogout
}) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isTasksExpanded, setTasksExpanded] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  // Auto-expand tasks menu if a task tab is active
  useEffect(() => {
    if (activeTab === 'my-tasks' || activeTab === 'tasks') {
      setTasksExpanded(true);
    }
  }, [activeTab]);

  const NavItem = ({ id, label, icon, className = "" }: { id: string, label: string, icon: React.ReactNode, className?: string }) => (
    <button
      onClick={() => {
        onNavigate(id);
        setSidebarOpen(false);
      }}
      className={`flex items-center w-full px-4 py-3 mb-1 text-sm font-medium rounded-lg transition-colors ${
        activeTab === id
          ? 'bg-brand-500 text-white shadow-md'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
      } ${className}`}
    >
      <span className="mr-3">{icon}</span>
      {label}
    </button>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-900">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } flex flex-col`}>
        <div className="flex items-center justify-center h-16 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <h1 className="text-xl font-extrabold bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400 bg-clip-text text-transparent tracking-tight">
            Nexus Analyst Hub
          </h1>
        </div>

        <div className="p-4 flex-1 flex flex-col overflow-y-auto">
          <div className="flex items-center p-3 mb-6 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
             {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-brand-500" />
             ) : (
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 font-bold">
                  {currentUser?.name.charAt(0)}
                </div>
             )}
             <div className="ml-3 overflow-hidden">
               <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{currentUser?.name}</p>
               <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser?.role}</p>
             </div>
          </div>

          <nav className="flex-1">
            <NavItem 
              id="dashboard" 
              label="Dashboard" 
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>} 
            />

            {/* Collapsible Tasks Group */}
            <div className="space-y-1 mb-1">
               <button
                 onClick={() => setTasksExpanded(!isTasksExpanded)}
                 className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 justify-between group"
               >
                 <div className="flex items-center">
                    <span className="mr-3">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    </span>
                    Tasks
                 </div>
                 <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isTasksExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
               </button>

               <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isTasksExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                 <div className="pl-4 border-l-2 border-slate-100 dark:border-slate-700 ml-6 space-y-1 mt-1 mb-2">
                    <NavItem 
                      id="my-tasks" 
                      label="My Tasks" 
                      className="!py-2 !text-xs !mb-0"
                      icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} 
                    />
                    <NavItem 
                      id="tasks" 
                      label="All Tasks" 
                      className="!py-2 !text-xs !mb-0"
                      icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>} 
                    />
                 </div>
               </div>
            </div>

            <NavItem 
              id="leave-tracker" 
              label="Leave Tracker" 
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} 
            />

            <NavItem 
              id="repository" 
              label="Repository" 
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>} 
            />

            {/* Tools Section */}
            <div className="mt-6 mb-2 px-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Tools
            </div>
            <NavItem 
              id="ai-studio" 
              label="AI Studio" 
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} 
            />
            <NavItem 
              id="activity" 
              label="Activity Log" 
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
            />
            
            <div className="border-t border-slate-100 dark:border-slate-700 my-2 mx-4 mt-6"></div>
            <NavItem 
              id="docs" 
              label="System Guide" 
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>} 
            />
            <NavItem 
              id="profile" 
              label="Settings" 
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} 
            />
          </nav>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
             <button 
                onClick={onLogout}
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
             >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Sign Out
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>

          <h2 className="text-lg font-semibold capitalize hidden lg:block">{activeTab.replace('-', ' ')}</h2>

          <div className="flex items-center space-x-4">
             {/* Notification Bell */}
             <div className="relative">
                <button 
                  onClick={onClearNotifications}
                  className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 relative transition-all"
                  title="Clear notifications"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-800 animate-pulse"></span>
                  )}
                </button>
             </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
};
