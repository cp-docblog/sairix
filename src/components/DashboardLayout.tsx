import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { MessageSquare, Users, Settings, Menu, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 768;
      setIsSidebarOpen(isDesktop);
      if (!isDesktop) setIsSidebarCollapsed(false); // Reset collapse on mobile
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { to: '/', icon: <MessageSquare size={20} />, label: 'WhatsApp' },
    { to: '/lead-generation', icon: <Users size={20} />, label: 'Lead Generation' },
    { to: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="h-16 flex items-center justify-between px-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
          >
            <Menu size={24} className="text-gray-700 dark:text-gray-200" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <ThemeToggle />
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`z-20 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out flex flex-col flex-shrink-0 ${
          isSidebarOpen ? '' : 'fixed md:hidden inset-y-0 left-0 transform -translate-x-full'
        } ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200 dark:border-gray-700">
          {!isSidebarCollapsed && (
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 hidden md:block">
              Dashboard
            </h1>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <ThemeToggle />
            {/* Mobile close button */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors md:hidden"
            >
              <X size={20} className="text-gray-700 dark:text-gray-200" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center ${
                  isSidebarCollapsed ? 'justify-center' : 'justify-start'
                } gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
              onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
            >
              {icon}
              {!isSidebarCollapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer Collapse Toggle */}
        <div className="hidden md:block border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="flex items-center justify-center w-full gap-2 p-4 text-gray-700 dark:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
          >
            {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            {!isSidebarCollapsed && <span className="text-sm">Collapse Sidebar</span>}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden pt-16 md:pt-0 min-w-0">
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}