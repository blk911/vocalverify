"use client";
import ProfileThumbnail from '@/components/member/ProfileThumbnail';
import { capitalizeName } from '@/utils/stringUtils';

interface TopbarProps {
  memberData?: any;
  micAvailable?: boolean;
  cameraAvailable?: boolean;
}

export default function Topbar({ memberData, micAvailable, cameraAvailable }: TopbarProps) {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Profile Photo/Thumb */}
          <ProfileThumbnail
            memberCode={memberData?.memberCode || memberData?.phone || ''}
            memberName={memberData?.name || memberData?.fullName || 'Member'}
            size="xl"
            profilePicture={memberData?.profilePicture}
          />
          
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Welcome, {capitalizeName(memberData?.name || memberData?.fullName) || 'Member'}
            </h1>
            <p className="text-gray-600 text-sm">
              AM I HUMAN.net Member Dashboard
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Microphone Status Icon */}
          <div className="flex items-center space-x-2">
            {micAvailable ? (
              <div className="flex items-center space-x-1 text-green-600" title="Microphone Available">
                <span className="text-lg">🎤</span>
                <span className="text-xs">Mic Ready</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-red-600" title="Microphone Not Available">
                <span className="text-lg">🎤</span>
                <span className="text-xs">Connect your mic</span>
              </div>
            )}
          </div>
          
          {/* Camera Status Icon */}
          <div className="flex items-center space-x-2">
            {cameraAvailable ? (
              <div className="flex items-center space-x-1 text-green-600" title="Camera Available">
                <span className="text-lg">📷</span>
                <span className="text-xs">Camera Ready</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-red-600" title="Camera Not Available">
                <span className="text-lg">📷</span>
                <span className="text-xs">Connect your camera</span>
              </div>
            )}
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-600">Member Code</p>
            <p className="font-mono text-sm font-medium">
              {memberData?.phone || memberData?.memberCode || 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}




