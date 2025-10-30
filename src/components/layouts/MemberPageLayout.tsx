'use client';

import { ReactNode } from 'react';
import Topbar from '@/components/mem/Topbar';
import Sidebar from '@/components/mem/Sidebar';

interface MemberPageLayoutProps {
  children: ReactNode;
  pageTitle: string;
  showBackButton?: boolean;
  backButtonText?: string;
  backButtonHref?: string;
}

export default function MemberPageLayout({
  children,
  pageTitle,
  showBackButton = false,
  backButtonText = '← Dashboard',
  backButtonHref = '/member-dashboard'
}: MemberPageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Member Layout Structure */}
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Topbar */}
          <Topbar />
          
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            {/* Page Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">{pageTitle}</h1>
                {showBackButton && (
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => window.location.href = backButtonHref}
                      className="btn"
                    >
                      {backButtonText}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Page Content */}
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

