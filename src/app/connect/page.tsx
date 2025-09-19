"use client";
import { useState, useRef } from "react";
// import InteractiveGuide from "@/components/InteractiveGuide"; // PAUSED - will trigger later

export default function ConnectPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [voiceRecorded, setVoiceRecorded] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState(null);
  const [picture, setPicture] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  // const [showGuide, setShowGuide] = useState(false); // PAUSED - will trigger later
  
  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  // Show guide on first visit (unless dismissed) - PAUSED
  // useEffect(() => {
  //   const dismissed = localStorage.getItem("aih.guide.dismissed") === "1";
  //   setShowGuide(!dismissed);
  // }, []);

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0,3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6,10)}`;
  };

  const getMemberCode = (formattedPhone) => {
    const digits = formattedPhone.replace(/\D/g, "");
    return digits; // Return just the 10-digit member code
  };

  const handleNameFocus = () => {
    nameRef.current?.focus();
  };

  const handlePhoneFocus = () => {
    phoneRef.current?.focus();
  };

  const handleVoiceRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setVoiceBlob(blob);
        setVoiceRecorded(true);
        setIsRecording(false);
        setCountdown(0);
        setShowRecordingModal(false);
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Show recording modal and start countdown
      setShowRecordingModal(true);
      setIsRecording(true);
      setCountdown(5);
      
      // Start recording immediately
      mediaRecorder.start();
      
      // Recording countdown: "RECORDING 5 4 3 2 1"
      const recordingCountdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(recordingCountdownInterval);
            mediaRecorder.stop();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error recording voice:', error);
      alert('Error recording voice. Please try again.');
      setIsRecording(false);
      setCountdown(0);
      setShowRecordingModal(false);
    }
  };

  const handleVoiceReview = () => {
    if (voiceBlob) {
      const audio = new Audio(URL.createObjectURL(voiceBlob));
      audio.play();
    }
  };

  const handlePictureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPicture(URL.createObjectURL(file));
      setStep(4);
    }
  };

  const handleConfirm = () => {
    setStep(5);
  };

  const handleAdminAccess = async () => {
    try {
      if (adminCode === "0000000000") {
        // Valid admin code - redirect to admin dashboard
        window.location.href = '/admin-dashboard';
      } else {
        // Invalid admin code
        alert('Invalid admin code');
        setAdminCode("");
      }
    } catch (error) {
      console.error('Error checking admin code:', error);
      alert('Error checking admin code');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '400px',
        height: '600px',
        backgroundColor: 'white',
        border: '2px solid #ccc',
        borderRadius: '8px',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflow: 'auto'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '10px',
          textAlign: 'center',
          color: '#000',
          display: 'block'
        }}>Am I Human...?</h2>
        <p style={{
          fontSize: '14px',
          textAlign: 'center',
          marginBottom: '30px',
          color: '#666'
        }}>only the people you love know...</p>

        {step === 1 && (
          <div style={{ width: '100%' }}>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={handleNameFocus}
              placeholder="ENTER YOUR FIRST, LAST NAME"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '16px',
                color: '#000',
                backgroundColor: '#fff',
                display: 'block',
                marginBottom: '10px'
              }}
            />
            <button
              onClick={() => {
                setStep(2);
                setTimeout(() => phoneRef.current?.focus(), 100);
              }}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                marginTop: '20px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'block'
              }}
            >
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ width: '100%' }}>
            <input
              ref={phoneRef}
              type="tel"
              value={formatPhone(phone)}
              onChange={(e) => setPhone(e.target.value)}
              onFocus={handlePhoneFocus}
              placeholder="ENTER YOUR CELL NUMBER"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '16px',
                color: '#000',
                backgroundColor: '#fff',
                display: 'block',
                marginBottom: '10px'
              }}
            />
            <button
              onClick={() => setStep(3)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                marginTop: '20px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'block'
              }}
            >
              Next
            </button>
          </div>
        )}


        {step === 3 && (
          <div style={{ width: '100%', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '20px', color: '#000', fontSize: '18px', fontWeight: 'bold' }}>PICTURE</h3>
            <p style={{ marginBottom: '20px', color: '#666', fontSize: '14px' }}>Take a selfie or upload photo</p>
            <input
              type="file"
              accept="image/*"
              onChange={handlePictureUpload}
              style={{ 
                marginBottom: '20px',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: '#fff',
                color: '#000',
                fontSize: '16px',
                display: 'block',
                width: '100%'
              }}
            />
            {picture && (
              <div style={{ marginBottom: '20px' }}>
                <img
                  src={picture}
                  alt="Uploaded"
                  style={{
                    width: '100px',
                    height: '100px',
                    objectFit: 'cover',
                    borderRadius: '50%'
                  }}
                />
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div style={{ width: '100%' }}>
            <h3 style={{ marginBottom: '20px', textAlign: 'center', color: '#000', fontSize: '18px', fontWeight: 'bold' }}>CONFIRM</h3>
            <p style={{ marginBottom: '20px', textAlign: 'center', color: '#666', fontSize: '14px' }}>Confirm your information</p>
            
            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px', color: '#000' }}>
              <strong>Name:</strong> {name}
            </div>
            
            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px', color: '#000' }}>
              <strong>Phone:</strong> {formatPhone(phone)}
            </div>
            
            <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px', color: '#000' }}>
              <strong>Picture:</strong> {picture ? '✓ Uploaded' : '✗ Not uploaded'}
              {picture && (
                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                  <img
                    src={picture}
                    alt="Uploaded"
                    style={{
                      width: '80px',
                      height: '80px',
                      objectFit: 'cover',
                      borderRadius: '50%',
                      border: '2px solid #ccc'
                    }}
                  />
                </div>
              )}
            </div>
            
            <button
              onClick={handleConfirm}
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Confirm Information
            </button>
          </div>
        )}

        {step === 5 && (
          <div style={{ width: '100%' }}>
            <h3 style={{ marginBottom: '20px', textAlign: 'center', color: '#000', fontSize: '18px', fontWeight: 'bold' }}>REVIEW</h3>
            <div style={{ marginBottom: '15px', color: '#000' }}>
              <strong>Name:</strong> {name}
              <button
                onClick={() => setStep(1)}
                style={{
                  marginLeft: '10px',
                  padding: '5px 10px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ccc',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Edit
              </button>
            </div>
            <div style={{ marginBottom: '15px', color: '#000' }}>
              <strong>Phone:</strong> {formatPhone(phone)}
              <button
                onClick={() => setStep(2)}
                style={{
                  marginLeft: '10px',
                  padding: '5px 10px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ccc',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Edit
              </button>
            </div>
            <div style={{ marginBottom: '20px', color: '#000' }}>
              <strong>Picture:</strong> {picture ? 'Uploaded ✓' : 'Not uploaded'}
              {picture && (
                <div style={{ marginTop: '10px' }}>
                  <img
                    src={picture}
                    alt="Uploaded"
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '50%'
                    }}
                  />
                </div>
              )}
              <button
                onClick={() => setStep(3)}
                style={{
                  marginLeft: '10px',
                  padding: '5px 10px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ccc',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Edit
              </button>
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Create User
            </button>
          </div>
        )}
      </div>

      {/* Admin Access Label */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)'
      }}>
        <button
          onClick={() => setShowAdminModal(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#666',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          ADMIN
        </button>
      </div>

      {/* Recording Modal */}
      {showRecordingModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '8px',
            textAlign: 'center',
            maxWidth: '300px',
            width: '90%'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#ef4444',
              marginBottom: '20px'
            }}>
              🔴 RECORDING
            </div>
            <div style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: '#ef4444',
              marginBottom: '20px'
            }}>
              {countdown}
            </div>
            <p style={{ color: '#666', fontSize: '16px' }}>Speak now!</p>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            textAlign: 'center',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#000', fontSize: '18px', fontWeight: 'bold' }}>Submit Information</h3>
            <p style={{ marginBottom: '30px', color: '#666', fontSize: '14px' }}>Are you ready to submit your information?</p>
            <div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ccc',
                  color: '#000',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '10px',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    // First check member code status
                    const memberCode = getMemberCode(phone);
                    const checkResponse = await fetch('/api/user/check', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ phone: memberCode })
                    });
                    
                    const checkData = await checkResponse.json();
                    
                    if (checkData.exists && checkData.status === 'registered') {
                      // User is already registered - go to dashboard
                      window.location.href = `/dashboard?name=${encodeURIComponent(checkData.name)}`;
                      return;
                    }
                    
                    
                    // Create/update user
                    const createResponse = await fetch('/api/user/create', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        phone: memberCode,
                        name,
                        voiceBlob: voiceBlob ? 'recorded' : null,
                        picture: picture ? 'uploaded' : null
                      })
                    });
                    
                    const createData = await createResponse.json();
                    
                    if (createData.ok) {
                      // Redirect to dashboard
                      window.location.href = `/dashboard?name=${encodeURIComponent(name)}`;
                    } else {
                      alert('Error creating user: ' + createData.error);
                    }
                  } catch (error) {
                    console.error('Error:', error);
                    alert('Error processing request. Please try again.');
                  }
                  setShowModal(false);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Modal */}
      {showAdminModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            textAlign: 'center',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ marginBottom: '20px' }}>Admin Access</h3>
            <p style={{ marginBottom: '20px', color: '#666' }}>Enter admin member code</p>
            
            <input
              type="tel"
              value={formatPhone(adminCode)}
              onChange={(e) => setAdminCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="(000) 000-0000"
              aria-label="Admin member code"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '16px',
                marginBottom: '20px'
              }}
            />
            
            <div>
              <button
                onClick={() => setShowAdminModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ccc',
                  color: '#000',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdminAccess}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Access
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Guide Modal - PAUSED */}
      {/* <InteractiveGuide
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        onFinish={() => {
          // Guide completed - continue with normal flow
          console.log("Guide completed");
        }}
        username={name || "New Member"}
      /> */}
    </div>
  );
}
