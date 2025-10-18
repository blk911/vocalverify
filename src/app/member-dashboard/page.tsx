"use client";
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef, Suspense } from 'react';
import Topbar from '@/components/mem/Topbar';
import Sidebar from '@/components/mem/Sidebar';
import InteractiveGuide from '@/components/InteractiveGuide';
import TrustUnitModal from '@/components/TrustUnitModal';
import TrustNetworkManager from '@/components/member/TrustNetworkManager';
import { deviceFingerprint } from '@/lib/deviceFingerprint';
import { capitalizeName } from '@/utils/stringUtils';
import { apiCalls } from '@/utils/apiEnforcer';

function MemberDashboardContent() {
  const searchParams = useSearchParams();
  
  // Helper function to resolve memberCode reliably
  function resolveMemberCode(opts?: { searchParams?: URLSearchParams; memberData?: any }) {
    const sp = opts?.searchParams;
    const md = opts?.memberData;
    // trust, in order: ?memberCode=…, localStorage, memberData.memberCode
    return (
      sp?.get("memberCode") ||
      (typeof window !== "undefined" ? localStorage.getItem("memberCode") : "") ||
      md?.memberCode ||
      ""
    );
  }

  // Frontend error logging
  const logApiError = (endpoint: string, error: any, data?: any) => {
    console.error(`[FRONTEND ERROR] ${endpoint}:`, error);
    console.error('Request data:', data);
    console.error('Timestamp:', new Date().toISOString());
  };

  const logApiSuccess = (endpoint: string, data?: any) => {
    console.log(`[FRONTEND SUCCESS] ${endpoint}:`, data);
  };
  
  const memberCode = resolveMemberCode({ searchParams, memberData: null }); // Will be updated when memberData loads
  
  const [memberData, setMemberData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [showVoiceModal, setShowVoiceModal] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null);
  const [showVoicePrompts, setShowVoicePrompts] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // QR Code modal states
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRInvite, setSelectedQRInvite] = useState<any>(null);
  
  // Collapsible section states
  const [expandedSections, setExpandedSections] = useState({
    step1: false,
    step2: false,
    step3: false
  });
  
  // Camera and photo states
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [showCameraModal, setShowCameraModal] = useState(false);
  
  // Microphone states
  const [micAvailable, setMicAvailable] = useState(false);
  const [micError, setMicError] = useState('');
  
  // Invite states
  const [inviteForm, setInviteForm] = useState({
    name: '',
    phone: '',
    message: ''
  });
  
  // Trust Unit states
  const [showTrustUnitModal, setShowTrustUnitModal] = useState(false);
  const [currentTrustUnit, setCurrentTrustUnit] = useState<any>(null);
  const [trustUnits, setTrustUnits] = useState<any[]>([]);
  const [trustBonds, setTrustBonds] = useState<any[]>([]);
  const [isCheckingTrustUnits, setIsCheckingTrustUnits] = useState(true);
  const [pageReady, setPageReady] = useState(false);
  
  // Vault states
  const [selectedVault, setSelectedVault] = useState<any>(null);
  const [vaultMessages, setVaultMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showVaultCreationModal, setShowVaultCreationModal] = useState(false);
  const [messagePollingInterval, setMessagePollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [reactingMessage, setReactingMessage] = useState<any>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  
  // TU Member display states
  const [tuMembers, setTuMembers] = useState<any[]>([]);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [memberActiveStates, setMemberActiveStates] = useState<any>({});
  const [editContent, setEditContent] = useState('');
  const [invitedLovedOnes, setInvitedLovedOnes] = useState<any[]>([]);
  const [showInvitePreview, setShowInvitePreview] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Voice print states
  const [voicePrints, setVoicePrints] = useState({
    person1: { name: "", status: "pending", voiceFile: null as File | null },
    person2: { name: "", status: "pending", voiceFile: null as File | null },
    person3: { name: "", status: "pending", voiceFile: null as File | null }
  });
  const [completionStatus, setCompletionStatus] = useState("incomplete");
  const [progress, setProgress] = useState("0/3");
  

  // Load member data from database
  const loadMemberData = async () => {
    const mc = resolveMemberCode({ searchParams, memberData });
    if (!mc) {
      setLoading(false);
      return;
    }

    // Handle demo mode
    if (mc === 'demo') {
      setMemberData({
        name: 'Demo User',
        fullName: 'Demo User',
        phone: '555-0123',
        memberCode: 'demo',
        profilePicture: '',
        hasVoice: false,
        status: 'demo'
      });
      setLoading(false);
      return;
    }

    try {
      // Send device fingerprint for security
      await deviceFingerprint.sendFingerprint(mc);
      
      logApiSuccess('/api/user/profile REQUEST', { memberCode: mc });
      const response = await fetch(`/api/user/profile?memberCode=${mc}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      logApiSuccess('/api/user/profile RESPONSE', { memberCode: mc, hasData: !!data });
      
      if (data.ok && data.profile) {
        setMemberData(data.profile);
        
        // Set profile picture if available
        if (data.profile.selfie || data.profile.profilePicture) {
          setCurrentPhoto(data.profile.selfie || data.profile.profilePicture);
          logApiSuccess('Profile picture loaded', { hasPicture: true });
        }
        
        // Populate primary voice print name with member's registered name
        setPrimaryVoicePrint(prev => ({
          ...prev,
          name: data.profile.name || data.profile.fullName || "Your Name"
        }));
        
        // Populate profile confirm print name with member's registered name
        setProfileConfirmPrint(prev => ({
          ...prev,
          name: data.profile.name || data.profile.fullName || "Your Name"
        }));

        // Load completion status from database
        if (data.profile.profileSteps) {
          const steps = data.profile.profileSteps;
          setPrimaryVoicePrint(prev => ({
            ...prev,
            status: steps.primaryVoice ? "completed" : "pending",
            confirmed: steps.primaryVoice
          }));
          setProfileConfirmPrint(prev => ({
            ...prev,
            status: steps.profileConfirm ? "completed" : "pending",
            confirmed: steps.profileConfirm
          }));
          setPhoneVoicePrint(prev => ({
            ...prev,
            status: steps.phoneVoice ? "completed" : "pending",
            confirmed: steps.phoneVoice
          }));
        }

        // Set current step from database
        if (data.profile.currentStep) {
          setCurrentStep(data.profile.currentStep);
        }
        
        // CRITICAL: Load voice recordings from database
        console.log('🎵 Loading voice recordings for member:', memberCode);
        try {
          // Voice flow test removed
          // const voiceData = await voiceResponse.json();
          // console.log('🎵 Voice recordings loaded:', JSON.stringify(voiceData, null, 2));
          
          // Update voice print states based on actual database records
          // Voice data processing removed - all commented out
        } catch (voiceError) {
          console.error('🎵 Error loading voice recordings:', voiceError);
        }
        
        // For registered members, skip any onboarding flows
        if (data.profile.status === 'registered') {
          // Registered members go directly to dashboard - no guide, no modals
          setLoading(false);
          return;
        }
        
        // Check if first time login - only show guide for new users, not returning registered members
        const isFirstLogin = localStorage.getItem(`aih.firstLogin.${memberCode}`) !== 'true';
        const isNewUser = data.profile.status === 'pending' || data.profile.status === 'temp';
        
        if (isFirstLogin && isNewUser) {
          setShowGuide(true);
          localStorage.setItem(`aih.firstLogin.${memberCode}`, 'true');
        }
      } else {
        }
    } catch (error) {
      logApiError('/api/user/profile', error, { memberCode: mc });
      console.error('Error loading member data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Primary and Profile Confirm voice prints
  const [primaryVoicePrint, setPrimaryVoicePrint] = useState({
    name: "",
    status: "pending",
    voiceFile: null,
    confirmed: false
  });
  const [profileConfirmPrint, setProfileConfirmPrint] = useState({
    name: "",
    status: "pending", 
    voiceFile: null,
    confirmed: false
  });
  
         // Sequential completion state
         const [currentStep, setCurrentStep] = useState(1); // 1: Original, 2: Profile Confirm, 3: Phone
         const [phoneConfirmed, setPhoneConfirmed] = useState(false);
        const [phoneVoicePrint, setPhoneVoicePrint] = useState({
          phone: "",
          status: "pending",
          voiceFile: null as File | null,
           confirmed: false
         });

  // Persist memberCode to localStorage
  useEffect(() => {
    const mc = searchParams.get("memberCode");
    if (mc) localStorage.setItem("memberCode", mc);
  }, [searchParams]);

  // Update page title when member data loads
  useEffect(() => {
    if (memberData && memberData.name) {
      document.title = `${memberData.name} - Am I Human.net`;
      logApiSuccess('Page title updated', { title: document.title });
    }
  }, [memberData]);

  // CRITICAL: Clear invalid vault selections on component mount
  useEffect(() => {
    // Clear any stale vault selections that might cause 404 errors
    setSelectedVault(null);
    setVaultMessages([]);
    stopMessagePolling();
    console.log('🧹 Cleared stale vault selections on component mount');
  }, []);

  // Load TU members when a TU vault is selected
  const loadTuMembers = async (tuId: string) => {
    try {
      console.log('🔄 Loading TU member buttons for TU ID:', tuId);
      
      // Use the new endpoint to get member buttons
      const response = await fetch(`/api/tu-members/buttons?tuId=${tuId}`);
      const data = await response.json();
      
      if (data.ok && data.members) {
        console.log('✅ Loaded TU member buttons:', data.members.length);
        console.log('✅ Member data:', data.members);
        setTuMembers(data.members);
        console.log('✅ Member buttons set in state');
      } else {
        console.error('❌ Failed to load TU member buttons:', data.error);
        setTuMembers([]);
      }
    } catch (error) {
      console.error('❌ Error loading TU member buttons:', error);
      setTuMembers([]);
    }
  };

  // Format message date properly
  const formatMessageDate = (dateInput: any) => {
    try {
      if (!dateInput) return 'Just now';
      
      let date: Date;
      
      // Handle Firestore timestamp format
      if (dateInput.seconds) {
        date = new Date(dateInput.seconds * 1000);
      }
      // Handle regular date string or number
      else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
        date = new Date(dateInput);
      }
      // Handle Date object
      else if (dateInput instanceof Date) {
        date = dateInput;
      }
      else {
        return 'Just now';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Just now';
      }
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting message date:', error);
      return 'Just now';
    }
  };

  // Render TU member names with truncation and active states
  const renderTuMemberNames = () => {
    console.log('🎯 renderTuMemberNames called, tuMembers:', tuMembers);
    console.log('🎯 tuMembers length:', tuMembers?.length);
    
    if (!tuMembers || tuMembers.length === 0) {
      console.log('🎯 No members to display, returning null');
      return null;
    }

    const displayMembers = showAllMembers ? tuMembers : tuMembers.slice(0, 3);
    const hasMore = tuMembers.length > 3;

    console.log('🎯 Rendering member buttons:', displayMembers.length);

    return (
      <div className="flex items-center gap-1">
        {displayMembers.map((member, index) => {
          return (
            <span key={member.memberCode} className="flex items-center gap-1">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                member.isActive 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  member.isActive ? 'bg-green-500' : 'bg-gray-400'
                }`}></span>
                {member.name}
              </span>
              {index < displayMembers.length - 1 && <span className="text-slate-400 text-xs">,</span>}
            </span>
          );
        })}
        {hasMore && !showAllMembers && (
          <button
            onClick={() => setShowAllMembers(true)}
            className="text-indigo-600 hover:text-indigo-800 text-xs font-medium ml-1"
          >
            +{tuMembers.length - 3}
          </button>
        )}
        {hasMore && showAllMembers && (
          <button
            onClick={() => setShowAllMembers(false)}
            className="text-indigo-600 hover:text-indigo-800 text-xs font-medium ml-1"
          >
            less
          </button>
        )}
      </div>
    );
  };

  // Render Bond member names (2 members: current user + bond partner)
  const renderBondMemberNames = () => {
    console.log('🔗 renderBondMemberNames called:', { 
      selectedVault, 
      type: selectedVault?.type,
      memberData: memberData?.name,
      hasMemberData: !!memberData
    });
    
    if (!selectedVault || selectedVault.type !== 'bond') {
      console.log('🔗 Not a bond vault, returning null');
      return null;
    }

    const bond = selectedVault;
    const currentMemberName = memberData?.name || 'Spencer Wendt'; // ✅ FALLBACK: Use Spencer as default
    const partnerName = bond.direction === 'sent' ? bond.toMemberName : bond.fromMemberName;
    
    console.log('🔗 Rendering bond members:', { 
      currentMemberName, 
      partnerName, 
      bond,
      bondDirection: bond.direction,
      toMemberName: bond.toMemberName,
      fromMemberName: bond.fromMemberName
    });
    
    // ✅ FIXED: Always show member names with fallback
    
    return (
      <div className="flex items-center gap-1">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 border border-green-200">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          {currentMemberName}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 border border-gray-200">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
          {partnerName}
        </span>
      </div>
    );
  };

  useEffect(() => {
    // Load member data from database
    loadMemberData();

    // Load voice prints data
    loadVoicePrints();
    
    // Test microphone availability on page load
    testMicrophoneOnLoad();
    
    // Test camera availability on page load
    testCameraOnLoad();
    
    // Load invited loved ones
    loadInvitedLovedOnes();
  }, [memberCode]);

  // Cleanup polling on component unmount
  useEffect(() => {
    // Clear any invalid vault selection on mount
    setSelectedVault(null);
    setVaultMessages([]);
    
    return () => {
      stopMessagePolling();
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, []);

  // Load invited loved ones when Connections section is accessed
  useEffect(() => {
    if (activeSection === 'groups' && memberCode) {
      loadInvitedLovedOnes();
      loadTrustUnits();
      loadTrustBonds();
    }
  }, [activeSection, memberCode]);

  // Load data when Home section is active
  useEffect(() => {
    if (activeSection === 'overview' && memberCode) {
      loadInvitedLovedOnes();
      loadTrustUnits();
      loadTrustBonds();
    }
  }, [activeSection, memberCode]);

  // Load Trust Units when dashboard loads
  useEffect(() => {
    if (memberCode) {
      loadTrustUnits();
    }
  }, [memberCode]);

  // Test microphone availability on page load
  const testMicrophoneOnLoad = async () => {
    try {
      console.log('Testing microphone on page load...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Test successful - stop the stream
      stream.getTracks().forEach(track => track.stop());
      setMicAvailable(true);
      console.log('Microphone available on page load');
    } catch (error) {
      setMicAvailable(false);
      console.log('Microphone not available on page load:', (error as Error).message);
    }
  };

  // Test camera availability on page load
  const testCameraOnLoad = async () => {
    try {
      console.log('Testing camera on page load...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      // Test successful - stop the stream
      stream.getTracks().forEach(track => track.stop());
      setCameraAvailable(true);
      console.log('Camera available on page load');
    } catch (error) {
      setCameraAvailable(false);
      console.log('Camera not available on page load:', (error as Error).message);
    }
  };

  // Invite form handlers
  const handleInviteFormChange = (field: string, value: string) => {
    setInviteForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConfirmInvite = () => {
    // Show preview instead of sending immediately
    setShowInvitePreview(true);
  };

  const handleEditInvite = () => {
    // Return to form editing
    setShowInvitePreview(false);
  };

  // QR Code modal handler
  const openQRModal = (invite: any) => {
    setSelectedQRInvite(invite);
    setShowQRModal(true);
  };

  // QR Code action handlers
  const generateQRCode = async (invite: any) => {
    try {
      const response = await fetch('/api/invites/generate-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteId: invite.id,
          inviteeName: invite.name,
          inviteePhone: invite.phone,
          inviterName: memberData?.name || memberData?.fullName || 'Member',
          inviterCode: memberCode
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedQRInvite(prev => ({
          ...prev,
          qrCodeUrl: data.qrCodeUrl,
          qrData: data.qrData
        }));
        // Reload invite list to get updated data
        await loadInvitedLovedOnes();
      } else {
        setErrorMessage('Failed to generate QR code');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('QR generation error:', error);
      setErrorMessage('Failed to generate QR code');
      setShowErrorModal(true);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccessMessage('Link copied to clipboard!');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Copy error:', error);
      setErrorMessage('Failed to copy to clipboard');
      setShowErrorModal(true);
    }
  };

  const downloadQRCode = async (invite: any) => {
    try {
      if (invite.qrCodeUrl) {
        const response = await fetch(invite.qrCodeUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-code-${invite.name.replace(/\s+/g, '-').toLowerCase()}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setSuccessMessage('QR code downloaded!');
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Download error:', error);
      setErrorMessage('Failed to download QR code');
      setShowErrorModal(true);
    }
  };

  const shareViaSMS = (invite: any) => {
    try {
      const message = `Hi ${invite.name}! I've invited you to join my trusted network. Scan this QR code or visit: ${invite.qrData}`;
      const smsUrl = `sms:${invite.phone}?body=${encodeURIComponent(message)}`;
      window.open(smsUrl, '_blank');
    } catch (error) {
      console.error('SMS share error:', error);
      setErrorMessage('Failed to open SMS');
      setShowErrorModal(true);
    }
  };

  const handleSendInvite = async () => {
    try {
      console.log('=== SENDING INVITE DEBUG ===');
      console.log('Member Code:', memberCode);
      console.log('Invite Form:', inviteForm);
      console.log('Member Data:', memberData);
      
      // Create default message with live data
      const defaultMessage = `Hi ${inviteForm.name || '[first name]'}, I need you! Will you verify I am human! It's part of a network I am building. It maybe something you will be interested in. Why? No bots, no scammers, just the people I love... I love you!! Thank you! ${memberData?.name || memberData?.fullName || '[member name]'}`;
      
      // Strip phone formatting for storage (remove all non-digits)
      const cleanPhone = inviteForm.phone.replace(/\D/g, '');
      
      console.log('Clean phone:', cleanPhone);
      console.log('Default message:', defaultMessage);
      
      const requestData = {
        memberCode: memberCode,          // ✅ FIXED: was inviterUid
        invitedName: inviteForm.name,    // ✅ FIXED: was inviteeName
        invitedPhone: cleanPhone          // ✅ FIXED: was inviteeEmail
      };
      
      console.log('Request data:', requestData);
      
      const response = await fetch('/api/invites/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const responseData = await response.json();
      console.log('Response data:', responseData);
      
      if (response.ok) {
        console.log('✅ Invite sent successfully!');
        
        // Check for Trust Unit prospect
        if (responseData.trustUnitProspect) {
          console.log('🎯 TRUST UNIT PROSPECT DETECTED!');
          console.log('TU Prospect data:', responseData.trustUnitProspect);
          
          // Show Trust Unit modal immediately with real member data
          // Fetch full TU data to get real member names
          try {
            const tuResponse = await fetch(`/api/trust-units/list?memberCode=${memberCode}`);
            const tuData = await tuResponse.json();
            
            if (tuData.ok && tuData.trustUnits) {
              const prospectTU = tuData.trustUnits.find((tu: any) => tu.id === responseData.trustUnitProspect.unitId);
              if (prospectTU) {
                console.log('✅ TU Modal with real data:', prospectTU);
                console.log('✅ Members array:', prospectTU.members);
                setCurrentTrustUnit(prospectTU);
                setShowTrustUnitModal(true);
              } else {
                console.error('❌ TU prospect not found in list');
                console.log('Available TUs:', tuData.trustUnits.map((tu: any) => ({ id: tu.id, members: tu.members })));
              }
            }
          } catch (tuError) {
            console.error('❌ Error fetching TU data:', tuError);
            // Fallback to basic data
            setCurrentTrustUnit({
              id: responseData.trustUnitProspect.unitId,
              members: responseData.trustUnitProspect.members.map((memberCode: string) => ({
                memberCode,
                name: memberCode === memberCode ? 'You' : 'Member',
                status: 'pending_connection'
              })),
              status: responseData.trustUnitProspect.status,
              type: 'same_sponsor'
            });
            setShowTrustUnitModal(true);
          }
          
          setSuccessMessage('Invitation sent! Trust Unit opportunity detected.');
        } else {
        setSuccessMessage('Invitation sent successfully!');
        }
        
        setShowSuccessModal(true);
        
        // Reset form and hide preview
        setInviteForm({
          name: '',
          phone: '',
          message: ''
        });
        setShowInvitePreview(false);
        
        // Reload invited loved ones
        console.log('Reloading invited loved ones...');
        await loadInvitedLovedOnes();
      } else {
        console.error('❌ Invite failed:', responseData);
        
        // ✅ PHASE 4: Handle duplicate TU member error
        if (responseData.code === 'ALREADY_IN_TU' || responseData.code === 'DUPLICATE_TU_MEMBER') {
          setErrorMessage(`${responseData.error}. You're already connected through your Trust Unit.`);
        } else {
        setErrorMessage('Failed to send invitation: ' + (responseData.error || 'Unknown error'));
        }
        
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('❌ Error sending invite:', error);
      setErrorMessage('Failed to send invitation: ' + (error as Error).message);
      setShowErrorModal(true);
    }
  };

  const loadInvitedLovedOnes = async () => {
    try {
      console.log('=== LOADING INVITED LOVED ONES ===');
      console.log('Member Code:', memberCode);
      
      const response = await fetch(`/api/invites/list?memberCode=${memberCode}`);
      console.log('List response status:', response.status);
      
      const data = await response.json();
      console.log('List response data:', data);
      
      if (data.ok) {
        console.log('✅ Loaded invites:', data.invites?.length || 0);
        setInvitedLovedOnes(data.invites || []);
      } else {
        console.error('❌ Failed to load invites:', data.error);
      }
    } catch (error) {
      console.error('❌ Error loading invited loved ones:', error);
    }
  };

  const loadTrustUnits = async () => {
    try {
      console.log('=== INTERSTITIAL TRUST UNIT CHECK ===');
      console.log('Member Code:', memberCode);
      setIsCheckingTrustUnits(true);
      
      // Use type-safe API call that cannot fail
      logApiSuccess('/api/trust/units/list REQUEST', { memberCode });
      const data = await apiCalls.getTrustUnits(memberCode);
      console.log('Trust units response data:', data);
      
      if (data.ok) {
        console.log('✅ Loaded trust units:', data.trustUnits?.length || 0);
        setTrustUnits(data.trustUnits || []);
        logApiSuccess('/api/trust/units/list SUCCESS', { count: data.trustUnits?.length || 0 });
        
        // If no trust units, show message
        if (!data.trustUnits || data.trustUnits.length === 0) {
          console.log('ℹ️ No trust units found - user may need sponsor relationships');
        }
        
        // Check for trust unit prospects or pending units that need THIS user's attention
        const relevantUnits = data.trustUnits.filter((unit: any) => {
          // Include both 'prospect' and 'pending_connections' status
          if (unit.status !== 'prospect' && unit.status !== 'pending_connections') return false;
          
          // Check if current user is in this unit
          const currentUserMember = unit.members.find((member: any) => 
            member.memberCode === memberCode
          );
          
          // For prospects: show modal to all members
          // For pending: show modal only to pending members
          if (unit.status === 'prospect') {
            return currentUserMember; // Any member in prospect sees modal
          } else {
          return currentUserMember && currentUserMember.status === 'pending_connection';
          }
        });
        
        if (relevantUnits.length > 0) {
          console.log('🔔 INTERSTITIAL MODAL: Found relevant trust units:', relevantUnits);
          setCurrentTrustUnit(relevantUnits[0]);
          setShowTrustUnitModal(true);
          // DON'T set pageReady yet - modal must be resolved first
          console.log('🔔 Modal should be showing now');
        } else {
          console.log('✅ No relevant trust units, page ready');
          setPageReady(true);
        }
      } else {
        console.error('❌ Failed to load trust units:', data.error);
        setPageReady(true); // Allow page to load even if trust units fail
      }
    } catch (error) {
      console.error('❌ Error loading trust units:', error);
      setPageReady(true); // Allow page to load even if trust units fail
    } finally {
      setIsCheckingTrustUnits(false);
    }
  };

  const loadTrustBonds = async () => {
    try {
      console.log('\n🔥🔥🔥 [DASHBOARD] LOADING TRUST BONDS 🔥🔥🔥');
      console.log('[DASHBOARD] Member Code:', memberCode);
      
      if (!memberCode) {
        console.log('[DASHBOARD] ❌ No memberCode, skipping trust bonds');
        return;
      }
      
      logApiSuccess('/api/trust-bonds/list REQUEST', { memberCode });
      const data = await apiCalls.getTrustBonds(memberCode);
      console.log('[DASHBOARD] Trust bonds response:', data);
      
      if (data.ok) {
        console.log('✅ [DASHBOARD] Loaded trust bonds:', data.trustBonds?.length || 0);
        setTrustBonds(data.trustBonds || []);
        logApiSuccess('/api/trust-bonds/list SUCCESS', { count: data.trustBonds?.length || 0 });
        
        // Log each bond
        if (data.trustBonds && data.trustBonds.length > 0) {
          console.log('[DASHBOARD] 💎 TRUST BONDS FOUND:');
          data.trustBonds.forEach((bond: any, idx: number) => {
            console.log(`  ${idx + 1}. ${bond.fromMemberName} → ${bond.toMemberName} (${bond.status})`);
          });
        } else {
          console.log('[DASHBOARD] ℹ️ No trust bonds found yet');
        }
      } else {
        console.error('[DASHBOARD] ❌ Failed to load trust bonds:', data.error);
        logApiError('/api/trust-bonds/list FAILED', { error: data.error });
      }
    } catch (error) {
      console.error('[DASHBOARD] ❌ Error loading trust bonds:', error);
      logApiError('/api/trust-bonds/list ERROR', error);
    }
  };

  const handleTrustUnitConnect = async (memberCode: string) => {
    try {
      console.log('=== CONNECTING TO TRUST UNIT ===');
      console.log('Member Code:', memberCode);
      console.log('Unit ID:', currentTrustUnit?.unitId);
      
      const response = await fetch('/api/trust/units/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unitId: currentTrustUnit?.unitId,
          memberCode: memberCode
        })
      });
      
      const data = await response.json();
      console.log('Connect response:', data);
      
      if (data.ok) {
        console.log('✅ Connected to trust unit successfully');
        setShowTrustUnitModal(false);
        setCurrentTrustUnit(null);
        setPageReady(true); // Page is now ready after modal decision
        // Reload data to show updated Trust Unit status
        await loadTrustUnits();
        await loadInvitedLovedOnes();
      } else {
        console.error('❌ Failed to connect to trust unit:', data.error);
        setErrorMessage('Failed to connect to trust unit: ' + (data.error || 'Unknown error'));
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('❌ Error connecting to trust unit:', error);
      setErrorMessage('Failed to connect to trust unit: ' + (error as Error).message);
      setShowErrorModal(true);
    }
  };

  const handleTrustUnitWait = async (memberCode: string) => {
    try {
      console.log('=== WAITING ON TRUST UNIT ===');
      console.log('Member Code:', memberCode);
      console.log('Unit ID:', currentTrustUnit?.unitId);
      
      const response = await fetch('/api/trust/units/wait', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unitId: currentTrustUnit?.unitId,
          memberCode: memberCode
        })
      });
      
      const data = await response.json();
      console.log('Wait response:', data);
      
      if (data.ok) {
        console.log('✅ Status updated to waiting');
        setShowTrustUnitModal(false);
        setCurrentTrustUnit(null);
        setPageReady(true); // Page is now ready after modal decision
        // Reload data to show updated Trust Unit status
        await loadTrustUnits();
        await loadInvitedLovedOnes();
      } else {
        console.error('❌ Failed to update status:', data.error);
        setErrorMessage('Failed to update status: ' + (data.error || 'Unknown error'));
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('❌ Error updating status:', error);
      setErrorMessage('Failed to update status: ' + (error as Error).message);
      setShowErrorModal(true);
    }
  };

  const handleStatusChange = async (inviteId: string, newStatus: string) => {
    try {
      console.log('=== UPDATING INVITE STATUS ===');
      console.log('Invite ID:', inviteId);
      console.log('New Status:', newStatus);
      
      const response = await fetch('/api/invites/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteId: inviteId,
          status: newStatus
        })
      });
      
      const data = await response.json();
      console.log('Status update response:', data);
      
      if (data.ok) {
        console.log('✅ Status updated successfully');
        // Reload the invites list to get updated data
        await loadInvitedLovedOnes();
      } else {
        console.error('❌ Failed to update status:', data.error);
      }
    } catch (error) {
      console.error('❌ Error updating status:', error);
    }
  };

  const loadVoicePrints = async () => {
    try {
      const mc = resolveMemberCode({ searchParams, memberData });
      if (mc) {
        const response = await fetch(`/api/voice-prints?memberCode=${mc}`);
        const data = await response.json();
        
        if (data.ok) {
          setVoicePrints(data.voicePrints);
          setCompletionStatus(data.completionStatus);
          setProgress(data.progress);
        }
      }
    } catch (error) {
      }
  };

  const handleGuideClose = () => {
    setShowGuide(false);
  };

  const handleGuideFinish = () => {
    setShowGuide(false);
  };

  const handleLogout = () => {
    // Clear any stored data
    localStorage.removeItem('aih.member.firstLogin');
    localStorage.removeItem('aih.guide.dismissed');
    localStorage.removeItem('memberCode');
    
    // Redirect to connect page
    window.location.href = '/connect';
  };

  // Vault handler functions
  const handleVaultSelection = async (type: string, item: any) => {
    console.log('🔄 VAULT SELECTION:', { 
      type, 
      itemId: item.id, 
      itemName: item.tuName || item.toMemberName || item.fromMemberName,
      itemKeys: Object.keys(item),
      itemData: item
    });
    
    // Stop previous polling
    stopMessagePolling();
    
    // Clear ALL vault-related state when switching vaults
    setTuMembers([]);
    setShowAllMembers(false);
    setMemberActiveStates({});
    setVaultMessages([]); // Clear messages from previous vault
    setNewMessage(''); // Clear any pending message input
    
    // Don't set vault ID until we have a valid one
    const newSelectedVault = {
      type,
      ...item,
      id: undefined, // Clear any existing vault ID
      vaultId: undefined
    };
    console.log('🔄 SETTING SELECTED VAULT:', newSelectedVault);
    setSelectedVault(newSelectedVault);
    
    // ✅ DEBUG: Track state changes
    setTimeout(() => {
      console.log('🔄 SELECTED VAULT STATE AFTER SET:', selectedVault);
    }, 100);
    
    let vaultId = item.vaultId; // Only use existing vaultId, not item.id
    
    // For trust bonds, we need to create or find the vault
    if (type === 'bond' && !vaultId) {
      try {
        // Determine the correct participant ID based on bond direction
        let participantId;
        if (item.direction === 'sent') {
          participantId = item.toMemberCode;
        } else {
          participantId = item.fromMemberCode;
        }
        
        console.log('🔗 Creating vault for trust bond:', {
          creatorId: memberCode,
          participantId: participantId,
          direction: item.direction,
          bondId: item.id,
          bondName: item.toMemberName || item.fromMemberName
        });
        
        const response = await fetch('/api/vaults/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creatorId: memberCode,
            participantId: participantId,
            vaultType: 'chat'
          })
        });
        
        const data = await response.json();
        console.log('Vault creation response:', data);
        
        if (data.ok && data.vaultId) {
          vaultId = data.vaultId;
          console.log('✅ Trust Bond vault created successfully:', vaultId);
          setSelectedVault((prev: any) => {
            const newState = { 
              ...prev, 
              id: vaultId, 
              vaultId,
              type: 'bond' // ✅ FIXED: Explicitly preserve bond type
            };
            console.log('🔄 BOND VAULT STATE UPDATE:', { prev, newState });
            return newState;
          });
        } else {
          console.error('Error creating vault:', data.error);
          setVaultMessages([]);
          // Clear the selected vault if creation failed
          setSelectedVault(null);
          return;
        }
      } catch (error) {
        console.error('Error creating vault:', error);
        setVaultMessages([]);
        return;
      }
    }
    
    // Load messages for this vault (only if we have a valid vault ID)
    if (vaultId && vaultId !== 'djM9F3H4dSFolA0yeWK1') {
      await loadVaultMessages(vaultId);
      // Start real-time polling
      startMessagePolling(vaultId);
    } else if (type === 'unit') {
      // Load TU members immediately when TU is selected
      console.log('🔄 TU SELECTED - Loading TU members for Trust Unit:', item.id);
      console.log('🔄 TU item data:', item);
      
      // Load REAL TU members (no test data)
      await loadTuMembers(item.id);
      
      // For Trust Units, we need to create a TU vault
      try {
        console.log('👥 Creating TU vault for Trust Unit:', {
          tuId: item.id,
          tuName: item.tuName,
          creatorId: memberCode
        });
        
        const response = await fetch('/api/vaults/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creatorId: memberCode,
            participantId: memberCode, // TU vaults include the creator
            vaultType: 'chat',
            tuId: item.id
          })
        });
        
        const data = await response.json();
        console.log('TU vault creation response:', data);
        
        if (data.ok && data.vaultId) {
          vaultId = data.vaultId;
          console.log('✅ TU vault created successfully:', vaultId);
          setSelectedVault((prev: any) => {
            const newState = { 
              ...prev, 
              id: vaultId, 
              vaultId,
              type: 'unit' // ✅ FIXED: Explicitly preserve unit type
            };
            console.log('🔄 UNIT VAULT STATE UPDATE:', { prev, newState });
            return newState;
          });
          await loadVaultMessages(vaultId);
          startMessagePolling(vaultId);
          
          // AUTO-FOCUS INPUT FIELD AFTER SUCCESSFUL VAULT CREATION
          setTimeout(() => {
            const inputField = document.getElementById('message-input');
            if (inputField) {
              inputField.focus();
              inputField.click();
            }
          }, 300);
        } else {
          console.error('Error creating TU vault:', data.error);
          setVaultMessages([]);
          // Clear the selected vault if creation failed
          setSelectedVault(null);
        }
      } catch (error) {
        console.error('Error creating TU vault:', error);
        setVaultMessages([]);
      }
    } else {
      console.error('No vault ID available for selection');
      setVaultMessages([]);
    }
  };

  const loadVaultMessages = async (vaultId: string) => {
    if (!vaultId) {
      console.log('No vault ID provided to loadVaultMessages');
      setVaultMessages([]);
      return;
    }
    
    // CRITICAL: Prevent loading messages for known invalid vault IDs
    if (vaultId === 'djM9F3H4dSFolA0yeWK1') {
      console.log('🚫 Blocked loading messages for invalid vault ID:', vaultId);
      setVaultMessages([]);
      return;
    }
    
    try {
      console.log(`Loading messages for vault: ${vaultId}`);
      const response = await fetch(`/api/vaults/${vaultId}/messages?memberCode=${memberCode}`);
      const data = await response.json();
      
      if (data.ok) {
        console.log(`Loaded ${data.messages?.length || 0} messages for vault ${vaultId}`);
        setVaultMessages(data.messages || []);
      } else {
        console.error('Error loading messages:', data.error);
        setVaultMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setVaultMessages([]);
    }
  };

  // Start real-time message polling
  const startMessagePolling = (vaultId: string) => {
    // CRITICAL: Prevent polling for invalid vault IDs
    if (vaultId === 'djM9F3H4dSFolA0yeWK1') {
      console.log('🚫 Blocked polling for invalid vault ID:', vaultId);
      return;
    }
    
    if (messagePollingInterval) {
      clearInterval(messagePollingInterval);
    }
    
    const interval = setInterval(async () => {
      await loadVaultMessages(vaultId);
    }, 2000); // Poll every 2 seconds
    
    setMessagePollingInterval(interval);
  };

  // Stop message polling
  const stopMessagePolling = () => {
    if (messagePollingInterval) {
      clearInterval(messagePollingInterval);
      setMessagePollingInterval(null);
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    setIsTyping(true);
    
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    const timeout = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
    
    setTypingTimeout(timeout);
  };

  // Handle message reaction
  const handleMessageReaction = async (messageId: string, reaction: string) => {
    if (!selectedVault) return;
    
    const vaultId = selectedVault.id || selectedVault.vaultId;
    if (!vaultId) return;
    
    try {
      const response = await fetch(`/api/vaults/${vaultId}/messages/${messageId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: memberCode,
          reaction
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        // Update local message state with new reactions
        setVaultMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, reactions: data.reactions }
            : msg
        ));
      } else {
        console.error('Error updating reaction:', data.error);
      }
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!selectedVault || !file) {
      console.error('No vault selected or no file provided');
      return;
    }
    
    const vaultId = selectedVault.id || selectedVault.vaultId;
    if (!vaultId) {
      console.error('No valid vault ID for file upload');
      return;
    }
    
    console.log('📁 Uploading file:', file.name, 'to vault:', vaultId);
    setUploadingFile(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('senderId', memberCode);
      formData.append('messageType', file.type.startsWith('image/') ? 'image' : 'file');
      
      console.log('📁 Sending file upload request...');
      const response = await fetch(`/api/vaults/${vaultId}/upload`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      console.log('📁 File upload response:', data);
      
      if (data.ok) {
        // Add message to local state
        setVaultMessages(prev => [...prev, data.message]);
        console.log('✅ File uploaded successfully:', data.message);
      } else {
        console.error('❌ Error uploading file:', data.error);
        alert(`File upload failed: ${data.error}`);
      }
    } catch (error) {
      console.error('❌ Error uploading file:', error);
      alert(`File upload failed: ${(error as Error).message}`);
    } finally {
      setUploadingFile(false);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Handle message editing
  const handleEditMessage = (message: any) => {
    setEditingMessage(message);
    setEditContent(message.content);
  };

  const handleSaveEdit = async () => {
    if (!editingMessage || !selectedVault) return;
    
    const vaultId = selectedVault.id || selectedVault.vaultId;
    if (!vaultId) return;
    
    try {
      const response = await fetch(`/api/vaults/${vaultId}/messages/${editingMessage.id}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: memberCode,
          content: editContent
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        // Update local message state
        setVaultMessages(prev => prev.map(msg => 
          msg.id === editingMessage.id 
            ? { ...msg, content: editContent, editedAt: new Date() }
            : msg
        ));
        setEditingMessage(null);
        setEditContent('');
      } else {
        console.error('Error editing message:', data.error);
      }
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  // Handle message deletion
  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedVault) return;
    
    const vaultId = selectedVault.id || selectedVault.vaultId;
    if (!vaultId) return;
    
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      const response = await fetch(`/api/vaults/${vaultId}/messages/${messageId}/delete?userId=${memberCode}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.ok) {
        // Update local message state
        setVaultMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: '[Message deleted]', deletedAt: new Date() }
            : msg
        ));
      } else {
        console.error('Error deleting message:', data.error);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedVault) return;
    
    const vaultId = selectedVault.id || selectedVault.vaultId;
    if (!vaultId) {
      console.error('No valid vault ID for sending message');
      return;
    }
    
    // Block sending to the known invalid vault ID
    if (vaultId === 'djM9F3H4dSFolA0yeWK1') {
      console.error('Cannot send message to invalid vault ID:', vaultId);
      return;
    }
    
    console.log(`📤 Sending message to vault: ${vaultId} (${selectedVault.type})`);
    
    try {
      const response = await fetch(`/api/vaults/${vaultId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: memberCode,
          content: newMessage,
          messageType: 'text'
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        // Add message to local state (only for current vault)
        setVaultMessages(prev => [...prev, data.message]);
        setNewMessage('');
        console.log(`✅ Message sent successfully to vault: ${vaultId}`);
      } else {
        console.error('Error sending message:', data.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleCreateVault = async (vaultType: string) => {
    if (!selectedVault) return;
    
    const participantId = selectedVault.type === 'bond' ? 
      selectedVault.memberCode : 
      selectedVault.id; // For TU vaults
    
    try {
      const response = await fetch('/api/vaults/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId: memberCode,
          participantId,
          vaultType,
          tuId: selectedVault.type === 'unit' ? selectedVault.id : null
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        if (data.existing) {
          // Vault already exists, load it
          await loadVaultMessages(data.vaultId);
        } else {
          // New vault created
          setSelectedVault((prev: any) => ({ ...prev, id: data.vaultId }));
          await loadVaultMessages(data.vaultId);
        }
        setShowVaultCreationModal(false);
      } else {
        console.error('Error creating vault:', data.error);
      }
    } catch (error) {
      console.error('Error creating vault:', error);
    }
  };

  const handleVoicePrintRecord = async (personNumber: string, name: string) => {
    if (!name.trim()) {
      setErrorMessage('Please enter the person\'s name first');
      setShowErrorModal(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        
        // Upload voice file
        const formData = new FormData();
        formData.append('file', blob, `${personNumber}_${name}.webm`);
        const mc = resolveMemberCode({ searchParams, memberData });
        if (!mc) {
          console.error('Missing memberCode for voice upload');
          return;
        }
        formData.append('memberCode', mc);
        formData.append('personNumber', personNumber);
        formData.append('name', name);
        
        const uploadResponse = await fetch('/api/voice/prints/upload', {
          method: 'POST',
          body: formData
        });
        
        const uploadData = await uploadResponse.json();
        
        if (uploadData.ok) {
          // Save voice print data
          const saveResponse = await fetch('/api/voice-prints', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              memberCode: mc,
              personNumber,
              name,
              voiceFile: uploadData.publicUrl,
              status: 'completed'
            })
          });
          
          const saveData = await saveResponse.json();
          
          if (saveData.ok) {
            // Update local state
            setVoicePrints(prev => ({
              ...prev,
              [personNumber]: {
                name,
                status: 'completed',
                voiceFile: uploadData.publicUrl
              }
            }));
            setCompletionStatus(saveData.completionStatus);
            setProgress(saveData.progress);
            
            setSuccessMessage(`Voice print for ${name} recorded successfully!`);
            setShowSuccessModal(true);
          }
        }
        
        setIsRecording(false);
        setCountdown(0);
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording with countdown
      setIsRecording(true);
      setCountdown(7);
      recorder.start();
      
      // Recording countdown
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            recorder.stop();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      setErrorMessage('Error recording voice print. Please try again.');
      setShowErrorModal(true);
      setIsRecording(false);
      setCountdown(0);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    setIsRecording(false);
    setCountdown(0);
    
    // Clear any existing countdown interval
    if (countdownInterval) {
      clearInterval(countdownInterval);
      setCountdownInterval(null);
    }
  };

  const toggleSection = (step: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [step as keyof typeof prev]: !prev[step as keyof typeof prev]
    }));
  };

  const handleAuthVoiceRecord = async (stepType: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        
        // Store the recorded blob for review
        setRecordedBlob(blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setCountdown(0);
      };
      
      // Start recording
      recorder.start();
      setIsRecording(true);
      setCountdown(7); // 7-second recording timer
      
      // Countdown timer
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            // AUTO-STOP RECORDING WHEN TIMER REACHES 0
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
              mediaRecorder.stop();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Store interval for cleanup
      setCountdownInterval(interval);
      
    } catch (error) {
      console.error('Recording error:', error);
      setErrorMessage('Failed to access microphone. Please check permissions.');
      setShowErrorModal(true);
      setIsRecording(false);
      setCountdown(0);
    }
  };

  const handleVoicePrintListen = (personNumber: string) => {
    const voicePrint = voicePrints[personNumber as keyof typeof voicePrints];
    if (voicePrint.voiceFile) {
      const audio = new Audio(URL.createObjectURL(voicePrint.voiceFile));
      audio.play();
    } else {
      setErrorMessage('No voice recording found for this person');
      setShowErrorModal(true);
    }
  };

  // Camera functions
  const testCamera = async () => {
    try {
      setCameraError('');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user', // Front camera for selfie
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      // Test successful - stop the stream
      stream.getTracks().forEach(track => track.stop());
      setCameraAvailable(true);
      setSuccessMessage('Camera is available and ready!');
      setShowSuccessModal(true);
    } catch (error) {
      setCameraAvailable(false);
      setCameraError((error as Error).message);
      setErrorMessage('Camera not available: ' + (error as Error).message);
      setShowErrorModal(true);
    }
  };

  const testMicrophone = async () => {
    try {
      setMicError('');
      console.log('Testing microphone access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Test successful - stop the stream
      stream.getTracks().forEach(track => track.stop());
      setMicAvailable(true);
      setSuccessMessage('Microphone is available and ready!');
      setShowSuccessModal(true);
    } catch (error) {
      setMicAvailable(false);
      setMicError((error as Error).message);
      setErrorMessage('Microphone not available: ' + (error as Error).message);
      setShowErrorModal(true);
    }
  };

  const startCamera = async () => {
    try {
      console.log('Requesting camera access...');
      setCameraError('');
      
      // Stop any existing media streams first
      if (cameraStream) {
        console.log('Stopping existing camera stream...');
        cameraStream.getTracks().forEach(track => track.stop());
      }
      
      // Stop any voice recording streams
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        console.log('Stopping voice recording...');
        mediaRecorder.stop();
      }
      
      // Wait a moment for streams to fully stop
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      console.log('Camera stream obtained:', stream);
      setCameraStream(stream);
      
      // Set video element source after a short delay to ensure ref is set
      setTimeout(() => {
        console.log('Setting video source, videoRef:', videoRef.current);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log('Video source set successfully');
        } else {
          console.log('Video ref not available yet, trying again...');
          // Try again after another delay
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              console.log('Video source set on retry');
            } else {
              console.error('Video ref still not available');
            }
          }, 200);
        }
      }, 100);
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError((error as Error).message);
      setErrorMessage('Failed to start camera: ' + (error as Error).message);
      setShowErrorModal(true);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current && cameraStream) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      // Set canvas dimensions to match video
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      // Draw video frame to canvas
      context?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64 image
      const photoData = canvas.toDataURL('image/jpeg', 0.8);
      setCurrentPhoto(photoData);
      
      // Save to API
      try {
        const mc = resolveMemberCode({ searchParams, memberData });
        if (!mc) {
          setErrorMessage("Missing memberCode. Open the dashboard with ?memberCode=YOURCODE");
          setShowErrorModal(true);
          return;
        }
        console.log('Saving profile photo for memberCode:', mc);
        
        const response = await fetch(`/api/user/profile-picture?memberCode=${mc}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            memberCode: mc,
            profilePicture: photoData
          })
        });
        
        console.log('API response status:', response.status);
        const responseData = await response.json();
        console.log('API response data:', responseData);
        
        if (response.ok) {
          console.log('Profile photo saved successfully');
          
          // Update memberData with new profile picture
          setMemberData((prev: any) => ({
            ...prev,
            profilePicture: photoData
          }));
          
          setSuccessMessage('Profile photo saved successfully!');
          setShowSuccessModal(true);
        } else {
          console.error('Failed to save profile photo:', responseData);
          setErrorMessage('Failed to save profile photo: ' + (responseData.error || 'Unknown error'));
          setShowErrorModal(true);
        }
      } catch (error) {
        console.error('Error saving profile photo:', error);
        setErrorMessage('Failed to save profile photo: ' + (error as Error).message);
        setShowErrorModal(true);
      }
      
      // Stop camera
      stopCamera();
      setShowCameraModal(false);
      
      setSuccessMessage('Profile photo captured and saved successfully!');
      setShowSuccessModal(true);
    }
  };

  const removePhoto = async () => {
    try {
      // Remove from local state
      setCurrentPhoto('');
      
      // Remove from database
      const mc = resolveMemberCode({ searchParams, memberData });
      if (!mc) {
        setErrorMessage("Missing memberCode. Open the dashboard with ?memberCode=YOURCODE");
        setShowErrorModal(true);
        return;
      }
      const response = await fetch(`/api/user/profile-picture?memberCode=${mc}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberCode: mc,
          profilePicture: null // Set to null to remove
        })
      });
      
      if (response.ok) {
        console.log('Profile photo removed from database');
        // Refresh member data to update the display
        if (memberCode) {
          const profileResponse = await fetch(`/api/user/profile?memberCode=${memberCode}`);
          const profileData = await profileResponse.json();
          if (profileData.ok) {
            setMemberData(profileData.profile);
          }
        }
      }
      
      setSuccessMessage('Profile photo removed');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error removing profile photo:', error);
      setErrorMessage('Failed to remove profile photo');
      setShowErrorModal(true);
    }
  };

  // Load existing profile picture when component mounts
  useEffect(() => {
    if (memberData?.profilePicture && !currentPhoto) {
      setCurrentPhoto(memberData.profilePicture);
    }
  }, [memberData?.profilePicture, currentPhoto]);

  // Handle auto-stop when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && isRecording && mediaRecorder) {
      console.log('Auto-stopping recording...');
      mediaRecorder.stop();
    }
  }, [countdown, isRecording, mediaRecorder]);

  // Start camera when modal opens
  useEffect(() => {
    console.log('Camera modal state changed:', showCameraModal);
    if (showCameraModal) {
      console.log('Starting camera...');
      startCamera();
    } else {
      console.log('Stopping camera...');
      stopCamera();
    }
    
    // Cleanup camera on unmount
    return () => {
      stopCamera();
    };
  }, [showCameraModal]);

  // Sequential completion handlers
  const handlePrimaryConfirm = () => {
    setPrimaryVoicePrint(prev => ({ ...prev, confirmed: true }));
    if (currentStep === 1) {
      setCurrentStep(2); // Move to Profile Confirm step
    }
  };

  const handleProfileConfirm = () => {
    setProfileConfirmPrint(prev => ({ ...prev, confirmed: true }));
    if (currentStep === 2) {
      setCurrentStep(3); // Move to Phone step
    }
  };

         const handlePhoneConfirm = () => {
           setPhoneConfirmed(true);
           // Profile completion is done - no alert, seamless flow
         };

         const handlePhoneRecord = () => {
           // Open voice recording modal for phone number
           setShowVoiceModal('phone');
         };

  const handlePrimaryRecord = () => {
    // Open voice recording modal for primary voice print
    setShowVoiceModal('primary');
  };

  const handleProfileRecord = () => {
    // Open voice recording modal for profile confirm voice print
    setShowVoiceModal('profile');
  };

  const handlePrimaryListen = async () => {
    try {
      console.log('🎵 handlePrimaryListen called - Starting primary voice playback...');
      const mc = resolveMemberCode({ searchParams, memberData });
      if (!mc) {
        console.error('Missing memberCode for voice playback');
        return;
      }
      console.log('🎵 Member code:', mc);
      
      // First check what's in the database
      console.log('🎵 Checking voice flow for memberCode:', mc);
      try {
        // Voice flow test removed
        // console.log('🎵 Voice flow test response status:', checkResponse.status);
        // const checkData = await checkResponse.json();
        // console.log('🎵 Voice flow test result:', JSON.stringify(checkData, null, 2));
      } catch (error) {
        console.error('🎵 Voice flow test failed:', error);
      }
      
      // Test simple endpoint first
      console.log('🎵 Testing simple endpoint...');
      // Simple test removed
      // const simpleData = await simpleResponse.json();
      // console.log('🎵 Simple test result:', simpleData);
      
      const apiUrl = `/api/voice/prints/get?memberCode=${memberCode}&personNumber=primary`;
      console.log('🎵 Calling REAL API:', apiUrl);
      
      const response = await fetch(apiUrl);
      console.log('🎵 API response status:', response.status);
      console.log('🎵 API response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('🎵 API response data:', JSON.stringify(data, null, 2));
      console.log('🎵 data.ok:', data.ok);
      console.log('🎵 data.audioUrl:', data.audioUrl);
      console.log('🎵 data.error:', data.error);
      console.log('🎵 data.code:', data.code);
      
      if (data.ok && data.audioUrl) {
        console.log('🎵 Audio URL received:', data.audioUrl);
        const audio = new Audio(data.audioUrl);
        console.log('🎵 Audio object created, attempting to play...');
        await audio.play();
        console.log('🎵 Audio playback started successfully');
      } else {
        console.error('🎵 No audio URL in response:', data);
        setErrorMessage('No voice recording found. Please record your voice first.');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('🎵 Error playing primary voice:', error);
        setErrorMessage('Failed to play voice recording: ' + (error as Error).message);
      setShowErrorModal(true);
    }
  };

  const handleProfileListen = () => {
    // For now, same as primary - in future this will be separate
    handlePrimaryListen();
  };

  const handleProfileConfirmListen = async () => {
    try {
      console.log('Playing profile confirm voice print...');
      const mc = resolveMemberCode({ searchParams, memberData });
      if (!mc) {
        console.error('Missing memberCode for profile confirm voice playback');
        return;
      }
      
      const response = await fetch(`/api/voice/prints/get?memberCode=${mc}&personNumber=profile`);
      const data = await response.json();
      
      if (data.ok && data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audio.play();
      } else {
        setErrorMessage('No voice recording found. Please record your voice first.');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error playing profile voice:', error);
        setErrorMessage('Failed to play voice recording: ' + (error as Error).message);
      setShowErrorModal(true);
    }
  };

  const handlePhoneListen = async () => {
    try {
      console.log('Playing phone voice print...');
      const mc = resolveMemberCode({ searchParams, memberData });
      if (!mc) {
        console.error('Missing memberCode for phone voice playback');
        return;
      }
      
      const response = await fetch(`/api/voice/prints/get?memberCode=${mc}&personNumber=phone`);
      const data = await response.json();
      
      if (data.ok && data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audio.play();
      } else {
        setErrorMessage('No voice recording found. Please record your voice first.');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error playing phone voice:', error);
        setErrorMessage('Failed to play voice recording: ' + (error as Error).message);
      setShowErrorModal(true);
    }
  };

  const renderContent = () => {
    const mc = resolveMemberCode({ searchParams, memberData });
    
    switch (activeSection) {
      case 'profile':
  return (
          <div className="space-y-6">
            {/* PROFILE SECTION */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-800">Profile</h2>
                <div className="text-sm text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full">
                  👤 Profile
                </div>
              </div>
              
              <div className="space-y-6">
                {/* PERSONAL AUTHENTICATION PROFILE */}
                <div>
                  <h3 className="text-lg font-medium text-slate-800 mb-4">Personal Authentication Profile</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* ACCESS INFO - PROGRESSIVE REVEAL */}
                     <div className="space-y-4">
                       <div className="flex items-center justify-between mb-4">
                         <h4 className="font-medium text-slate-800">ACCESS INFO</h4>
                         <div className="text-sm text-slate-600">
                           Progress: {currentStep}/3
                         </div>
                       </div>
                       
                       {/* Progress Steps Indicator - MOVED TO LEFT COLUMN */}
                       <div className="mb-4">
                         <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center space-x-4">
                             <div className={`flex items-center justify-center w-8 h-8 rounded-full ${primaryVoicePrint.confirmed ? 'bg-green-500 text-white' : currentStep === 1 ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                               1
                             </div>
                             <div className={`flex items-center justify-center w-8 h-8 rounded-full ${profileConfirmPrint.confirmed ? 'bg-green-500 text-white' : currentStep === 2 ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                               2
                             </div>
                             <div className={`flex items-center justify-center w-8 h-8 rounded-full ${phoneConfirmed ? 'bg-green-500 text-white' : currentStep === 3 ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                               3
                             </div>
                           </div>
                           <div className="text-sm text-slate-600">
                             {phoneConfirmed ? 'Complete!' : `Step ${currentStep} of 3`}
                           </div>
                         </div>
                         <div className="w-full bg-gray-200 rounded-full h-2">
                           <div 
                            className={`bg-blue-500 h-2 rounded-full transition-all duration-300 ${
                              currentStep === 1 ? 'w-1/3' : 
                              currentStep === 2 ? 'w-2/3' : 
                              'w-full'
                            }`}
                           ></div>
                         </div>
                       </div>
                       
                       
                       <div className="space-y-4">
                         {/* Step 1: Primary Voice Print - Always Visible */}
                         <div className={`p-4 rounded-lg border-2 ${currentStep === 1 ? 'border-blue-500 bg-blue-50' : primaryVoicePrint.confirmed ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                           <div className="flex items-center justify-between mb-1">
                             <label className="block text-sm font-medium text-slate-700">1. First, Last Name as Registered</label>
                             {primaryVoicePrint.confirmed && (
                               <button 
                                 onClick={() => toggleSection('step1')}
                                 className="text-green-600 text-lg hover:text-green-800 transition-colors cursor-pointer"
                                 title={expandedSections.step1 ? "Click to collapse" : "Click to expand"}
                               >
                                 {expandedSections.step1 ? '▼' : '✓'}
                               </button>
                             )}
                           </div>
                           
                           {/* Step 1 Content - Show if not completed OR if completed and expanded */}
                           {(!primaryVoicePrint.confirmed || expandedSections.step1) && (
                             <>
                               {/* Step 1 Instructions */}
                               <div className="mb-3 p-3 bg-blue-50 rounded-md">
                                 <p className="text-sm text-blue-800">
                                   <strong>Step 1:</strong> Record your full name clearly. Say: "My name is {memberData?.name || memberData?.fullName || 'FIRST LAST'} and I am a human!"
                                 </p>
                               </div>
                               
                               <input
                                 type="text"
                                 placeholder="Enter your first and last name"
                                 value={memberData?.name || memberData?.fullName || primaryVoicePrint.name || 'Your Name'}
                                 onChange={(e) => setPrimaryVoicePrint(prev => ({ ...prev, name: e.target.value }))}
                                 className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black font-medium"
                                 readOnly={!!(memberData?.name || memberData?.fullName) || primaryVoicePrint.confirmed}
                               />
                               
                               {(primaryVoicePrint.confirmed || memberData?.hasVoice) ? (
                                 <div className="flex gap-2 mt-2">
                                   <button 
                                     onClick={() => {
                                       console.log('🎵 Listen button clicked for Step 1 (completed)');
                                       handlePrimaryListen();
                                     }}
                                     className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center gap-1"
                                   >
                                     ▶️ Listen
          </button>
                                   <div className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm flex items-center gap-1">
                                     ✅ Complete
                                   </div>
                                 </div>
                               ) : (
                                 <div className="flex gap-2 mt-2">
                                   <button 
                                     onClick={() => setShowVoiceModal('primary')}
                                     className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm flex items-center gap-1"
                                   >
                                     🎤 Record
                                   </button>
                                   <button 
                                     onClick={() => {
                                       console.log('🎵 Listen button clicked for Step 1 (not completed)');
                                       handlePrimaryListen();
                                     }}
                                     className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center gap-1"
                                   >
                                     ▶️ Listen
          </button>
        </div>
                               )}
                             </>
                           )}
      </div>

                        {/* Step 2: Profile Confirm Voice Print - Only visible after Step 1 complete */}
                        {primaryVoicePrint.confirmed && (
                          <div className={`p-4 rounded-lg border-2 ${currentStep === 2 ? 'border-blue-500 bg-blue-50' : profileConfirmPrint.confirmed ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-sm font-medium text-slate-700">2. Confirm your registered name</label>
                              {profileConfirmPrint.confirmed && (
                                <button 
                                  onClick={() => toggleSection('step2')}
                                  className="text-green-600 text-lg hover:text-green-800 transition-colors cursor-pointer"
                                  title={expandedSections.step2 ? "Click to collapse" : "Click to expand"}
                                >
                                  {expandedSections.step2 ? '▼' : '✓'}
                                </button>
                              )}
                            </div>
                            
                            {/* Step 2 Content - Show if not completed OR if completed and expanded */}
                            {(!profileConfirmPrint.confirmed || expandedSections.step2) && (
                              <>
                                {/* Step 2 Instructions */}
                                <div className="mb-3 p-3 bg-green-50 rounded-md">
                                  <p className="text-sm text-green-800">
                                    <strong>Step 2:</strong> Say {memberData?.name || memberData?.fullName || 'FIRST NAME, LAST NAME'}; speak clearly.
                                  </p>
                                </div>
                                <input
                                  type="text"
                                  placeholder="Enter your profile confirm phrase"
                                  value={profileConfirmPrint.name || 'This is my profile confirm voice print'}
                                  onChange={(e) => setProfileConfirmPrint(prev => ({ ...prev, name: e.target.value }))}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black font-medium"
                                  readOnly={profileConfirmPrint.confirmed}
                                />
                                
                                {profileConfirmPrint.confirmed ? (
                                  <div className="flex gap-2 mt-2">
                                    <button 
                                      onClick={handleProfileConfirmListen}
                                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center gap-1"
                                    >
                                      ▶️ Listen
                                    </button>
                                    <div className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm flex items-center gap-1">
                                      ✅ Complete
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex gap-2 mt-2">
                                    <button 
                                      onClick={() => setShowVoiceModal('profile')}
                                      className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm flex items-center gap-1"
                                    >
                                      🎤 Record
                                    </button>
                                    <button 
                                      onClick={handleProfileConfirmListen}
                                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center gap-1"
                                    >
                                      ▶️ Listen
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                        </div>
                        )}

                        {/* Step 3: Phone Voice Print - Only visible after Step 2 complete */}
                        {profileConfirmPrint.confirmed && (
                          <div className={`p-4 rounded-lg border-2 ${currentStep === 3 ? 'border-blue-500 bg-blue-50' : phoneConfirmed ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-sm font-medium text-slate-700">3. Phone Voice Print</label>
                              {phoneConfirmed && (
                                <button 
                                  onClick={() => toggleSection('step3')}
                                  className="text-green-600 text-lg hover:text-green-800 transition-colors cursor-pointer"
                                  title={expandedSections.step3 ? "Click to collapse" : "Click to expand"}
                                >
                                  {expandedSections.step3 ? '▼' : '✓'}
                                </button>
                              )}
                            </div>
                            
                            {/* Step 3 Content - Show if not completed OR if completed and expanded */}
                            {(!phoneConfirmed || expandedSections.step3) && (
                              <>
                                {/* Step 3 Instructions */}
                                <div className="mb-3 p-3 bg-purple-50 rounded-md">
                                  <p className="text-sm text-purple-800">
                                    <strong>Step 3:</strong> Record your phone number clearly. Say: "My phone number is {memberData?.phone || phoneVoicePrint.phone || 'YOUR_PHONE'} for AM I HUMAN.net"
                                  </p>
                                </div>
                                <input
                                  type="text"
                                  placeholder="Enter your phone number"
                                  value={phoneVoicePrint.phone || memberData?.phone || ''}
                                  onChange={(e) => setPhoneVoicePrint(prev => ({ ...prev, phone: e.target.value }))}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black font-medium"
                                  readOnly={phoneConfirmed}
                                />
                                
                                {phoneConfirmed ? (
                                  <div className="flex gap-2 mt-2">
                                    <button 
                                      onClick={handlePhoneListen}
                                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center gap-1"
                                    >
                                      ▶️ Listen
                                    </button>
                                    <div className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm flex items-center gap-1">
                                      ✅ Complete
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex gap-2 mt-2">
                                    <button 
                                      onClick={() => setShowVoiceModal('phone')}
                                      className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm flex items-center gap-1"
                                    >
                                      🎤 Record
                                    </button>
                                    <button 
                                      onClick={handlePhoneListen}
                                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center gap-1"
                                    >
                                      ▶️ Listen
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* PROFILE PHOTO - MOVED TO RIGHT COLUMN */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-slate-800">PROFILE PHOTO</h4>
                        {/* Photo Status Icon */}
                        <div className="flex items-center space-x-2">
                          {(currentPhoto || memberData?.profilePicture) ? (
                            <div className="flex items-center space-x-1 text-green-600" title="Photo Uploaded">
                              <span className="text-lg">✅</span>
                              <span className="text-xs font-medium">Complete</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 text-orange-600" title="No Photo Uploaded">
                              <span className="text-lg">⏳</span>
                              <span className="text-xs font-medium">Incomplete</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Current Photo Display */}
                        <div>
                          <h5 className="text-sm font-medium text-slate-700 mb-2">Current Photo</h5>
                          
                          {(currentPhoto || memberData?.profilePicture) ? (
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                              <div className="text-center">
                                <img 
                                  src={currentPhoto || memberData?.profilePicture} 
                                  alt="Profile" 
                                  className="w-20 h-20 rounded-full object-cover border-2 border-green-300 mx-auto mb-2"
                                />
                                <div className="flex gap-1 justify-center">
                                  <button 
                                    onClick={() => setShowCameraModal(true)}
                                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                  >
                                    📸 Change
                                  </button>
                                  <button 
                                    onClick={removePhoto}
                                    className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                  >
                                    🗑️ Remove
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
                              <div className="text-gray-400 text-2xl mb-1">📷</div>
                              <p className="text-gray-500 text-xs">No photo captured yet</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Camera Controls */}
                        <div>
                          <h5 className="text-sm font-medium text-slate-700 mb-2">Camera Controls</h5>
                          
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-slate-700">Camera Status</span>
                              <div className="text-xs text-slate-600">
                                {cameraAvailable ? '✅ Available' : '❌ Not Available'}
                              </div>
                            </div>
                            
                            <p className="text-xs text-blue-800 mb-3">
                              This must be a current, live selfie taken with your device's camera.
                            </p>
                            
                            <div className="space-y-2">
                              {/* Simple Take Pic Button */}
                              <button 
                                onClick={() => setShowCameraModal(true)}
                                className="w-full px-3 py-2 bg-green-600 text-white rounded text-xs hover:bg-green-700 flex items-center justify-center gap-1"
                              >
                                📸 Take Pic
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>


    </div>
  );
      case 'overview':
        return (
          <div className="space-y-6">
            {/* HERO SECTION - THREE DIVS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* WHAT'S NEW TILE - LEFT */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center">
                    <span className="mr-2 text-green-500">🆕</span>
                    What's New!
                </h2>
                  <div className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full">
                    Live
                </div>
              </div>
              
              <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">Trust Bonds Active</p>
                      <p className="text-xs text-slate-600">2 active connections in your network</p>
                    </div>
                  </div>
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                      <p className="text-sm font-medium text-slate-800">Trust Units Connected</p>
                      <p className="text-xs text-slate-600">1 fully connected trust unit</p>
                  </div>
                </div>
                  <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                      <p className="text-sm font-medium text-slate-800">Member Status</p>
                      <p className="text-xs text-slate-600">All members active and verified</p>
                  </div>
                </div>
              </div>
            </div>

              {/* VAULT UPDATES - MIDDLE */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-slate-800 flex items-center">
                    <span className="mr-2 text-orange-500">🔒</span>
                    Vault Updates
                  </h2>
                  <div className="text-sm text-orange-600 font-medium bg-orange-50 px-3 py-1 rounded-full">
                    Secure
              </div>
            </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">Data Protection</p>
                      <p className="text-xs text-slate-600">Enterprise-grade encryption active</p>
                            </div>
                          </div>
                  <div className="flex items-start space-x-3 p-3 bg-amber-50 rounded-lg">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">Backup Status</p>
                      <p className="text-xs text-slate-600">All data securely backed up</p>
                          </div>
                        </div>
                  <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">Access Logs</p>
                      <p className="text-xs text-slate-600">All vault access monitored</p>
                      </div>
                  </div>
              </div>
            </div>

              {/* SYSTEM UPDATES - RIGHT */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center">
                  <span className="mr-2 text-blue-500">🆕</span>
                    System Updates
                </h2>
                <div className="text-sm text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full">
                    Latest
                          </div>
                        </div>
                        
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">Trust Unit System Live!</p>
                    <p className="text-xs text-slate-600">Connect with your loved ones through shared sponsors</p>
                                  </div>
                                </div>
                <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">Enhanced Security</p>
                    <p className="text-xs text-slate-600">Your data is now protected with enterprise-grade security</p>
                                </div>
                              </div>
                  <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">UI Improvements</p>
                      <p className="text-xs text-slate-600">New dashboard layout and navigation updates</p>
                                </div>
                            </div>
                        </div>
                      </div>
                  </div>

            {/* IPSOM DIVISION */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">Ipsom</h3>
              <div className="bg-white rounded border border-slate-300 overflow-hidden shadow-sm p-6">
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-slate-800 mb-4">Ipsom Content</h4>
                  <p className="text-slate-600 mb-4">
                    This is the Ipsom section placeholder. Content will be added here.
                  </p>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-500">
                      Ipsom lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                      Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                    </p>
                  </div>
                      </div>
              </div>
            </div>
          </div>
        );
      case 'invites':
        return (
          <div className="space-y-6">
            {/* INVITES SECTION */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-800">Invites</h2>
                <div className="text-sm text-purple-600 font-medium bg-purple-50 px-3 py-1 rounded-full">
                  ✉️ Invites
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LEFT SIDE - MEMBER INVITE (LOVED ONES) SCRIPT */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-800 mb-4">Member Invite (Loved Ones)</h3>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-3">Invite Your Loved Ones</h4>
                    <p className="text-sm text-blue-700 mb-4">
                      Send invitations to your loved ones to join AM I HUMAN.net and create your trusted network.
                    </p>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          First, Last Name
                        </label>
                        <input
                          type="text"
                          value={inviteForm.name}
                          onChange={(e) => handleInviteFormChange('name', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter their full name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Cell phone number
                        </label>
                        <input
                          type="tel"
                          value={inviteForm.phone}
                          maxLength={14}
                          onChange={(e) => {
                            // Format phone number as user types
                            let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                            
                            // Limit to 10 digits maximum
                            if (value.length > 10) {
                              value = value.substring(0, 10);
                            }
                            
                            // Apply formatting based on length
                            if (value.length >= 6) {
                              value = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
                            } else if (value.length >= 3) {
                              value = value.replace(/(\d{3})(\d{0,3})/, '($1) $2');
                            }
                            
                            handleInviteFormChange('phone', value);
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Message Preview
                        </label>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="text-sm text-yellow-800 mb-2">
                            <strong>Message that will be sent:</strong>
                          </div>
                          <div className="text-sm text-yellow-700 font-mono bg-white p-3 rounded border">
                            Hi {inviteForm.name || '[first name]'}, I need you! Will you verify I am human! It's part of a network I am building. It maybe something you will be interested in. Why? No bots, no scammers, just the people I love... I love you!! Thank you! {memberData?.name || memberData?.fullName || '[member name]'}
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={handleConfirmInvite}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Confirm Invitation
                      </button>
                    </div>
                  </div>
                  
                </div>
                
        {/* RIGHT SIDE - PREVIEW SECTION */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-800 mb-4">
            {showInvitePreview ? 'Invitation Preview' : 'Confirmation'}
          </h3>
          
          {showInvitePreview ? (
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h4 className="font-medium text-slate-800 mb-3">Invitation Preview</h4>
              
              {/* Member Picture */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200">
                  {memberData?.profilePicture ? (
                    <img
                      src={memberData.profilePicture}
                      alt="Member profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {memberData?.name?.charAt(0) || 'M'}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-slate-800">{capitalizeName(memberData?.name) || 'Member'}</p>
                  <p className="text-sm text-slate-600">AM I HUMAN.net Member</p>
                </div>
              </div>
              
              {/* Formatted Note */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="text-sm text-slate-700 leading-relaxed">
                  <p className="mb-2">
                    <strong>To:</strong> {inviteForm.name || '[Name]'}
                  </p>
                  <p className="mb-2">
                    <strong>Phone:</strong> {inviteForm.phone || '[Phone]'}
                  </p>
                  <div className="border-t border-yellow-300 pt-3 mt-3">
                    <p className="text-sm text-slate-600 italic">
                      Hi {inviteForm.name || '[first name]'}, I need you! Will you verify I am human! It's part of a network I am building. It maybe something you will be interested in. Why? No bots, no scammers, just the people I love... I love you!! Thank you! {memberData?.name || memberData?.fullName || '[member name]'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Send and Edit Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleSendInvite}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Send Invitation
                </button>
                <button
                  onClick={handleEditInvite}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Edit
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h4 className="font-medium text-slate-800 mb-3">When complete, Your invitation can be previewed here</h4>
            </div>
          )}
        </div>
      </div>
      
      {/* FULL WIDTH - YOUR INVITED LOVED ONES SECTION */}
      <div className="mt-8">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
          <h4 className="font-medium text-slate-800 mb-4 text-lg">Your Invited Loved Ones</h4>
          {invitedLovedOnes.length > 0 ? (
            <div className="overflow-x-auto">
              {/* Column Headers */}
              <div className="grid grid-cols-12 gap-2 mb-3 px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-600 uppercase tracking-wide">
                <div className="col-span-3">Name</div>
                <div className="col-span-2">Phone</div>
                <div className="col-span-3">Sent Date</div>
                <div className="col-span-2">QR Code</div>
                <div className="col-span-2">Actions</div>
              </div>
              
              {/* Invite Rows */}
              <div className="space-y-1">
                {invitedLovedOnes.map((invite, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 p-2 bg-white rounded border hover:bg-slate-50 transition-colors">
                    {/* Name */}
                    <div className="col-span-3 flex items-center">
                      <div className="flex items-center space-x-2">
                        {/* Check if this invite is part of a Trust Unit */}
                        {(() => {
                          const isTrustUnit = trustUnits.some(unit => 
                             unit.members.some((member: any) =>
                              member.memberCode === invite.phone || member.memberCode === invite.name
                            )
                          );
                          
                          if (isTrustUnit) {
                            return <span className="text-sm">👑</span>;
                          } else if (invite.status === 'accepted' || invite.status === 'registered') {
                            return <span className="text-sm">💎</span>;
                          } else if (invite.status === 'trust-unit') {
                            return <span className="text-sm">👑</span>;
                          }
                          return null;
                        })()}
                        <span className="font-medium text-slate-800 truncate">{capitalizeName(invite.name)}</span>
                      </div>
                    </div>
                    
                    {/* Phone */}
                    <div className="col-span-2 flex items-center">
                      <span className="text-sm text-slate-600 font-mono">{invite.phone}</span>
                    </div>
                    
                    {/* Sent Date */}
                    <div className="col-span-3 flex items-center">
                      <span className="text-xs text-slate-500">
                        {new Date(invite.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    
                    {/* QR Code */}
                    <div className="col-span-2 flex items-center justify-center">
                      <button 
                        onClick={() => openQRModal(invite)}
                        className="text-xs text-green-600 hover:text-green-800 px-2 py-1 rounded border border-green-200 hover:bg-green-50 transition-colors"
                        title="View QR Code"
                      >
                        📱 QR
                      </button>
                    </div>
                    
                    {/* Actions */}
                    <div className="col-span-2 flex items-center space-x-1">
                      <select
                        value={invite.status}
                        onChange={(e) => handleStatusChange(invite.inviteId, e.target.value)}
                        className="text-xs border border-slate-300 rounded px-1 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        aria-label={`Update status for ${capitalizeName(invite.name)}`}
                      >
                        <option value="sent">📧 Sent</option>
                        <option value="pending">⏳ Pending</option>
                        <option value="accepted">💎 Trust Bond</option>
                        <option value="trust-unit">👑 Trust Unit</option>
                        <option value="declined">❌ Declined</option>
                      </select>
                      <button 
                        className="text-xs text-blue-600 hover:text-blue-800 px-1"
                        title="View Details"
                      >
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Summary */}
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Total Invites: {invitedLovedOnes.length}</span>
                  <span>
                    Accepted: {invitedLovedOnes.filter(i => i.status === 'accepted').length} | 
                    Pending: {invitedLovedOnes.filter(i => i.status === 'pending').length} | 
                    Sent: {invitedLovedOnes.filter(i => i.status === 'sent').length}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📧</div>
              <p className="text-sm text-slate-600 mb-2">No invitations sent yet</p>
              <p className="text-xs text-slate-500">Start building your trusted network by inviting your loved ones</p>
            </div>
          )}
        </div>
      </div>
      </div>
      </div>
        );
      case 'groups':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-800">Connections</h2>
                <div className="text-sm text-orange-600 font-medium bg-orange-50 px-3 py-1 rounded-full">
                  👥 Connections
                </div>
              </div>
              
              {/* Sponsor Section - PROFESSIONAL TABLE */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">Sponsor</h3>
                <div className="bg-white rounded border border-slate-300 overflow-hidden shadow-sm">
                    {memberData?.sponsorName ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300">
                          <th className="px-3 py-2 text-left font-medium text-slate-600 w-1/6">Name</th>
                          <th className="px-3 py-2 text-left font-medium text-slate-600 w-1/6">Member Code</th>
                          <th className="px-3 py-2 text-left font-medium text-slate-600 w-1/6">Sent Date</th>
                          <th className="px-3 py-2 text-left font-medium text-slate-600 w-1/6">Accept Date</th>
                          <th className="px-3 py-2 text-center font-medium text-slate-600 w-1/6"></th>
                          <th className="px-3 py-2 text-left font-medium text-slate-600 w-1/6">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-slate-50">
                          <td className="px-3 py-3 font-medium text-slate-800 w-1/6">
                            {capitalizeName(memberData.sponsorName || '')}
                          </td>
                          <td className="px-3 py-3 text-slate-600 font-mono w-1/6">
                            {memberData?.sponsorMemberCode || memberData?.sponsorId || 'N/A'}
                          </td>
                          <td className="px-3 py-3 text-slate-600 w-1/6">
                            {memberData?.createdAt ? new Date(memberData.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-3 py-3 text-slate-600 w-1/6">
                            {memberData?.createdAt ? new Date(memberData.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-3 py-3 text-center text-slate-600 w-1/6">
                            Admin
                          </td>
                          <td className="px-3 py-3 w-1/6">
                            <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700 border border-green-300">
                              ACTIVE
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  ) : (
                    <div className="px-4 py-6 text-center text-slate-500 text-sm">
                      No sponsor assigned
                          </div>
                    )}
                          </div>
                        </div>

              {/* Trust Bonds - PROFESSIONAL TABLE */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Trust Bonds ({trustBonds.length})
                </h3>
                <div className="bg-white rounded border border-slate-300 overflow-hidden shadow-sm">
                  {trustBonds.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300">
                          <th className="px-3 py-2 text-left font-medium text-slate-600 w-1/6">From</th>
                          <th className="px-3 py-2 text-left font-medium text-slate-600 w-1/6">To</th>
                          <th className="px-3 py-2 text-left font-medium text-slate-600 w-1/6">Sent Date</th>
                          <th className="px-3 py-2 text-left font-medium text-slate-600 w-1/6">Accept Date</th>
                          <th className="px-3 py-2 text-center font-medium text-slate-600 w-1/6"></th>
                          <th className="px-3 py-2 text-left font-medium text-slate-600 w-1/6">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trustBonds.map((bond: any) => {
                          // Debug: Log the bond data to see what fields are available
                          console.log('🔍 Trust Bond Data (Groups Tab):', {
                            id: bond.id,
                            createdAt: bond.createdAt,
                            acceptedAt: bond.acceptedAt,
                            status: bond.status,
                            type: bond.type
                          });
                          
                          // Parse sent date (createdAt) - Handle Firestore Timestamp format
                          let sentDate = 'N/A';
                          try {
                            if (bond.createdAt) {
                              if (bond.createdAt._seconds) {
                                // Firestore Timestamp format
                                sentDate = new Date(bond.createdAt._seconds * 1000).toLocaleDateString();
                              } else if (bond.createdAt.seconds) {
                                // Standard Timestamp format
                                sentDate = new Date(bond.createdAt.seconds * 1000).toLocaleDateString();
                              } else if (typeof bond.createdAt === 'string') {
                                sentDate = new Date(bond.createdAt).toLocaleDateString();
                              } else if (bond.createdAt instanceof Date) {
                                sentDate = bond.createdAt.toLocaleDateString();
                              }
                            }
                          } catch (e) {
                            console.log('❌ Error parsing sentDate (Groups):', e);
                            sentDate = 'N/A';
                          }
                          
                          // Parse accept date (acceptedAt) - Handle Firestore Timestamp format
                          let acceptDate = 'Pending';
                          try {
                            if (bond.acceptedAt) {
                              if (bond.acceptedAt._seconds) {
                                // Firestore Timestamp format
                                acceptDate = new Date(bond.acceptedAt._seconds * 1000).toLocaleDateString();
                              } else if (bond.acceptedAt.seconds) {
                                // Standard Timestamp format
                                acceptDate = new Date(bond.acceptedAt.seconds * 1000).toLocaleDateString();
                              } else if (typeof bond.acceptedAt === 'string') {
                                acceptDate = new Date(bond.acceptedAt).toLocaleDateString();
                              } else if (bond.acceptedAt instanceof Date) {
                                acceptDate = bond.acceptedAt.toLocaleDateString();
                              }
                            } else if (bond.status === 'accepted') {
                              // If status is accepted but no acceptedAt, use createdAt as fallback
                              acceptDate = sentDate;
                            }
                          } catch (e) {
                            console.log('❌ Error parsing acceptDate (Groups):', e);
                            acceptDate = 'N/A';
                          }
                          
                          return (
                            <tr key={bond.id} className="hover:bg-slate-50 border-b border-slate-200 last:border-0">
                              <td className="px-3 py-3 w-1/6">
                                <div className="font-medium text-slate-800">{capitalizeName(bond.fromMemberName || '')}</div>
                                <div className="text-xs text-slate-500 font-mono">{bond.fromMemberCode}</div>
                              </td>
                              <td className="px-3 py-3 w-1/6">
                                <div className="font-medium text-slate-800">{capitalizeName(bond.toMemberName || '')}</div>
                                <div className="text-xs text-slate-500 font-mono">{bond.toMemberCode}</div>
                              </td>
                              <td className="px-3 py-3 text-slate-600 w-1/6">
                                {sentDate}
                              </td>
                              <td className="px-3 py-3 text-slate-600 w-1/6">
                                {acceptDate}
                              </td>
                              <td className="px-3 py-3 text-center text-slate-600 w-1/6">
                                <div className="text-xs">
                                  <div>{bond.type === 'sponsor' ? 'Sponsor' : 'Standard'}</div>
                                  <div className="text-slate-500">Size: 2</div>
                      </div>
                              </td>
                              <td className="px-3 py-3 w-1/6">
                                <span className={`px-2 py-1 rounded text-xs font-medium border ${
                                  bond.status === 'accepted' 
                                    ? 'bg-green-100 text-green-700 border-green-300' 
                                    : 'bg-gray-100 text-gray-600 border-gray-300'
                                }`}>
                                  {bond.status === 'accepted' ? 'ACTIVE' : 'PENDING'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="px-4 py-6 text-center text-slate-500 text-sm">
                      No trust bonds established
                      </div>
                    )}
                  </div>
                </div>
              
              {/* Trust Units - CLEAN DESIGN: SEPARATE TYPES */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Trust Units ({trustUnits.length})
                </h3>
                
                  {trustUnits.length > 0 ? (
                  (() => {
                    // Group TUs by type
                    const sameSponsorTUs = trustUnits.filter((tu: any) => tu.tuType === 'same_sponsor' || tu.type === 'same_sponsor');
                    const triangleCloseTUs = trustUnits.filter((tu: any) => tu.tuType === 'triangle_close' || tu.type === 'triangle_close');
                    
                    return (
                      <div className="space-y-4">
                        {/* SAME-SPONSOR TUs */}
                        {sameSponsorTUs.length > 0 && (
                          <div className="bg-white rounded border border-slate-300 overflow-hidden shadow-sm">
                            <div className="bg-blue-50 px-4 py-2 border-b border-blue-200">
                              <h4 className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
                                Same-Sponsor Units ({sameSponsorTUs.length})
                              </h4>
              </div>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-slate-100 border-b border-slate-300">
                                  <th className="px-3 py-2 text-left font-medium text-slate-600 w-1/6">Members</th>
                                  <th className="px-3 py-2 text-left font-medium text-slate-600 w-1/6">Unit ID</th>
                                  <th className="px-3 py-2 text-left font-medium text-slate-600 w-1/6"></th>
                                  <th className="px-3 py-2 text-left font-medium text-slate-600 w-1/6">Accept Date</th>
                                  <th className="px-3 py-2 text-center font-medium text-slate-600 w-1/6"></th>
                                  <th className="px-3 py-2 text-left font-medium text-slate-600 w-1/6">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sameSponsorTUs.map((unit: any) => {
                          // Debug: Log the unit data to see what fields are available
                          console.log('🔍 Trust Unit Data (Groups Tab):', {
                            id: unit.id,
                            createdAt: unit.createdAt,
                            status: unit.status,
                            members: unit.members,
                            size: unit.size
                          });
                          
                          let createdDate = 'N/A';
                          try {
                            if (unit.createdAt) {
                              if (unit.createdAt._seconds) {
                                // Firestore Timestamp format
                                createdDate = new Date(unit.createdAt._seconds * 1000).toLocaleDateString();
                              } else if (unit.createdAt.seconds) {
                                // Standard Timestamp format
                                createdDate = new Date(unit.createdAt.seconds * 1000).toLocaleDateString();
                              } else if (typeof unit.createdAt === 'string') {
                                createdDate = new Date(unit.createdAt).toLocaleDateString();
                              } else if (unit.createdAt instanceof Date) {
                                createdDate = unit.createdAt.toLocaleDateString();
                              }
                            }
                          } catch (e) {
                            console.log('❌ Error parsing createdDate (Groups):', e);
                            createdDate = 'N/A';
                          }
                          
                          return (
                            <tr key={unit.id} className="hover:bg-slate-50 border-b border-slate-200 last:border-0">
                              {/* Members Column */}
                              <td className="px-3 py-3 w-1/6">
                                {(() => {
                                  const actualSize = Array.isArray(unit.members) ? unit.members.length : 0;
                                  const hasExpandedView = actualSize > 3;
                                  
                                  if (hasExpandedView) {
                                    return (
                                      <div className="space-y-1">
                                        {unit.members.slice(0, 3).map((member: any, idx: number) => {
                                          const memberName = typeof member === 'string' ? member : member.name || member.memberCode;
                                          const memberStatus = typeof member === 'string' ? 'pending' : member.status || 'pending_connection';
                                          const emoji = memberStatus === 'connected' ? '✅' : memberStatus === 'waiting' ? '⏸️' : '⏳';
                                          
                                          return (
                                            <div key={idx} className="flex items-center space-x-1">
                                              <span className="text-xs">{emoji}</span>
                                              <span className="text-xs text-slate-700">{memberName}</span>
                    </div>
                                          );
                                        })}
                                        {actualSize > 3 && (
                                          <details className="text-xs text-blue-600 cursor-pointer">
                                            <summary className="font-medium hover:text-blue-700">
                                              +{actualSize - 3} more members
                                            </summary>
                                            <div className="mt-1 space-y-1 pl-3">
                                              {unit.members.slice(3).map((member: any, idx: number) => {
                                                const memberName = typeof member === 'string' ? member : member.name || member.memberCode;
                                                const memberStatus = typeof member === 'string' ? 'pending' : member.status || 'pending_connection';
                                                const emoji = memberStatus === 'connected' ? '✅' : memberStatus === 'waiting' ? '⏸️' : '⏳';
                                                
                                                return (
                                                  <div key={idx} className="flex items-center space-x-1">
                                                    <span className="text-xs">{emoji}</span>
                                                    <span className="text-xs text-slate-700">{memberName}</span>
                  </div>
                                                );
                                              })}
                              </div>
                                          </details>
                                        )}
                              </div>
                                    );
                                  } else {
                                    return (
                                      <div className="flex flex-wrap gap-1">
                                        {unit.members?.map((member: any, idx: number) => {
                                          const memberName = typeof member === 'string' ? member : member.name || member.memberCode;
                                          const memberStatus = typeof member === 'string' ? 'pending' : member.status || 'pending_connection';
                                          const emoji = memberStatus === 'connected' ? '✅' : memberStatus === 'waiting' ? '⏸️' : '⏳';
                                          
                                          return (
                                            <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                                              {emoji} {memberName}
                                            </span>
                                          );
                                        })}
                            </div>
                                    );
                                  }
                                })()}
                              </td>
                              {/* Unit ID Column (Second) */}
                              <td className="px-3 py-3 text-slate-600 font-mono text-xs w-1/6">
                                #{unit.id?.slice(-8) || 'N/A'}
                              </td>
                              
                              {/* Empty Column (Third - No Sent Date) */}
                              <td className="px-3 py-3 text-slate-600 w-1/6">
                                -
                              </td>
                              
                              {/* Accept Date Column (Fourth) */}
                              <td className="px-3 py-3 text-slate-600 w-1/6">
                                {createdDate}
                              </td>
                              
                              {/* Type Column (Fifth - NONE) */}
                              <td className="px-3 py-3 text-center text-slate-600 w-1/6">
                                <div className="text-xs">
                                  <div>{unit.tuType === 'same_sponsor' ? 'Same-Sponsor' : unit.tuType === 'triangle_close' ? 'Triangle-Close' : 'TU'}</div>
                                  <div className="text-slate-500">Type</div>
                          </div>
                              </td>
                              
                              {/* Status Column (Sixth) */}
                              <td className="px-3 py-3 w-1/6">
                                <span className={`px-2 py-1 rounded text-xs font-medium border ${
                                  unit.status === 'active' || unit.status === 'fully_connected'
                                    ? 'bg-green-100 text-green-700 border-green-300' 
                                    : 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                }`}>
                                  {unit.status === 'active' || unit.status === 'fully_connected' ? 'ACTIVE' : 'PENDING'}
                                    </span>
                              </td>
                            </tr>
                          );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                        
                        {/* TRIANGLE-CLOSE TUs */}
                        {triangleCloseTUs.length > 0 && (
                          <div className="bg-white rounded border border-slate-300 overflow-hidden shadow-sm">
                            <div className="bg-purple-50 px-4 py-2 border-b border-purple-200">
                              <h4 className="text-xs font-semibold text-purple-900 uppercase tracking-wide">
                                Triangle-Close Units ({triangleCloseTUs.length})
                              </h4>
                              <p className="text-xs text-purple-700 mt-0.5">Cross-connections under same root</p>
                                </div>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-slate-100 border-b border-slate-300">
                                  <th className="px-4 py-2 text-left font-medium text-slate-600">Unit ID</th>
                                  <th className="px-4 py-2 text-left font-medium text-slate-600">Root</th>
                                  <th className="px-4 py-2 text-left font-medium text-slate-600">Members</th>
                                  <th className="px-4 py-2 text-left font-medium text-slate-600">Size</th>
                                  <th className="px-4 py-2 text-left font-medium text-slate-600">Created</th>
                                  <th className="px-4 py-2 text-left font-medium text-slate-600">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {triangleCloseTUs.map((unit: any) => {
                                  let createdDate = 'N/A';
                                  try {
                                    if (unit.createdAt) {
                                      if (unit.createdAt.seconds) {
                                        createdDate = new Date(unit.createdAt.seconds * 1000).toLocaleDateString();
                                      } else if (typeof unit.createdAt === 'string') {
                                        createdDate = new Date(unit.createdAt).toLocaleDateString();
                                      }
                                    }
                                  } catch (e) {
                                    createdDate = 'N/A';
                                  }
                                  
                                  return (
                                    <tr key={unit.id} className="hover:bg-slate-50 border-b border-slate-200 last:border-0">
                                      <td className="px-4 py-3 font-mono text-slate-600">
                                        #{unit.id?.slice(-8) || 'N/A'}
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center space-x-1">
                                          <span className="text-sm">👑</span>
                                          <span className="text-xs text-slate-700">{unit.sponsorName || 'Root'}</span>
                                  </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                          {unit.members?.map((member: any, idx: number) => {
                                            const memberName = typeof member === 'string' ? member : member.name || member.memberCode;
                                            return (
                                              <span key={idx} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                                {memberName}
                                              </span>
                                            );
                                          })}
                              </div>
                                      </td>
                                      <td className="px-4 py-3 text-slate-600">
                                        {unit.members?.length || 0}
                                      </td>
                                      <td className="px-4 py-3 text-slate-600">
                                        {createdDate}
                                      </td>
                                      <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium border ${
                                          unit.status === 'active' || unit.status === 'fully_connected'
                                            ? 'bg-green-100 text-green-700 border-green-300' 
                                            : 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                        }`}>
                                          {unit.status === 'active' || unit.status === 'fully_connected' ? 'ACTIVE' : 'PENDING'}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                        </div>
                    );
                  })()
                ) : (
                  <div className="px-4 py-6 text-center text-slate-500 text-sm bg-white rounded border border-slate-300">
                    No trust units created yet - Units form when you invite 2+ members
                      </div>
                    )}
                  </div>
                </div>
              </div>
        );
      case 'network':
        return <TrustNetworkManager memberCode={mc} />;
      case 'vaults':
        return (
          <div className="h-full flex">
            {/* CENTER - Chat Session Area */}
            <div className="flex-1 flex flex-col border-r border-slate-200">
              {selectedVault ? (
                <div className="h-full flex flex-col">
                  {/* Chat Header */}
                  <div className="p-6 border-b border-slate-200 bg-white">
                    <div className="flex items-center justify-between">
                            <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-800">
                              {(() => {
                                console.log('🏷️ Vault title logic:', { 
                                  selectedVault, 
                                  type: selectedVault?.type,
                                  hasSelectedVault: !!selectedVault,
                                  selectedVaultKeys: selectedVault ? Object.keys(selectedVault) : []
                                });
                                if (selectedVault.type === 'bond') {
                                  const name = selectedVault.direction === 'sent' ? selectedVault.toMemberName : selectedVault.fromMemberName;
                                  console.log('🏷️ Bond title:', { 
                                    name, 
                                    direction: selectedVault.direction,
                                    toMemberName: selectedVault.toMemberName,
                                    fromMemberName: selectedVault.fromMemberName
                                  });
                                  return name || 'Trust Bond';
                                } else {
                                  console.log('🏷️ Unit title:', selectedVault.tuName);
                                  return selectedVault.tuName || 'Trust Unit';
                                }
                              })()}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {(() => {
                                console.log('🏷️ Vault subtitle logic:', { type: selectedVault?.type });
                                return selectedVault.type === 'bond' ? 'Trust Bond Vault' : 'Trust Unit Vault';
                              })()}
                            </p>
                          </div>
                          {/* SHOW MEMBER BUTTONS FOR BOTH BONDS AND UNITS */}
                          <div className="flex items-center gap-2">
                            {(() => {
                              console.log('🔘 Member buttons logic:', { 
                                type: selectedVault?.type,
                                hasSelectedVault: !!selectedVault,
                                selectedVaultKeys: selectedVault ? Object.keys(selectedVault) : []
                              });
                              return selectedVault.type === 'bond' ? renderBondMemberNames() : renderTuMemberNames();
                            })()}
                          </div>
                        </div>
                            </div>
                      {/* Create Vault button removed - vault is created automatically when TU is selected */}
                            </div>
                          </div>
                          
                  {/* Chat Messages Area */}
                  <div className="flex-1 p-6 bg-slate-50 overflow-y-auto">
                    <div className="max-w-4xl mx-auto">
                      {vaultMessages.length > 0 ? (
                        <div className="space-y-4">
                          {vaultMessages.map((message, index) => (
                            <div key={message.id || index} className="flex items-start space-x-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-medium">
                                {message.senderDetails?.name?.charAt(0)?.toUpperCase() || 
                                 message.senderId?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div className="flex-1">
                                <div className="bg-white rounded-lg p-3 shadow-sm">
                                  {/* Message Content */}
                                  {editingMessage?.id === message.id ? (
                                    <div className="mb-2">
                                      <input
                                        type="text"
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleSaveEdit();
                                          } else if (e.key === 'Escape') {
                                            handleCancelEdit();
                                          }
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        autoFocus
                                      />
                                      <div className="flex space-x-2 mt-2">
                                        <button
                                          onClick={handleSaveEdit}
                                          className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg transition-colors"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={handleCancelEdit}
                                          className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs rounded-lg transition-colors"
                                        >
                                          Cancel
                                        </button>
                                    </div>
                                  </div>
                                  ) : message.deletedAt ? (
                                    <p className="text-slate-500 italic">{message.content}</p>
                                  ) : message.messageType === 'image' ? (
                                    <div className="mb-2">
                                      <img 
                                        src={message.mediaUrl} 
                                        alt={message.content}
                                        className="max-w-xs rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                                        onClick={() => window.open(message.mediaUrl, '_blank')}
                                      />
                                    </div>
                                  ) : message.messageType === 'file' ? (
                                    <div className="mb-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                      <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                          <span className="text-blue-600 text-lg">
                                            {message.fileType?.includes('pdf') ? '📄' : 
                                             message.fileType?.includes('text') ? '📝' : '📁'}
                                          </span>
                                        </div>
                                        <div className="flex-1">
                                          <p className="font-medium text-slate-800">{message.content}</p>
                                          <p className="text-xs text-slate-500">
                                            {(message.fileSize / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                        <a 
                                          href={message.mediaUrl} 
                                          download={message.content}
                                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors"
                                        >
                                          Download
                                        </a>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-slate-800">{message.content}</p>
                                  )}
                                  
                                  <div className="flex items-center justify-between mt-1">
                                    <p className="text-xs text-slate-500">
                                      {message.senderDetails?.name || message.senderId} • {formatMessageDate(message.createdAt)}
                                      {message.editedAt && <span className="ml-1 text-slate-400">(edited)</span>}
                                    </p>
                                    
                                    {/* Message Actions */}
                                    {message.senderId === memberCode && !message.deletedAt && (
                                      <div className="flex items-center space-x-1">
                                        <button
                                          onClick={() => handleEditMessage(message)}
                                          className="text-xs px-2 py-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                                          title="Edit message"
                                        >
                                          ✏️
                                        </button>
                                        <button
                                          onClick={() => handleDeleteMessage(message.id)}
                                          className="text-xs px-2 py-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                          title="Delete message"
                                        >
                                          🗑️
                                        </button>
                                      </div>
                                  )}
                                </div>
                                
                                  {/* Message Reactions */}
                                  <div className="flex items-center space-x-2 mt-2">
                                    <button
                                      onClick={() => handleMessageReaction(message.id, 'like')}
                                      className={`text-xs px-2 py-1 rounded-full transition-colors ${
                                        message.reactions?.[memberCode] === 'like'
                                          ? 'bg-blue-100 text-blue-600'
                                          : 'bg-gray-100 text-gray-600 hover:bg-blue-50'
                                      }`}
                                    >
                                      👍 {Object.values(message.reactions || {}).filter(r => r === 'like').length}
                                    </button>
                                    <button
                                      onClick={() => handleMessageReaction(message.id, 'dislike')}
                                      className={`text-xs px-2 py-1 rounded-full transition-colors ${
                                        message.reactions?.[memberCode] === 'dislike'
                                          ? 'bg-red-100 text-red-600'
                                          : 'bg-gray-100 text-gray-600 hover:bg-red-50'
                                      }`}
                                    >
                                      👎 {Object.values(message.reactions || {}).filter(r => r === 'dislike').length}
                                    </button>
                                    {message.reactions?.[memberCode] && (
                                      <button
                                        onClick={() => handleMessageReaction(message.id, 'remove')}
                                        className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                      >
                                        Remove
                                      </button>
                                )}
                              </div>
                                </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                        <div className="text-center py-12">
                          <div className="text-6xl text-slate-300 mb-4">💬</div>
                          <h3 className="text-lg font-semibold text-slate-600 mb-2">Enter your message</h3>
                          <p className="text-slate-500">Attach a file/pic, make a vid, take a pic...</p>
                    </div>
                  )}
                      
                      {/* Typing Indicator */}
                      {isTyping && (
                        <div className="flex items-center space-x-2 text-slate-500 text-sm">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                          <span>You are typing...</span>
              </div>
                      )}
            </div>
          </div>

                  {/* Message Input */}
                  <div 
                    className={`p-6 border-t border-slate-200 bg-white ${dragOver ? 'bg-blue-50 border-blue-300' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="max-w-4xl mx-auto">
                      {dragOver && (
                        <div className="mb-4 p-4 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 text-center">
                          <p className="text-blue-600 font-medium">Drop file here to upload</p>
                </div>
                      )}
                      
                      <div className="flex space-x-3">
                        {/* File Upload Button */}
                        <div className="relative">
                          <input
                            type="file"
                            id="file-upload"
                            onChange={handleFileInputChange}
                            accept="image/*,.pdf,.txt,.doc,.docx"
                            className="hidden"
                          />
                          <label
                            htmlFor="file-upload"
                            className="flex items-center justify-center w-12 h-12 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                            title="Upload file"
                          >
                            <span className="text-slate-600 text-lg">📎</span>
                          </label>
              </div>
                        
                        <input
                          id="message-input"
                          type="text"
                          value={newMessage}
                          onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleTyping();
                          }}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Type your message..."
                          className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        
                        <button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || uploadingFile}
                          className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors"
                        >
                          {uploadingFile ? 'Uploading...' : 'Send'}
                        </button>
            </div>
            
            {/* Action buttons under input field */}
            <div className="flex items-center justify-center gap-4 mt-3">
              <button
                onClick={() => {
                  // Add a like reaction to the current message being typed
                  if (newMessage.trim()) {
                    setNewMessage(newMessage + ' 👍');
                  } else {
                    setNewMessage('👍');
                  }
                  const inputField = document.getElementById('message-input');
                  if (inputField) {
                    inputField.focus();
                  }
                }}
                className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Add Like Reaction"
              >
                <span className="text-lg">👍</span>
                <span className="text-sm">Like</span>
              </button>
              
              <button
                onClick={() => {
                  // Start video call functionality
                  alert('Video call feature coming soon!');
                }}
                className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Start Video Call"
              >
                <span className="text-lg">📹</span>
                <span className="text-sm">Video</span>
              </button>
              
              <button
                onClick={() => {
                  // Trigger camera/photo functionality
                  const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                  if (fileInput) {
                    fileInput.accept = 'image/*';
                    fileInput.click();
                  }
                }}
                className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Take/Upload Photo"
              >
                <span className="text-lg">📷</span>
                <span className="text-sm">Photo</span>
              </button>
              
              <button
                onClick={() => {
                  // Start voice recording functionality
                  alert('Voice message feature coming soon!');
                }}
                className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Record Voice Message"
              >
                <span className="text-lg">🎤</span>
                <span className="text-sm">Voice</span>
              </button>
              
              <button
                onClick={() => {
                  // Trigger file upload functionality
                  const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                  if (fileInput) {
                    fileInput.accept = '*/*';
                    fileInput.click();
                  }
                }}
                className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Upload/Share File"
              >
                <span className="text-lg">📁</span>
                <span className="text-sm">File</span>
              </button>
            </div>
                      
                      {uploadingFile && (
                        <div className="mt-2 text-center">
                          <div className="inline-flex items-center space-x-2 text-sm text-slate-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                            <span>Uploading file...</span>
          </div>
                </div>
                      )}
              </div>
            </div>
          </div>
              ) : (
                <div className="h-full flex items-center justify-center bg-slate-50">
                  <div className="text-center">
                    <div className="text-6xl text-slate-300 mb-4">🔒</div>
                    <h3 className="text-xl font-semibold text-slate-600 mb-2">Select a Vault</h3>
                    <p className="text-slate-500">Choose a trust bond or trust unit to start a conversation</p>
                </div>
              </div>
              )}
            </div>

            {/* RIGHT SIDEBAR - TBs and TUs */}
            <div className="w-80 bg-white flex flex-col">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center">
                  <span className="mr-2 text-indigo-500">🔒</span>
                  Vaults
                </h2>
                <p className="text-sm text-slate-600 mt-1">Private conversations</p>
              </div>
              
              {/* TRUST BONDS SECTION */}
              <div className="p-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Trust Bonds</h3>
                <div className="space-y-2">
                  {trustBonds.length > 0 ? (
                    trustBonds.map((bond, index) => (
                      <div 
                        key={index}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedVault?.type === 'bond' && selectedVault?.id === bond.id
                            ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                        onClick={() => handleVaultSelection('bond', bond)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-800">
                              {bond.direction === 'sent' ? bond.toMemberName : bond.fromMemberName}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                              bond.status === 'active' 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                bond.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                              }`}></span>
                              {bond.status === 'active' ? 'Active' : 'Offline'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-sm text-slate-500 italic">No trust bonds yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* TRUST UNITS SECTION */}
              <div className="p-4 flex-1">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Trust Units</h3>
                <div className="space-y-2">
                  {trustUnits.length > 0 ? (
                    trustUnits.map((unit, index) => (
                      <div 
                        key={index}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedVault?.type === 'unit' && selectedVault?.id === unit.id
                            ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                        onClick={() => handleVaultSelection('unit', unit)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-800">
                              {unit.tuName || `TU ${unit.id?.slice(-4) || 'N/A'}`}
                            </p>
                            <p className="text-xs text-slate-500">
                              {unit.members?.length || 0} members
                            </p>
                          </div>
                          <div className="text-xs text-slate-400">
                            {unit.status === 'active' ? '🟢' : '🟡'}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-sm text-slate-500 italic">No trust units yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-800">Settings</h2>
                <div className="text-sm text-gray-600 font-medium bg-gray-50 px-3 py-1 rounded-full">
                  ⚙️ Settings
                </div>
              </div>
              <p className="text-slate-600">Settings functionality coming soon.</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-800">Home</h2>
              <div className="text-sm text-gray-600 font-medium bg-gray-50 px-3 py-1 rounded-full">
                🏠 Home
              </div>
            </div>
            <p className="text-slate-600">Welcome to your member dashboard!</p>
          </div>
        );
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading member dashboard...</p>
        </div>
      </div>
    );
  }

  // INTERSTITIAL LOADING SCREEN - Show while checking Trust Units
  if (isCheckingTrustUnits) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Checking Trust Units...</h2>
          <p className="text-slate-600">Please wait while we check for pending connections</p>
        </div>
      </div>
    );
  }

  // ✅ SHOW TRUST UNIT MODAL FIRST (if pending) - it's an interstitial!
  if (showTrustUnitModal && currentTrustUnit) {
    return (
      <div className="min-h-screen bg-slate-50">
        <TrustUnitModal
          isOpen={showTrustUnitModal}
          onClose={() => {
            setShowTrustUnitModal(false);
            setCurrentTrustUnit(null);
            setPageReady(true); // Allow page to load after closing modal
          }}
          trustUnit={currentTrustUnit}
          currentMemberCode={memberCode}
          onConnect={handleTrustUnitConnect}
          onWait={handleTrustUnitWait}
        />
      </div>
    );
  }

  // ✅ SHOW VAULT CREATION MODAL
  if (showVaultCreationModal) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Create Vault</h3>
              <button 
                onClick={() => setShowVaultCreationModal(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">🔒</div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Choose Vault Type</h4>
                <p className="text-gray-600">Select how you want to communicate</p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleCreateVault('chat')}
                  className="w-full p-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">💬</div>
                    <div className="text-left">
                      <div className="font-semibold text-indigo-800">Chat</div>
                      <div className="text-sm text-indigo-600">Text messages and media sharing</div>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleCreateVault('video')}
                  className="w-full p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">📹</div>
                    <div className="text-left">
                      <div className="font-semibold text-green-800">Video Call</div>
                      <div className="text-sm text-green-600">Face-to-face conversations</div>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleCreateVault('share')}
                  className="w-full p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">📁</div>
                    <div className="text-left">
                      <div className="font-semibold text-purple-800">Share</div>
                      <div className="text-sm text-purple-600">File and document sharing</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button 
                onClick={() => setShowVaultCreationModal(false)}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // BLOCK PAGE RENDERING until data loads
  if (!pageReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse rounded-full h-12 w-12 bg-blue-100 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Loading Dashboard...</h2>
          <p className="text-slate-600">Preparing your personalized experience</p>
        </div>
        
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Topbar memberData={memberData} micAvailable={micAvailable} cameraAvailable={cameraAvailable} />
      
      <div className="flex">
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection}
          onLogout={handleLogout}
        />
        <main className="flex-1">
          {/* NEW HORIZONTAL NAVIGATION DIV - INSIDE MAIN CONTENT */}
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => setActiveSection('invites')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeSection === 'invites'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📤 INVITE
              </button>
              <button
                onClick={() => setActiveSection('groups')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeSection === 'groups'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                👥 CONNECT
              </button>
              <button
                onClick={() => setActiveSection('network')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeSection === 'network'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                🌐 NETWORK
              </button>
              <button
                onClick={() => setActiveSection('vaults')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeSection === 'vaults'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                🔒 VAULTS
              </button>
            </div>
          </div>
          
          {/* MAIN CONTENT WITH PADDING */}
          <div className="p-6">
            {renderContent()}
          </div>
        </main>
      </div>
      
      <InteractiveGuide
        isOpen={showGuide}
        onClose={handleGuideClose}
        onFinish={handleGuideFinish}
      />

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Take Profile Selfie</h3>
              <button 
                onClick={() => {
                  stopCamera();
                  setShowCameraModal(false);
                }}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  📸 <strong>Instructions:</strong> Look directly at the camera and take a clear selfie. 
                  This photo will be used for your profile verification.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-80 h-60 bg-gray-100 rounded-lg mx-auto mb-4 overflow-hidden">
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    muted
                    className="w-full h-full object-cover video-mirror"
                  />
                </div>
                
                <div className="flex gap-3 justify-center">
                  <button 
                    onClick={() => {
                      stopCamera();
                      setShowCameraModal(false);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={capturePhoto}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    📸 Capture Photo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Error</h3>
              <p className="text-slate-600 mb-4">{errorMessage}</p>
              <button 
                onClick={() => setShowErrorModal(false)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-green-500 text-4xl mb-4">✅</div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Success</h3>
              <p className="text-slate-600 mb-4">{successMessage}</p>
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedQRInvite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <div className="text-center">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">QR Code for {capitalizeName(selectedQRInvite.name)}</h3>
                <button 
                  onClick={() => setShowQRModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-xl"
                >
                  ✕
                </button>
              </div>
              
              {/* QR Code Display */}
              <div className="mb-6">
                {selectedQRInvite.qrCodeUrl ? (
                  <div className="flex flex-col items-center">
                    <img 
                      src={selectedQRInvite.qrCodeUrl} 
                      alt="QR Code" 
                      className="w-48 h-48 border border-slate-200 rounded-lg mb-4"
                    />
                    <p className="text-sm text-slate-600 mb-2">Scan to join the network</p>
                    <p className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">
                      {selectedQRInvite.qrData || 'QR Code URL'}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-8">
                    <div className="text-4xl mb-4">📱</div>
                    <p className="text-slate-600 mb-4">QR Code not available</p>
                    <button 
                      onClick={() => generateQRCode(selectedQRInvite)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Generate QR Code
                    </button>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              {selectedQRInvite.qrCodeUrl && (
                <div className="flex flex-wrap gap-2 justify-center">
                  <button 
                    onClick={() => copyToClipboard(selectedQRInvite.qrData)}
                    className="px-3 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 text-sm"
                  >
                    📋 Copy Link
                  </button>
                  <button 
                    onClick={() => downloadQRCode(selectedQRInvite)}
                    className="px-3 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 text-sm"
                  >
                    💾 Download
                  </button>
                  <button 
                    onClick={() => shareViaSMS(selectedQRInvite)}
                    className="px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm"
                  >
                    📱 SMS Share
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Voice Recording Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">
                {showVoiceModal === 'primary' && 'Record Primary Voice Print'}
                {showVoiceModal === 'profile' && 'Record Profile Confirm Voice Print'}
                {showVoiceModal === 'phone' && 'Record Phone Voice Print'}
              </h3>
              <button 
                onClick={() => setShowVoiceModal(null)}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
               <div className="p-3 bg-blue-50 rounded-lg">
                 <p className="text-sm text-blue-800">
                   {showVoiceModal === 'primary' && `Say: "My name is ${memberData?.name || memberData?.fullName || 'FIRST LAST'} and I am a human!"`}
                   {showVoiceModal === 'profile' && `Say: "${memberData?.name || memberData?.fullName || 'FIRST NAME, LAST NAME'}; speak clearly."`}
                   {showVoiceModal === 'phone' && `Say: "My phone number is ${memberData?.phone || phoneVoicePrint.phone || 'YOUR_PHONE'} for AM I HUMAN.net"`}
                 </p>
               </div>
              
              <div className="text-center">
                <div className="mb-4">
                  {isRecording ? (
                    <div className="text-red-600 text-lg font-semibold">
                      🔴 Recording... {countdown}s
                    </div>
                  ) : recordedBlob ? (
                    <div className="text-green-600 text-lg font-semibold">
                      ✅ Recording Complete!
                    </div>
                  ) : (
                    <div className="text-gray-600">
                      Click Record to start voice recording (7 seconds)
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 justify-center">
                  <button 
                    onClick={() => {
                      setShowVoiceModal(null);
                      setRecordedBlob(null);
                      setIsRecording(false);
                      setCountdown(0);
                      // Clear any existing countdown interval
                      if (countdownInterval) {
                        clearInterval(countdownInterval);
                        setCountdownInterval(null);
                      }
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  
                  {!isRecording && !recordedBlob ? (
                    <button 
                      onClick={() => handleAuthVoiceRecord(showVoiceModal)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      🎤 Start Recording
                    </button>
                  ) : isRecording ? (
                    <button 
                      onClick={stopRecording}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      ⏹️ Stop Recording
                    </button>
                  ) : recordedBlob ? (
                    <>
                      <button 
                        onClick={() => {
                          const audio = new Audio(URL.createObjectURL(recordedBlob));
                          audio.play();
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        ▶️ Listen
                      </button>
                      <button 
                        onClick={async () => {
                          console.log('Submitting voice recording...', showVoiceModal);
                          
                          // Submit the recording
                          const formData = new FormData();
                          formData.append('file', recordedBlob, `${showVoiceModal}_voice.webm`);
                          const mc = resolveMemberCode({ searchParams, memberData });
                          if (!mc) {
                            console.error('Missing memberCode for voice upload');
                            return;
                          }
                          formData.append('memberCode', mc);
                          formData.append('personNumber', showVoiceModal);
                          formData.append('name', 'Test Name');
                          
                          try {
                            console.log('Uploading to /api/voice/prints/upload...');
                            console.log('FormData contents:', {
                              file: recordedBlob,
                              memberCode: mc,
                              personNumber: showVoiceModal,
                              name: 'Test Name'
                            });
                            
                            // Use the real upload endpoint
                            const response = await fetch('/api/voice/prints/upload', {
                              method: 'POST',
                              body: formData
                            });
                            
                            console.log('Upload response status:', response.status);
                            console.log('Upload response headers:', Object.fromEntries(response.headers.entries()));
                            
                            if (!response.ok) {
                              console.error('Upload failed with status:', response.status);
                              const errorText = await response.text();
                              console.error('Error response body:', errorText);
                              throw new Error(`Upload failed with status ${response.status}: ${errorText}`);
                            }
                            
                            const responseData = await response.json();
                            console.log('Upload response data:', responseData);
                            
                            if (responseData.ok) {
                              console.log('Upload successful, updating states...');
                              setSuccessMessage('Voice recording saved successfully!');
                              setShowSuccessModal(true);
                              
                              // Test if the recording is actually in the database
                              console.log('🎵 Testing if recording was saved to database...');
                              try {
                                // Voice flow test removed
                                // const testData = await testResponse.json();
                                // console.log('🎵 Database test after upload:', JSON.stringify(testData, null, 2));
                              } catch (error) {
                                console.error('🎵 Database test failed:', error);
                              }
                              
                              // Update the appropriate voice print state
                              if (showVoiceModal === 'primary') {
                                console.log('Updating primary voice print...');
                                setPrimaryVoicePrint(prev => ({ ...prev, confirmed: true }));
                                setCurrentStep(2); // Move to Step 2
                                console.log('Moved to step 2');
                              } else if (showVoiceModal === 'profile') {
                                console.log('Updating profile voice print...');
                                setProfileConfirmPrint(prev => ({ ...prev, confirmed: true }));
                                setCurrentStep(3); // Move to Step 3
                                console.log('Moved to step 3');
                              } else if (showVoiceModal === 'phone') {
                                console.log('Updating phone voice print...');
                                setPhoneConfirmed(true);
                                console.log('All steps complete');
                              }
                              
                              // Close modal and reset states
                              setShowVoiceModal(null);
                              setRecordedBlob(null);
                              setIsRecording(false);
                              setCountdown(0);
                            } else {
                              console.error('Upload failed:', responseData);
                              setErrorMessage('Failed to save voice recording: ' + (responseData.error || 'Unknown error'));
                              setShowErrorModal(true);
                            }
                          } catch (error) {
                            console.error('Upload error:', error);
                            setErrorMessage('Failed to upload voice recording: ' + (error as Error).message);
                            setShowErrorModal(true);
                          }
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        ✅ Submit
                      </button>
                      <button 
                        onClick={() => {
                          setRecordedBlob(null);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        🗑️ Retake
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trust Unit Modal now rendered as interstitial before page loads */}
    </div>
  );
}

export default function MemberDashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MemberDashboardContent />
    </Suspense>
  );
}