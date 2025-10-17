"use client";
import { useState } from 'react';

interface SidebarProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  onLogout?: () => void;
}

export default function Sidebar({ activeSection = 'overview', onSectionChange, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'overview', label: 'Home', icon: '🏠' },
    { id: 'invites', label: 'Invites', icon: '📤' },
    { id: 'groups', label: 'Connections', icon: '👥' },
    { id: 'network', label: 'Network', icon: '🌐' },
    { id: 'vaults', label: 'Vaults', icon: '🔒' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <div className="w-64 bg-white shadow-lg h-full">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Navigation</h2>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange?.(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeSection === item.id
                  ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={onLogout || (() => window.location.href = '/')}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <span className="text-xl">🚪</span>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}