"use client";
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Topbar from '@/components/mem/Topbar';
import Sidebar from '@/components/mem/Sidebar';
import InteractiveGuide from '@/components/InteractiveGuide';
import { deviceFingerprint } from '@/lib/deviceFingerprint';

function MemberDashboardContent() {
  const searchParams = useSearchParams();
  const memberCode = searchParams.get('memberCode') || searchParams.get('name'); // Fallback for compatibility
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [showVoiceModal, setShowVoiceModal] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [showVoicePrompts, setShowVoicePrompts] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
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
    if (!memberCode) {
      setLoading(false);
      return;
    }

    // Handle demo mode
    if (memberCode === 'demo') {
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
      await deviceFingerprint.sendFingerprint(memberCode);
      
      const response = await fetch(`/api/user/profile?memberCode=${memberCode}`);
      const data = await response.json();
      
      if (data.ok && data.profile) {
        setMemberData(data.profile);
        
        // Populate primary voice print name with member's registered name
        setPrimaryVoicePrint(prev => ({
          ...prev,
          name: data.profile.name || data.profile.fullName || "Spencer Wendt"
        }));
        
        // Populate profile confirm print name with member's registered name
        setProfileConfirmPrint(prev => ({
          ...prev,
          name: data.profile.name || data.profile.fullName || "Spencer Wendt"
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
        
        // Check if first time login
        const isFirstLogin = localStorage.getItem(`aih.firstLogin.${memberCode}`) !== 'true';
        if (isFirstLogin) {
          setShowGuide(true);
          localStorage.setItem(`aih.firstLogin.${memberCode}`, 'true');
        }
      } else {
        }
    } catch (error) {
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

  useEffect(() => {
    // Load member data from database
    loadMemberData();

    // Load voice prints data
    loadVoicePrints();
  }, [memberCode]);

  const loadVoicePrints = async () => {
    try {
      const memberCode = searchParams.get('memberCode') || localStorage.getItem('memberCode');
      if (memberCode) {
        const response = await fetch(`/api/voice-prints?memberCode=${memberCode}`);
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
        formData.append('memberCode', searchParams.get('memberCode') || localStorage.getItem('memberCode'));
        formData.append('personNumber', personNumber);
        formData.append('name', name);
        
        const uploadResponse = await fetch('/api/voice-prints/upload', {
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
              memberCode: searchParams.get('memberCode') || localStorage.getItem('memberCode'),
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

  const handlePrimaryListen = () => {
    // Check if there's a voice recording in the database
    if (memberData?.voiceUrl) {
      // Construct the full URL for the voice file
      const voiceUrl = `https://storage.googleapis.com/amihuman-production.firebasestorage.app/${memberData.voiceUrl}`;
      const audio = new Audio(voiceUrl);
      audio.play().catch(error => {
        setErrorMessage('Error playing voice recording. Please try recording again.');
        setShowErrorModal(true);
      });
    } else {
      setErrorMessage('No voice recording found. Please record your voice first.');
      setShowErrorModal(true);
    }
  };

  const handleProfileListen = () => {
    // For now, same as primary - in future this will be separate
    handlePrimaryListen();
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
  return (
          <div className="space-y-6">
            {/* PERSONAL AUTHENTICATION PROFILE */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-6">PERSONAL AUTHENTICATION PROFILE</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ACCESS INFO */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-slate-800">ACCESS INFO</h3>
                    <div className="text-sm text-slate-600">
                      Progress: {currentStep}/3
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                           {/* Primary Voice Print - Step 1 */}
                           <div className={`p-4 rounded-lg border-2 ${currentStep === 1 ? 'border-blue-500 bg-blue-50' : primaryVoicePrint.confirmed ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                             <div className="flex items-center justify-between mb-1">
                               <label className="block text-sm font-medium text-slate-700">First, Last Name as Registered</label>
                               {primaryVoicePrint.confirmed && (
                                 <span className="text-green-600 text-lg">✓</span>
                               )}
                             </div>
                             <input
                               type="text"
                               placeholder="Enter your first and last name"
                               value={memberData?.name || memberData?.fullName || primaryVoicePrint.name || 'Spencer Wendt'}
                               onChange={(e) => setPrimaryVoicePrint(prev => ({ ...prev, name: e.target.value }))}
                               className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black font-medium"
                               readOnly={!!(memberData?.name || memberData?.fullName) || primaryVoicePrint.confirmed} // Read-only if data loaded from DB or confirmed
                             />
                             
                             {(primaryVoicePrint.confirmed || memberData?.hasVoice) ? (
                               // Completed state - only show Listen button
                               <div className="flex gap-2 mt-2">
                                 <button 
                                   onClick={handlePrimaryListen}
                                   className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center gap-1"
                                 >
                                   ▶️ Listen
                                 </button>
                                 <div className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm flex items-center gap-1">
                                   ✅ Complete
                                 </div>
                               </div>
                             ) : (
                               // Incomplete state - show Record and Listen buttons
                               <div className="flex gap-2 mt-2">
                                 <button 
                                   onClick={handlePrimaryRecord}
                                   className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm flex items-center gap-1"
                                 >
                                   🎤 Record
                                 </button>
                                 <button 
                                   onClick={handlePrimaryListen}
                                   className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center gap-1"
                                 >
                                   ▶️ Listen
                                 </button>
                                 <button 
                                   onClick={handlePrimaryConfirm}
                                   className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center gap-1"
                                 >
                                   ✅ Confirm
                                 </button>
                               </div>
                             )}
                           </div>

                           {/* Profile Confirm Print - Step 2 */}
                           <div className={`p-4 rounded-lg border-2 ${currentStep === 2 ? 'border-blue-500 bg-blue-50' : profileConfirmPrint.confirmed ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                             <div className="flex items-center justify-between mb-1">
                               <label className="block text-sm font-medium text-slate-700">Profile Confirm Print</label>
                               {profileConfirmPrint.confirmed && (
                                 <span className="text-green-600 text-lg">✓</span>
                               )}
                             </div>
                             <input
                               type="text"
                               placeholder="Enter your first and last name"
                               value={memberData?.name || memberData?.fullName || profileConfirmPrint.name || 'Spencer Wendt'}
                               onChange={(e) => setProfileConfirmPrint(prev => ({ ...prev, name: e.target.value }))}
                               className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black font-medium"
                               readOnly={!!(memberData?.name || memberData?.fullName) || profileConfirmPrint.confirmed} // Read-only if data loaded from DB or confirmed
                             />
                             
                             {(profileConfirmPrint.confirmed || memberData?.hasVoice) ? (
                               // Completed state - only show Listen button
                               <div className="flex gap-2 mt-2">
                                 <button 
                                   onClick={handleProfileListen}
                                   className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center gap-1"
                                 >
                                   ▶️ Listen
                                 </button>
                                 <div className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm flex items-center gap-1">
                                   ✅ Complete
                                 </div>
                               </div>
                             ) : (
                               // Incomplete state - show Record and Listen buttons
                               <div className="flex gap-2 mt-2">
                                 <button 
                                   onClick={handleProfileRecord}
                                   className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm flex items-center gap-1"
                                 >
                                   🎤 Record
                                 </button>
                                 <button 
                                   onClick={handleProfileListen}
                                   className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center gap-1"
                                 >
                                   ▶️ Listen
                                 </button>
                                 <button 
                                   onClick={handleProfileConfirm}
                                   className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center gap-1"
                                 >
                                   ✅ Confirm
                                 </button>
                               </div>
                             )}
                           </div>
                  </div>
                  
                         {/* Phone Number - Step 3 */}
                         <div className={`p-4 rounded-lg border-2 ${currentStep === 3 ? 'border-blue-500 bg-blue-50' : phoneConfirmed ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                           <div className="flex items-center justify-between mb-1">
                             <label className="block text-sm font-medium text-slate-700">Phone Number</label>
                             {phoneConfirmed && (
                               <span className="text-green-600 text-lg">✓</span>
                             )}
                           </div>
                           <input
                             type="tel"
                             placeholder="(000) 000-0000"
                             value={memberData?.phone ? `(${memberData.phone.slice(0,3)}) ${memberData.phone.slice(3,6)}-${memberData.phone.slice(6)}` : memberData?.memberCode ? `(${memberData.memberCode.slice(0,3)}) ${memberData.memberCode.slice(3,6)}-${memberData.memberCode.slice(6)}` : ''}
                             className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black font-medium"
                             readOnly={!!(memberData?.phone || memberData?.memberCode)}
                           />
                           
                           {phoneConfirmed ? (
                             // Completed state - only show Listen button
                             <div className="flex gap-2 mt-2">
                               <button 
                                 onClick={() => {
                                   // Play phone number recording
                                   if (memberData?.voiceUrl) {
                                     const voiceUrl = `https://storage.googleapis.com/amihuman-production.firebasestorage.app/${memberData.voiceUrl}`;
                                     const audio = new Audio(voiceUrl);
                                     audio.play().catch(error => {
                                       setErrorMessage('Error playing voice recording. Please try recording again.');
        setShowErrorModal(true);
                                     });
                                   } else {
                                     setErrorMessage('No voice recording found. Please record your phone number first.');
                                     setShowErrorModal(true);
                                   }
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
                             // Incomplete state - show Record and Listen buttons
                             <div className="flex gap-2 mt-2">
                               <button 
                                 onClick={handlePhoneRecord}
                                 className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm flex items-center gap-1"
                               >
                                 🎤 Record
                               </button>
                               <button 
                                 onClick={() => {
                                   // Play phone number recording
                                   if (memberData?.voiceUrl) {
                                     const voiceUrl = `https://storage.googleapis.com/amihuman-production.firebasestorage.app/${memberData.voiceUrl}`;
                                     const audio = new Audio(voiceUrl);
                                     audio.play().catch(error => {
                                       setErrorMessage('Error playing voice recording. Please try recording again.');
        setShowErrorModal(true);
                                     });
                                   } else {
                                     setErrorMessage('No voice recording found. Please record your phone number first.');
                                     setShowErrorModal(true);
                                   }
                                 }}
                                 className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center gap-1"
                               >
                                 ▶️ Listen
                               </button>
                               <button 
                                 onClick={handlePhoneConfirm}
                                 className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center gap-1"
                               >
                                 ✅ Confirm
                               </button>
                             </div>
                           )}
                         </div>
                  
                  <div className="flex gap-4">
                    <div className="text-slate-700">
                      Sponsor: {memberData?.sponsor || 'ADMIN'} ✅
                    </div>
                    <div className="text-slate-700">
                      Registration Date: {memberData?.createdAt ? new Date(memberData.createdAt).toLocaleDateString() : 'N/A'} ✅
                    </div>
                  </div>
                </div>
                
                {/* KEY VOICE PRINTS */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-slate-800">KEY VOICE PRINTS</h3>
                    <div className="text-sm text-slate-600">
                      Progress: <span className="font-semibold">{progress}</span>
                    </div>
                  </div>
                  
                  {/* Person 1 */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Person 1 - First & Last Name</label>
                    <input
                      type="text"
                      placeholder="Enter first and last name"
                      value={voicePrints.person1.name}
                      onChange={(e) => setVoicePrints(prev => ({
                        ...prev,
                        person1: { ...prev.person1, name: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVoicePrintRecord('person1', voicePrints.person1.name)}
                        disabled={!voicePrints.person1.name.trim() || isRecording}
                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 text-sm flex items-center gap-1"
                      >
                        🎤 Record
                      </button>
                      <button
                        onClick={() => handleVoicePrintListen('person1')}
                        disabled={voicePrints.person1.status !== 'completed'}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm flex items-center gap-1"
                      >
                        ▶️ Listen
                      </button>
                      <div className={`px-3 py-1 rounded-md text-sm ${
                        voicePrints.person1.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {voicePrints.person1.status === 'completed' ? '✅ Complete' : '⏳ Pending'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Person 2 */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Person 2 - First & Last Name</label>
                    <input
                      type="text"
                      placeholder="Enter first and last name"
                      value={voicePrints.person2.name}
                      onChange={(e) => setVoicePrints(prev => ({
                        ...prev,
                        person2: { ...prev.person2, name: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVoicePrintRecord('person2', voicePrints.person2.name)}
                        disabled={!voicePrints.person2.name.trim() || isRecording}
                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 text-sm flex items-center gap-1"
                      >
                        🎤 Record
                      </button>
                      <button
                        onClick={() => handleVoicePrintListen('person2')}
                        disabled={voicePrints.person2.status !== 'completed'}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm flex items-center gap-1"
                      >
                        ▶️ Listen
                      </button>
                      <div className={`px-3 py-1 rounded-md text-sm ${
                        voicePrints.person2.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {voicePrints.person2.status === 'completed' ? '✅ Complete' : '⏳ Pending'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Person 3 */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Person 3 - First & Last Name</label>
                    <input
                      type="text"
                      placeholder="Enter first and last name"
                      value={voicePrints.person3.name}
                      onChange={(e) => setVoicePrints(prev => ({
                        ...prev,
                        person3: { ...prev.person3, name: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVoicePrintRecord('person3', voicePrints.person3.name)}
                        disabled={!voicePrints.person3.name.trim() || isRecording}
                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 text-sm flex items-center gap-1"
                      >
                        🎤 Record
                      </button>
                      <button
                        onClick={() => handleVoicePrintListen('person3')}
                        disabled={voicePrints.person3.status !== 'completed'}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm flex items-center gap-1"
                      >
                        ▶️ Listen
                      </button>
                      <div className={`px-3 py-1 rounded-md text-sm ${
                        voicePrints.person3.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {voicePrints.person3.status === 'completed' ? '✅ Complete' : '⏳ Pending'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Voice Prompts Section - SHOW/HIDE FUNCTIONALITY */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-800">Voice Prompts</h2>
                <button
                  onClick={() => setShowVoicePrompts(!showVoicePrompts)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {showVoicePrompts ? 'Hide' : 'Show'} Voice Prompts
                </button>
              </div>
              
              {showVoicePrompts && (
                <div className="space-y-6">
                  {/* RECORD YOUR NAME */}
                  <div className="border border-slate-200 rounded-lg p-4">
                    <h3 className="font-medium text-slate-800 mb-3">RECORD YOUR NAME</h3>
                    <p className="text-sm text-slate-600 mb-4">Say your first and last name clearly</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowVoiceModal('name')}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
                      >
                        🎤 Record Name
                      </button>
                    </div>
                  </div>

                  {/* VP2 */}
                  <div className="border border-slate-200 rounded-lg p-4">
                    <h3 className="font-medium text-slate-800 mb-3">VP2</h3>
                    <p className="text-sm text-slate-600 mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowVoiceModal('vp2')}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
                      >
                        🎤 Record VP2
                      </button>
                    </div>
                  </div>

                  {/* VP3 */}
                  <div className="border border-slate-200 rounded-lg p-4">
                    <h3 className="font-medium text-slate-800 mb-3">VP3</h3>
                    <p className="text-sm text-slate-600 mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowVoiceModal('vp3')}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
                      >
                        🎤 Record VP3
                      </button>
                    </div>
                  </div>

                  {/* VP4 */}
                  <div className="border border-slate-200 rounded-lg p-4">
                    <h3 className="font-medium text-slate-800 mb-3">VP4</h3>
                    <p className="text-sm text-slate-600 mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowVoiceModal('vp4')}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
                      >
                        🎤 Record VP4
                      </button>
                    </div>
                  </div>

                  {/* VP5 */}
                  <div className="border border-slate-200 rounded-lg p-4">
                    <h3 className="font-medium text-slate-800 mb-3">VP5</h3>
                    <p className="text-sm text-slate-600 mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowVoiceModal('vp5')}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
                      >
                        🎤 Record VP5
          </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      
      case 'profile':
        return (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Profile Settings</h2>
            <p className="text-slate-600">Profile management coming soon...</p>
          </div>
        );
      
      case 'bonds':
        return (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Trust Bonds</h2>
            <p className="text-slate-600">Trust bonds management coming soon...</p>
          </div>
        );
      
      case 'units':
        return (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Trust Units</h2>
            <p className="text-slate-600">Trust units management coming soon...</p>
          </div>
        );
      
      case 'messages':
        return (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Messages</h2>
            <p className="text-slate-600">Messages coming soon...</p>
          </div>
        );
      
      case 'vaults':
        return (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Vaults</h2>
            <p className="text-slate-600">Vaults management coming soon...</p>
          </div>
        );
      
      case 'settings':
        return (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Settings</h2>
            <p className="text-slate-600">Settings management coming soon...</p>
          </div>
        );
      
      default:
        return (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Overview</h2>
            <p className="text-slate-600">Welcome to your member dashboard!</p>
          </div>
        );
    }
  };

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

  // Error state - member not found
  if (!memberData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Member not found</p>
          <button 
            onClick={() => window.location.href = '/connect'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return to Connect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Topbar memberData={memberData} />
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
      
      {/* Voice Recording Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                   <h3 className="text-lg font-semibold mb-4">
                     {showVoiceModal === 'primary' ? 'Record your first and last name as registered' : 
                      showVoiceModal === 'profile' ? 'Record your profile confirm voice print' : 
                      showVoiceModal === 'phone' ? 'Record your phone number (area code first)' :
                      `Recording ${showVoiceModal.toUpperCase()}`}
                   </h3>
                   
                   <div className="text-sm text-slate-600 mb-4 text-center">
                     {showVoiceModal === 'primary' ? 'Say your full name clearly: "First Last"' : 
                      showVoiceModal === 'profile' ? 'Repeat your name for profile confirmation' : 
                      showVoiceModal === 'phone' ? 'Say your phone number: "Area code, first three digits, last four digits"' :
                      'Speak clearly into your microphone'}
                   </div>
            
            {isRecording ? (
              <div className="text-center">
                <div className="text-4xl mb-4">🎤</div>
                <div className="text-2xl font-bold text-red-600 mb-2">
                  {countdown > 0 ? countdown : 'Recording...'}
                </div>
                <p className="text-slate-600">Speak clearly into your microphone</p>
              </div>
            ) : recordedBlob ? (
              <div className="text-center">
                <div className="text-4xl mb-4">✅</div>
                <p className="text-slate-600 mb-4">Recording complete! Listen to your voice print:</p>
                <div className="flex gap-3 justify-center">
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
                      try {
                        // STEP 1: INIT - ask server to create an upload slot
                        const initRes = await fetch("/api/voice/init", { method: "POST" });
                        if (!initRes.ok) throw new Error("init failed");
                        const { uploadId } = await initRes.json();
                        // STEP 2: UPLOAD - send the audio blob under the EXACT field name the server expects
                        const fd = new FormData();
           fd.append("audio", recordedBlob, "voice.webm"); // MUST match server field name
           // Add phone digits for secure voice linking
           if (memberData?.phone) {
             fd.append("phoneDigits", memberData.phone);
           }
                        
                        const upRes = await fetch(`/api/voice/upload?uploadId=${encodeURIComponent(uploadId)}`, {
                          method: "POST",
                          body: fd,
                          // Don't set Content-Type - let browser set it with boundary
                        });
                        if (!upRes.ok) {
                          const errorData = await upRes.json();
                          throw new Error(`upload failed: ${errorData.error}`);
                        }
                        const uploadData = await upRes.json();
                        // STEP 3: COMMIT - finalize + create DB record
                        const commitRes = await fetch("/api/voice/commit", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ 
               uploadId,
               phoneDigits: memberData?.phone || null
             }),
           });
                        if (!commitRes.ok) {
                          const errorData = await commitRes.json();
                          throw new Error(`commit failed: ${errorData.error}`);
                        }
                        const commitData = await commitRes.json();
                        // Update user profile with voice recording and completion steps
           const voiceUrl = `voice/${uploadId}.webm`;
           
           // Determine which step was completed
           let profileSteps = {};
           let newCurrentStep = currentStep;
           
           if (showVoiceModal === 'primary') {
             profileSteps = { primaryVoice: true };
             newCurrentStep = 2;
           } else if (showVoiceModal === 'profile') {
             profileSteps = { primaryVoice: true, profileConfirm: true };
             newCurrentStep = 3;
           } else if (showVoiceModal === 'phone') {
             profileSteps = { primaryVoice: true, profileConfirm: true, phoneVoice: true };
             newCurrentStep = 4;
           }
           
           const profileResponse = await fetch('/api/user/profile', {
             method: 'PUT',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               memberCode: memberCode,
               voiceUrl: voiceUrl,
               hasVoice: true,
               profileSteps: profileSteps,
               currentStep: newCurrentStep
             })
           });

                        if (profileResponse.ok) {
                          // Update local state and advance step
                          if (showVoiceModal === 'primary') {
                            setPrimaryVoicePrint(prev => ({ 
                              ...prev, 
                              voiceFile: recordedBlob, 
                              status: 'completed',
                              confirmed: true 
                            }));
                            setCurrentStep(2); // Move to Profile Confirm step
                          } else if (showVoiceModal === 'profile') {
                            setProfileConfirmPrint(prev => ({ 
                              ...prev, 
                              voiceFile: recordedBlob, 
                              status: 'completed',
                              confirmed: true 
                            }));
                            setCurrentStep(3); // Move to Phone step
                          } else if (showVoiceModal === 'phone') {
                            setPhoneVoicePrint(prev => ({ 
                              ...prev, 
                              voiceFile: recordedBlob, 
                              status: 'completed',
                              confirmed: true 
                            }));
                            setPhoneConfirmed(true); // Complete phone step
                          }
                      
                          // Reload member data to get updated voice URL
                          loadMemberData();
                          
                          // Close modal and reset state immediately
                          setRecordedBlob(null);
                          setShowVoiceModal(null);
                          
                          } else {
                          const errorData = await profileResponse.json();
                          throw new Error(`Profile update failed: ${errorData.error || 'Unknown error'}`);
                        }
                      } catch (error) {
                        // Show specific error messages based on error type
                        let errorMessage = 'Error saving voice recording: ';
                        if (error.message.includes('init failed')) {
                          errorMessage += 'Failed to initialize upload. Please try again.';
                        } else if (error.message.includes('upload failed')) {
                          errorMessage += 'Failed to upload audio file. Please check your connection.';
                        } else if (error.message.includes('commit failed')) {
                          errorMessage += 'Failed to save recording. Please try again.';
                        } else {
                          errorMessage += error.message;
                        }
                        
                        setShowErrorModal(true);
                        setErrorMessage(errorMessage);
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    ✅ Save & Complete
                  </button>
                  <button
                    onClick={() => {
                      setRecordedBlob(null);
                      setIsRecording(false);
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    🔄 Re-record
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-4xl mb-4">🎤</div>
                <p className="text-slate-600 mb-4">Click record to start recording your voice</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowVoiceModal(null)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        // Get microphone access
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        const recorder = new MediaRecorder(stream);
                        setMediaRecorder(recorder);
                        
                        const chunks = [];
                        recorder.ondataavailable = (event) => {
                          chunks.push(event.data);
                        };
                        
                        recorder.onstop = async () => {
                          const blob = new Blob(chunks, { type: 'audio/webm' });
                          // Store the recording for later use
                          setRecordedBlob(blob);
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
                        setErrorMessage('Error accessing microphone. Please try again.');
                        setShowErrorModal(true);
                        setIsRecording(false);
                        setCountdown(0);
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Start Recording
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">❌</div>
              <h3 className="text-lg font-bold text-red-600 mb-4">
                Error!
              </h3>
              <p className="text-gray-700 mb-6">
                {errorMessage}
              </p>
              <button
                onClick={() => setShowErrorModal(false)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
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
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-lg font-bold text-green-600 mb-4">
                Success!
              </h3>
              <p className="text-gray-700 mb-6">
                {successMessage}
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
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
