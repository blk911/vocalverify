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
    { id: 'invites', label: 'Invites', icon: '✉️' },
    { id: 'groups', label: 'Groups', icon: '👥' },
    { id: 'network', label: 'Network', icon: '🌐' },
    { id: 'vaults', label: 'Vaults', icon: '🔒' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'admin', label: 'Admin', icon: '👑' },
    { id: 'notices', label: 'Notices', icon: '📢' }
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
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                activeSection === item.id
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full mt-6 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            🚪 Logout
          </button>
        )}
      </div>
    </div>
  );
}
