"use client";
import { useState } from 'react';

interface AdminSidebarProps {
  adminData?: any;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  onLogout?: () => void;
}

export default function AdminSidebar({ adminData, activeSection = 'dashboard', onSectionChange, onLogout }: AdminSidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'members', label: 'Member Management', icon: '👥' },
    { id: 'invite-management', label: 'Invite Management', icon: '📤' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'voice-prints', label: 'Voice Prints', icon: '🎵' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'settings', label: 'System Settings', icon: '⚙️' },
    { id: 'logs', label: 'System Logs', icon: '📋' },
    { id: 'backup', label: 'Backup & Restore', icon: '💾' }
  ];

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen">
      <div className="p-6">
        {/* Admin Logo */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <div>
            <h2 className="text-lg font-bold">Admin Panel</h2>
            <p className="text-xs text-gray-400">System Management</p>
          </div>
        </div>

        {/* Admin Navigation */}
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange?.(item.id)}
              className={`w-full text-left flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeSection === item.id
                  ? 'bg-red-600 text-white font-medium'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout Button - Always visible */}
        <button
          onClick={onLogout || (() => window.location.href = '/')}
          className="w-full mt-6 px-4 py-3 text-red-400 hover:bg-red-800 hover:text-white rounded-lg transition-colors"
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
}
