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
  
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [showVoiceModal, setShowVoiceModal] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [countdownInterval, setCountdownInterval] = useState(null);
  const [showVoicePrompts, setShowVoicePrompts] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
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
  const [currentTrustUnit, setCurrentTrustUnit] = useState(null);
  const [trustUnits, setTrustUnits] = useState([]);
  const [isCheckingTrustUnits, setIsCheckingTrustUnits] = useState(true);
  const [pageReady, setPageReady] = useState(false);
  const [invitedLovedOnes, setInvitedLovedOnes] = useState([]);
  const [showInvitePreview, setShowInvitePreview] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  
  // Voice print states
  const [voicePrints, setVoicePrints] = useState({
    person1: { name: "", status: "pending", voiceFile: null },
    person2: { name: "", status: "pending", voiceFile: null },
    person3: { name: "", status: "pending", voiceFile: null }
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
           voiceFile: null,
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

  // Load invited loved ones when Groups section is accessed
  useEffect(() => {
    if (activeSection === 'groups' && memberCode) {
      loadInvitedLovedOnes();
      loadTrustUnits();
    }
  }, [activeSection, memberCode]);

  // Load data when Home section is active
  useEffect(() => {
    if (activeSection === 'overview' && memberCode) {
      loadInvitedLovedOnes();
      loadTrustUnits();
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
      console.log('Microphone not available on page load:', error.message);
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
      console.log('Camera not available on page load:', error.message);
    }
  };

  // Invite form handlers
  const handleInviteFormChange = (field, value) => {
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
        setSuccessMessage('Invitation sent successfully!');
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
        setErrorMessage('Failed to send invitation: ' + (responseData.error || 'Unknown error'));
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('❌ Error sending invite:', error);
      setErrorMessage('Failed to send invitation: ' + error.message);
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
        
        // Check for pending trust units that need THIS user's attention
        const pendingUnits = data.trustUnits.filter((unit: any) => {
          if (unit.status !== 'pending_connections') return false;
          
          // Check if current user is still pending in this unit
          const currentUserMember = unit.members.find((member: any) => 
            member.memberCode === memberCode
          );
          
          return currentUserMember && currentUserMember.status === 'pending_connection';
        });
        
        if (pendingUnits.length > 0) {
          console.log('🔔 INTERSTITIAL MODAL: Found pending trust units:', pendingUnits);
          setCurrentTrustUnit(pendingUnits[0]);
          setShowTrustUnitModal(true);
          // DON'T set pageReady yet - modal must be resolved first
          console.log('🔔 Modal should be showing now');
        } else {
          console.log('✅ No pending trust units, page ready');
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
      setErrorMessage('Failed to connect to trust unit: ' + error.message);
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
      setErrorMessage('Failed to update status: ' + error.message);
      setShowErrorModal(true);
    }
  };

  const handleStatusChange = async (inviteId, newStatus) => {
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

  const handleVoicePrintRecord = async (personNumber, name) => {
    if (!name.trim()) {
      setErrorMessage('Please enter the person\'s name first');
      setShowErrorModal(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      const chunks = [];
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

  const toggleSection = (step) => {
    setExpandedSections(prev => ({
      ...prev,
      [step]: !prev[step]
    }));
  };

  const handleAuthVoiceRecord = async (stepType) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      const chunks = [];
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

  const handleVoicePrintListen = (personNumber) => {
    const voicePrint = voicePrints[personNumber];
    if (voicePrint.voiceFile) {
      const audio = new Audio(voicePrint.voiceFile);
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
      setCameraError(error.message);
      setErrorMessage('Camera not available: ' + error.message);
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
      setMicError(error.message);
      setErrorMessage('Microphone not available: ' + error.message);
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
      setCameraError(error.message);
      setErrorMessage('Failed to start camera: ' + error.message);
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
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
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
          setMemberData(prev => ({
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
        setErrorMessage('Failed to save profile photo: ' + error.message);
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
      setErrorMessage('Failed to play voice recording: ' + error.message);
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
      setErrorMessage('Failed to play voice recording: ' + error.message);
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
      setErrorMessage('Failed to play voice recording: ' + error.message);
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
            {/* WHAT'S NEW SECTION */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center">
                  <span className="mr-2 text-blue-500">🆕</span>
                  What's New
                </h2>
                <div className="text-sm text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full">
                  Updates
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
              </div>
            </div>

            {/* SPONSOR SECTION */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-4">Sponsor</h3>
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                {memberData?.sponsorName ? (
                  <div className="p-6">
                    <div className="flex items-center space-x-4">
                      {/* Sponsor Profile Picture or Initial */}
                      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                        {memberData.sponsorProfilePicture ? (
                          <img 
                            src={memberData.sponsorProfilePicture} 
                            alt={memberData.sponsorName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full bg-yellow-200 flex items-center justify-center text-yellow-800 text-lg font-medium ${memberData.sponsorProfilePicture ? 'hidden' : 'flex'}`}>
                          {(memberData.sponsorName || 'S').charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-800">{capitalizeName(memberData.sponsorName)}</h4>
                        <p className="text-sm text-slate-600">Your Sponsor</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        💎 Trust Bond
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="px-6 py-8 text-center text-slate-500">
                    <div className="text-4xl mb-2">👥</div>
                    <p>No Sponsor yet</p>
                    <p className="text-sm">You were invited by someone to join AM I HUMAN.net</p>
                  </div>
                )}
              </div>
            </div>

            {/* TRUST BONDS SECTION */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-4">Trust Bonds</h3>
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                {invitedLovedOnes.filter((invite: any) => invite.status === 'accepted' || invite.status === 'registered').length > 0 ? (
                  <div className="divide-y divide-slate-200">
                    {invitedLovedOnes
                      .filter((invite: any) => invite.status === 'accepted' || invite.status === 'registered')
                      .map((invite: any) => (
                      <div key={invite.inviteId} className="p-6">
                        <div className="flex items-center space-x-4">
                          {/* Invitee Profile Picture or Initial */}
                          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                            {invite.inviteeProfilePicture ? (
                              <img 
                                src={invite.inviteeProfilePicture} 
                                alt={invite.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full bg-slate-200 flex items-center justify-center text-slate-600 text-lg font-medium ${invite.inviteeProfilePicture ? 'hidden' : 'flex'}`}>
                              {(invite.name || 'I').charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-800">{capitalizeName(invite.name)}</h4>
                            <p className="text-sm text-slate-600">{invite.phone}</p>
                          </div>
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            ✅ Connected
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-8 text-center text-slate-500">
                    <div className="text-4xl mb-2">💎</div>
                    <p>No Trust Bonds yet</p>
                    <p className="text-sm">Trust Bonds form when your invites accept and register</p>
                  </div>
                )}
              </div>
            </div>

            {/* TRUST UNITS SECTION */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-4">Trust Units</h3>
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                {trustUnits.length > 0 ? (
                  <div className="divide-y divide-slate-200">
                    {trustUnits.map((unit: any) => (
                      <div key={unit.unitId} className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-slate-800 flex items-center">
                            </h4>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            unit.status === 'fully_connected' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {unit.status === 'fully_connected' ? 'Fully Connected' : 'Pending Connections'}
                          </div>
                        </div>
                        
                        {/* Trust Unit Members - Compact Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {unit.members.map((member: any) => (
                            <div key={member.memberCode} className="bg-slate-50 rounded-lg p-3">
                              <div className="flex items-center space-x-3">
                                {/* Profile Picture Thumbnail */}
                                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                                  {member.profilePicture ? (
                                    <img 
                                      src={member.profilePicture} 
                                      alt={member.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div className={`w-full h-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium text-sm ${member.profilePicture ? 'hidden' : 'flex'}`}>
                                    {(member.name || 'M').charAt(0).toUpperCase()}
                                  </div>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-slate-800 text-sm truncate">
                                    {member.memberCode === unit.sponsorId ? '👑 ' : ''}{capitalizeName(member.name)} <span className="text-xs text-slate-500 font-normal">({member.memberCode})</span>
                                  </p>
                                </div>
                                
                                {/* Only show individual status if Trust Unit is NOT fully connected */}
                                {unit.status !== 'fully_connected' && (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    member.status === 'connected'
                                      ? 'bg-green-100 text-green-800'
                                      : member.status === 'waiting'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {member.status === 'connected'
                                      ? '✅'
                                      : member.status === 'waiting'
                                      ? '⏳'
                                      : '⏳'}
                                  </span>
                                )}
                              </div>
                              
                              {/* Action buttons only for current user and pending connections */}
                              {member.memberCode === memberCode && member.status === 'pending_connection' && (
                                <div className="flex space-x-2 mt-2">
                                  <button
                                    onClick={() => handleTrustUnitConnect(member.memberCode)}
                                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                  >
                                    Connect
                                  </button>
                                  <button
                                    onClick={() => handleTrustUnitWait(member.memberCode)}
                                    className="px-2 py-1 bg-slate-200 text-slate-800 rounded text-xs hover:bg-slate-300"
                                  >
                                    Wait
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-8 text-center text-slate-500">
                    <div className="text-4xl mb-2">👑</div>
                    <p>No Trust Units yet</p>
                    <p className="text-sm">Trust Units form when you and your loved ones share the same sponsor</p>
                  </div>
                )}
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
              <div className="grid grid-cols-10 gap-2 mb-3 px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-600 uppercase tracking-wide">
                <div className="col-span-3">Name</div>
                <div className="col-span-2">Phone</div>
                <div className="col-span-3">Sent Date</div>
                <div className="col-span-2">Actions</div>
              </div>
              
              {/* Invite Rows */}
              <div className="space-y-1">
                {invitedLovedOnes.map((invite, index) => (
                  <div key={index} className="grid grid-cols-10 gap-2 p-2 bg-white rounded border hover:bg-slate-50 transition-colors">
                    {/* Name */}
                    <div className="col-span-3 flex items-center">
                      <div className="flex items-center space-x-2">
                        {/* Check if this invite is part of a Trust Unit */}
                        {(() => {
                          const isTrustUnit = trustUnits.some(unit => 
                            unit.members.some(member => 
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
                <h2 className="text-xl font-semibold text-slate-800">Groups</h2>
                <div className="text-sm text-orange-600 font-medium bg-orange-50 px-3 py-1 rounded-full">
                  👥 Groups
                </div>
              </div>
              
              {/* Sponsor Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Sponsor</h3>
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                    <div className="grid grid-cols-4 gap-4 text-sm font-medium text-slate-600">
                      <div>Sponsor</div>
                      <div>Name</div>
                      <div>Member Code</div>
                      <div>Invite Date</div>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {/* Show sponsor information if user has a sponsor */}
                    {memberData?.sponsorName ? (
                      <div className="px-6 py-4 hover:bg-slate-50">
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div className="text-slate-600 flex items-center space-x-2">
                            <span>{capitalizeName(memberData.sponsorName)}</span>
                          </div>
                          <div className="font-medium text-slate-800 flex items-center space-x-2">
                            <span>{capitalizeName(memberData.name)}</span>
                          </div>
                          <div className="text-slate-600">{memberData.memberCode}</div>
                          <div className="text-slate-500">{memberData.invitedAt ? new Date(memberData.invitedAt).toLocaleDateString() : 'N/A'}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="px-6 py-8 text-center text-slate-500">
                        <div className="text-4xl mb-2">👥</div>
                        <p>No Sponsor yet</p>
                        <p className="text-sm">You were invited by someone to join AM I HUMAN.net</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Trust Bonds Section - Show registered invitees */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Trust Bonds</h3>
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                    <div className="grid grid-cols-4 gap-4 text-sm font-medium text-slate-600">
                      <div>Sponsor</div>
                      <div>Name</div>
                      <div>Member Code</div>
                      <div>Invite Date</div>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {/* Show registered invitees */}
                    {invitedLovedOnes.filter(invite => invite.status === 'accepted' || invite.status === 'registered').length > 0 ? (
                      invitedLovedOnes
                        .filter(invite => invite.status === 'accepted' || invite.status === 'registered')
                        .map((invite: any) => (
                          <div key={invite.inviteId} className="px-6 py-4 hover:bg-slate-50">
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div className="text-slate-600 flex items-center space-x-2">
                                <span className="text-lg">💎</span>
                                <span>{capitalizeName(memberData?.name || memberData?.fullName)}</span>
                              </div>
                              <div className="font-medium text-slate-800 flex items-center space-x-2">
                                <span className="text-lg">💎</span>
                                <span>{capitalizeName(invite.name)}</span>
                              </div>
                              <div className="text-slate-600">{invite.phone}</div>
                              <div className="text-slate-500">{invite.createdAt ? new Date(invite.createdAt).toLocaleDateString() : 'N/A'}</div>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="px-6 py-8 text-center text-slate-500">
                        <div className="text-4xl mb-2">💎</div>
                        <p>No Trust Bonds yet</p>
                        <p className="text-sm">Trust Bonds form when invited loved ones register and complete their profiles</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Trust Units Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Trust Units</h3>
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  {trustUnits.length > 0 ? (
                    <div className="divide-y divide-slate-200">
                      {trustUnits.map((unit: any) => (
                        <div key={unit.unitId} className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="font-semibold text-slate-800 flex items-center">
                              </h4>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                              unit.status === 'fully_connected' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {unit.status === 'fully_connected' ? 'Fully Connected' : 'Pending Connections'}
                            </div>
                          </div>
                          
                          {/* Trust Unit Members - Compact Layout */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {unit.members.map((member: any) => (
                                <div key={member.memberCode} className="bg-slate-50 rounded-lg p-3">
                                <div className="flex items-center space-x-3">
                                  {/* Profile Picture Thumbnail */}
                                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                                    {member.profilePicture ? (
                                      <img 
                                        src={member.profilePicture} 
                                        alt={member.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          // Fallback to initial if image fails
                                          e.currentTarget.style.display = 'none';
                                          (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                                        }}
                                      />
                                    ) : null}
                                    <div className={`w-full h-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium text-sm ${member.profilePicture ? 'hidden' : 'flex'}`}>
                                      {(member.name || 'M').charAt(0).toUpperCase()}
                                    </div>
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-800 text-sm truncate">
                                      {member.memberCode === unit.sponsorId ? '👑 ' : ''}{capitalizeName(member.name)} <span className="text-xs text-slate-500 font-normal">({member.memberCode})</span>
                                    </p>
                                  </div>
                                  
                                  {/* Only show individual status if Trust Unit is NOT fully connected */}
                                  {unit.status !== 'fully_connected' && (
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      member.status === 'connected'
                                        ? 'bg-green-100 text-green-800'
                                        : member.status === 'waiting'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {member.status === 'connected'
                                        ? '✅'
                                        : member.status === 'waiting'
                                        ? '⏳'
                                        : '⏳'}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Action buttons only for current user and pending connections */}
                                {member.memberCode === memberCode && member.status === 'pending_connection' && (
                                  <div className="flex space-x-2 mt-2">
                                    <button
                                      onClick={() => handleTrustUnitConnect(member.memberCode)}
                                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                    >
                                      Connect
                                    </button>
                                    <button
                                      onClick={() => handleTrustUnitWait(member.memberCode)}
                                      className="px-2 py-1 bg-slate-200 text-slate-800 rounded text-xs hover:bg-slate-300"
                                    >
                                      Wait
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-6 py-8 text-center text-slate-500">
                      <div className="text-4xl mb-2">👑</div>
                      <p>No Trust Units yet</p>
                      <p className="text-sm">Trust Units form when you and your loved ones share the same sponsor</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 'network':
        return <TrustNetworkManager memberCode={mc} />;
      case 'vaults':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-800">Vaults</h2>
                <div className="text-sm text-indigo-600 font-medium bg-indigo-50 px-3 py-1 rounded-full">
                  🔒 Vaults
                </div>
              </div>
              <p className="text-slate-600">Vaults functionality coming soon.</p>
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
      case 'admin':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-800">Admin</h2>
                <div className="text-sm text-yellow-600 font-medium bg-yellow-50 px-3 py-1 rounded-full">
                  👑 Admin
                </div>
              </div>
              <p className="text-slate-600">Admin functionality coming soon.</p>
            </div>
          </div>
        );
      case 'notices':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-800">Notices</h2>
                <div className="text-sm text-red-600 font-medium bg-red-50 px-3 py-1 rounded-full">
                  📢 Notices
                </div>
              </div>
              <p className="text-slate-600">Notices functionality coming soon.</p>
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

  // BLOCK PAGE RENDERING until modal is resolved
  if (!pageReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse rounded-full h-12 w-12 bg-blue-100 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Loading Dashboard...</h2>
          <p className="text-slate-600">Preparing your personalized experience</p>
        </div>
        
        {/* Trust Unit Modal - Show even when page is not ready */}
        <TrustUnitModal
          isOpen={showTrustUnitModal}
          onClose={() => {
            setShowTrustUnitModal(false);
            setCurrentTrustUnit(null);
            setPageReady(true); // Allow page to load after modal is closed
          }}
          trustUnit={currentTrustUnit}
          currentMemberCode={memberCode}
          onConnect={handleTrustUnitConnect}
          onWait={handleTrustUnitWait}
        />
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
        <main className="flex-1 p-6">
          {renderContent()}
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
                            setErrorMessage('Failed to upload voice recording: ' + error.message);
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

      {/* Trust Unit Modal - Only show when page is ready */}
      {pageReady && (
        <TrustUnitModal
          isOpen={showTrustUnitModal}
          onClose={() => {
            setShowTrustUnitModal(false);
            setCurrentTrustUnit(null);
          }}
          trustUnit={currentTrustUnit}
          currentMemberCode={memberCode}
          onConnect={handleTrustUnitConnect}
          onWait={handleTrustUnitWait}
        />
      )}
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