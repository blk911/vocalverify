'use client';

import { useState } from 'react';

interface VaultSidebarProps {
  activeVault?: string;
  onVaultChange?: (vaultId: string) => void;
  onBackToMain?: () => void;
}

export default function VaultSidebar({
  activeVault,
  onVaultChange,
  onBackToMain,
}: VaultSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const vaultCategories = [
    { id: 'personal', label: 'My Vaults', icon: '🔒', count: 3 },
    { id: 'shared', label: 'Shared Vaults', icon: '👥', count: 2 },
    { id: 'trust-bonds', label: 'Trust Bond Vaults', icon: '🤝', count: 1 },
    { id: 'trust-units', label: 'Trust Unit Vaults', icon: '🌐', count: 1 },
    { id: 'create', label: 'Create New Vault', icon: '➕', isAction: true },
  ];

  const personalVaults = [
    {
      id: 'personal-1',
      name: 'Personal Files',
      type: 'personal',
      lastModified: '2 hours ago',
    },
    {
      id: 'personal-2',
      name: 'Important Docs',
      type: 'personal',
      lastModified: '1 day ago',
    },
    {
      id: 'personal-3',
      name: 'Backup Files',
      type: 'personal',
      lastModified: '3 days ago',
    },
  ];

  const sharedVaults = [
    {
      id: 'shared-1',
      name: 'Family Photos',
      type: 'shared',
      members: 4,
      lastModified: '1 hour ago',
    },
    {
      id: 'shared-2',
      name: 'Work Projects',
      type: 'shared',
      members: 3,
      lastModified: '5 hours ago',
    },
  ];

  const trustBondVaults = [
    {
      id: 'bond-1',
      name: 'Spencer & Me',
      type: 'bond',
      partner: 'Spencer Wendt',
      lastModified: '30 min ago',
    },
  ];

  const trustUnitVaults = [
    {
      id: 'unit-1',
      name: 'Family Unit',
      type: 'unit',
      members: 5,
      lastModified: '2 hours ago',
    },
  ];

  const getVaultsForCategory = (categoryId: string) => {
    switch (categoryId) {
      case 'personal':
        return personalVaults;
      case 'shared':
        return sharedVaults;
      case 'trust-bonds':
        return trustBondVaults;
      case 'trust-units':
        return trustUnitVaults;
      default:
        return [];
    }
  };

  const renderVaultList = (vaults: any[], categoryId: string) => {
    if (vaults.length === 0) {
      return (
        <div className='text-xs text-gray-500 px-3 py-2'>No vaults yet</div>
      );
    }

    return (
      <div className='space-y-1'>
        {vaults.map(vault => (
          <button
            key={vault.id}
            onClick={() => onVaultChange?.(vault.id)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              activeVault === vault.id
                ? 'bg-blue-100 text-blue-700 border-l-2 border-blue-500'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className='flex items-center justify-between'>
              <span className='truncate'>{vault.name}</span>
              {vault.members && (
                <span className='text-xs text-gray-500'>{vault.members}</span>
              )}
            </div>
            <div className='text-xs text-gray-500 mt-1'>
              {vault.lastModified}
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div
      className={`${isCollapsed ? 'w-16' : 'w-80'} bg-white shadow-lg h-full transition-all duration-300 border-r border-gray-200`}
    >
      {/* Header */}
      <div className='p-4 border-b border-gray-200'>
        <div className='flex items-center justify-between mb-4'>
          {!isCollapsed && (
            <div className='flex items-center space-x-2'>
              <button
                onClick={onBackToMain}
                className='p-1 hover:bg-gray-100 rounded transition-colors'
                title='Back to main menu'
              >
                <span className='text-lg'>←</span>
              </button>
              <h2 className='text-xl font-bold text-gray-800'>VAULTS</h2>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className='text-xl'>{isCollapsed ? '▶️' : '◀️'}</span>
          </button>
        </div>
      </div>

      {/* Vault Categories */}
      <div className='p-4 space-y-4'>
        {vaultCategories.map(category => (
          <div key={category.id} className='space-y-2'>
            <button
              onClick={() => onVaultChange?.(category.id)}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2 rounded-lg text-left transition-colors ${
                activeVault === category.id
                  ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                  : 'text-gray-700 hover:bg-gray-100'
              } ${category.isAction ? 'bg-green-50 text-green-700 hover:bg-green-100' : ''}`}
              title={isCollapsed ? category.label : undefined}
            >
              <span className='text-xl'>{category.icon}</span>
              {!isCollapsed && (
                <div className='flex-1 flex items-center justify-between'>
                  <span className='font-medium'>{category.label}</span>
                  {!category.isAction && (
                    <span className='text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full'>
                      {category.count}
                    </span>
                  )}
                </div>
              )}
            </button>

            {/* Show vaults for this category if it's active */}
            {!isCollapsed &&
              activeVault === category.id &&
              !category.isAction && (
                <div className='ml-4 border-l-2 border-gray-200 pl-4'>
                  {renderVaultList(
                    getVaultsForCategory(category.id),
                    category.id
                  )}
                </div>
              )}
          </div>
        ))}
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className='absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50'>
          <div className='text-xs text-gray-500 text-center'>
            🔒 Secure Vault System
          </div>
        </div>
      )}
    </div>
  );
}


