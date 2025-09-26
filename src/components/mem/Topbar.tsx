"use client";

interface TopbarProps {
  memberData?: any;
}

export default function Topbar({ memberData }: TopbarProps) {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Profile Photo/Thumb */}
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {memberData?.profilePicture ? (
              <img 
                src={memberData.profilePicture} 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to default avatar if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg"
              style={{ display: memberData?.profilePicture ? 'none' : 'flex' }}
            >
              {memberData?.fullName ? memberData.fullName.charAt(0).toUpperCase() : 'M'}
            </div>
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Welcome, {memberData?.fullName || 'Member'}
            </h1>
            <p className="text-gray-600 text-sm">
              AM I HUMAN.net Member Dashboard
            </p>
          </div>
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
