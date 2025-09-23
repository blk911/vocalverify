"use client";

interface TopbarProps {
  memberData?: any;
}

export default function Topbar({ memberData }: TopbarProps) {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome, {memberData?.fullName || 'Member'}
          </h1>
          <p className="text-gray-600 text-sm">
            AM I HUMAN.net Member Dashboard
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Member Code</p>
            <p className="font-mono text-sm font-medium">
              {memberData?.phone || 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
