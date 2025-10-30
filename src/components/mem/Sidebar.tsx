'use client';
import { useState } from 'react';

interface SidebarProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  onLogout?: () => void;
  trustBonds?: any[];
  trustUnits?: any[];
}

export default function Sidebar({
  activeSection = 'overview',
  onSectionChange,
  onLogout,
  trustBonds = [],
  trustUnits = [],
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isVaultMenuOpen, setIsVaultMenuOpen] = useState(true);
  const menuItems = [
    { id: 'overview', label: 'Home', icon: '🏠' },
    { id: 'vaults', label: 'Vaults', icon: '🔒' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div
      className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white shadow-lg h-full transition-all duration-300`}
      data-testid="sidebar"
    >
      <div className='p-6'>
        {/* Collapse/Expand Button */}
        <div className='flex items-center justify-between mb-6'>
          {!isCollapsed && (
            <h2 className='text-xl font-bold text-gray-800'>GO TO...</h2>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className='text-xl'>{isCollapsed ? '▶️' : '◀️'}</span>
          </button>
        </div>

        <nav className='space-y-2'>
          {menuItems.map(item => {
            const isVaultItem = item.id === 'vaults';
            const isActive =
              activeSection === item.id ||
              (isVaultItem &&
                (activeSection === 'trust-bonds' ||
                  activeSection === 'trust-units'));
            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    // Navigate to actual pages instead of just changing sections
                    const memberCode = new URLSearchParams(window.location.search).get('memberCode') || '';
                    const baseUrl = memberCode ? `?memberCode=${memberCode}` : '';
                    
                    switch (item.id) {
                      case 'overview':
                        window.location.href = `/member-dashboard${baseUrl}`;
                        break;
                      case 'vaults':
                        window.location.href = `/vaults${baseUrl}`;
                        break;
                      case 'profile':
                        window.location.href = `/profile${baseUrl}`;
                        break;
                      case 'settings':
                        window.location.href = `/settings${baseUrl}`;
                        break;
                      default:
                        onSectionChange?.(item.id);
                        if (isVaultItem) setIsVaultMenuOpen(true);
                    }
                  }}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className='text-xl'>{item.icon}</span>
                  {!isCollapsed && (
                    <div className='flex-1 flex items-center justify-between'>
                      <span className='font-medium'>{item.label}</span>
                      {isVaultItem && (
                        <span
                          role='button'
                          tabIndex={0}
                          onClick={e => {
                            e.stopPropagation();
                            setIsVaultMenuOpen(v => !v);
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              setIsVaultMenuOpen(v => !v);
                            }
                          }}
                          className='text-sm text-gray-500 hover:text-gray-700 cursor-pointer'
                          title={
                            isVaultMenuOpen
                              ? 'Hide Vault Menu'
                              : 'Show Vault Menu'
                          }
                        >
                          {isVaultMenuOpen ? '▾' : '▸'}
                        </span>
                      )}
                    </div>
                  )}
                </button>

                {/* Vault submenu */}
                {!isCollapsed &&
                  isVaultItem &&
                  (isActive ||
                    activeSection === 'trust-bonds' ||
                    activeSection === 'trust-units') &&
                  isVaultMenuOpen && (
                    <div className='ml-4 mt-2 border-l-2 border-gray-200 pl-4 space-y-1'>
                      {/* Trust Bonds Section */}
                      <div className='mb-2'>
                        <div className='flex items-center px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide'>
                          Trust Bonds ({trustBonds.length})
                        </div>
                        {trustBonds.length > 0 ? (
                          <div className='space-y-1 ml-4'>
                            {trustBonds.map((bond: any, index: number) => {
                              // ✅ FIX: Show the correct partner name based on perspective
                              // We need to determine who the current user is talking to
                              const isFromPerspective = bond.direction === 'sent';
                              const partnerName = isFromPerspective 
                                ? bond.toMemberName  // I sent to them
                                : bond.fromMemberName; // They sent to me
                              
                              return (
                                <button
                                  key={bond.id || index}
                                  onClick={() =>
                                    onSectionChange?.(
                                      `trust-bond-${bond.id || index}`
                                    )
                                  }
                                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                                    activeSection ===
                                    `trust-bond-${bond.id || index}`
                                      ? 'bg-blue-100 text-blue-700 border-l-2 border-blue-500'
                                      : 'text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  <span className='text-xs mr-2'>🤝</span>
                                  <span className='truncate'>
                                    {partnerName || 'Unknown'}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className='px-3 py-2 text-xs text-gray-400 italic ml-4'>
                            No Trust Bonds
                          </div>
                        )}
                      </div>

                      {/* Trust Units Section */}
                      <div>
                        <div className='flex items-center px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide'>
                          Trust Units ({trustUnits.length})
                        </div>
                        {trustUnits.length > 0 ? (
                          <div className='space-y-1 ml-4'>
                            {trustUnits.map((unit: any, index: number) => (
                              <button
                                key={unit.id || index}
                                onClick={() =>
                                  onSectionChange?.(
                                    `trust-unit-${unit.id || index}`
                                  )
                                }
                                className={`w-full flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                                  activeSection ===
                                  `trust-unit-${unit.id || index}`
                                    ? 'bg-green-100 text-green-700 border-l-2 border-green-500'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                <span className='text-xs mr-2'>🌐</span>
                                <span className='truncate'>
                                  {unit.tuName || unit.name || 'Trust Unit'} (
                                  {unit.members?.length || 0})
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className='px-3 py-2 text-xs text-gray-400 italic ml-4'>
                            No Trust Units
                          </div>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            );
          })}
        </nav>

        <div className='mt-8 pt-6 border-t border-gray-200'>
          <button
            onClick={onLogout || (() => (window.location.href = '/'))}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors`}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <span className='text-xl'>🚪</span>
            {!isCollapsed && <span className='font-medium'>Logout</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
