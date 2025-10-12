"use client";

interface AdminTopbarProps {
  adminData?: any;
}

export default function AdminTopbar({ adminData }: AdminTopbarProps) {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Admin Profile Photo/Thumb */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center overflow-hidden">
            {adminData?.profilePicture ? (
              <img 
                src={adminData.profilePicture} 
                alt="Admin Profile" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to default avatar if image fails to load
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                  ((e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement).style.display = 'flex';
                }}
              />
            ) : null}
            <img
              src="/amihuman A.png"
              alt="Default AM I HUMAN admin profile"
              className={`w-full h-full object-cover ${adminData?.profilePicture ? 'hidden' : 'block'}`}
              onError={(e) => {
                // Fallback to 'A' if default image fails
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallbackDiv = document.createElement('div');
                fallbackDiv.className = 'w-full h-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg';
                fallbackDiv.textContent = 'A';
                target.parentNode?.appendChild(fallbackDiv);
              }}
            />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Welcome, Admin
            </h1>
            <p className="text-gray-600 text-sm">
              AM I HUMAN.net Admin Dashboard
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Admin Access</p>
            <p className="font-mono text-sm font-medium text-red-600">
              SYSTEM ADMIN
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}









