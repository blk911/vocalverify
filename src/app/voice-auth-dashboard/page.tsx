'use client';

import { useState } from 'react';

interface VoiceAuthResult {
  contentMatch: boolean;
  biometricMatch: boolean;
  overallMatch: boolean;
  confidence: number;
  details: string;
}

interface SpellingResult {
  spellingMatch: boolean;
  confidence: number;
  details: string;
}

interface MultiFactorResult {
  authenticated: boolean;
  confidence: number;
  securityLevel: string;
  factors: string[];
}

interface AntiSpoofResult {
  isLive: boolean;
  isSpoofed: boolean;
  securityScore: number;
  recommendation: string;
}

export default function VoiceAuthDashboard() {
  const [memberCode, setMemberCode] = useState('1234');
  const [isRecording, setIsRecording] = useState(false);
  const [results, setResults] = useState<{
    verification?: VoiceAuthResult;
    spelling?: SpellingResult;
    multiFactor?: MultiFactorResult;
    antiSpoof?: AntiSpoofResult;
  }>({});

  const startRecording = () => {
    setIsRecording(true);
    };

  const stopRecording = () => {
    setIsRecording(false);
    };

  const testVoiceVerification = async () => {
    try {
      const response = await fetch('/api/voice/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBuffer: 'test_audio_data',
          memberCode,
          expectedContent: 'My name is Spencer'
        })
      });
      
      const data = await response.json();
      if (data.ok) {
        setResults(prev => ({ ...prev, verification: data.verification }));
      }
    } catch (error) {
      }
  };

  const testSpellingVerification = async () => {
    try {
      const response = await fetch('/api/voice/spelling-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBuffer: 'test_audio_data',
          memberCode,
          expectedSpelling: 'WENDT'
        })
      });
      
      const data = await response.json();
      if (data.ok) {
        setResults(prev => ({ ...prev, spelling: data.spellingVerification }));
      }
    } catch (error) {
      }
  };

  const testMultiFactorAuth = async () => {
    try {
      const response = await fetch('/api/voice/multi-factor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBuffer: 'test_audio_data',
          memberCode,
          expectedContent: 'My name is Spencer Wendt, phone 555-123-4567'
        })
      });
      
      const data = await response.json();
      if (data.ok) {
        setResults(prev => ({ ...prev, multiFactor: data.multiFactorAuth.overallResult }));
      }
    } catch (error) {
      }
  };

  const testAntiSpoofing = async () => {
    try {
      const response = await fetch('/api/voice/anti-spoof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBuffer: 'test_audio_data',
          memberCode
        })
      });
      
      const data = await response.json();
      if (data.ok) {
        setResults(prev => ({ ...prev, antiSpoof: data.antiSpoofAnalysis }));
      }
    } catch (error) {
      }
  };

  const runAllTests = async () => {
    await testVoiceVerification();
    await testSpellingVerification();
    await testMultiFactorAuth();
    await testAntiSpoofing();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🎤 Voice Authentication Dashboard
          </h1>
          <p className="text-xl text-blue-200">
            Advanced Voice Biometric Testing & Verification
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recording Controls */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">🎙️ Voice Recording</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white mb-2">Member Code</label>
                <input
                  type="text"
                  value={memberCode}
                  onChange={(e) => setMemberCode(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/70 border border-white/30"
                  placeholder="Enter member code"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={startRecording}
                  disabled={isRecording}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    isRecording 
                      ? 'bg-red-500 text-white cursor-not-allowed' 
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {isRecording ? '🔴 Recording...' : '🎤 Start Recording'}
                </button>
                
                <button
                  onClick={stopRecording}
                  disabled={!isRecording}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    !isRecording 
                      ? 'bg-gray-500 text-white cursor-not-allowed' 
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  ⏹️ Stop Recording
                </button>
              </div>
            </div>
          </div>

          {/* Test Controls */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">🧪 Voice Tests</h2>
            
            <div className="space-y-4">
              <button
                onClick={testVoiceVerification}
                className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all"
              >
                🔍 Test Voice Verification
              </button>
              
              <button
                onClick={testSpellingVerification}
                className="w-full px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-all"
              >
                🔤 Test Spelling Verification
              </button>
              
              <button
                onClick={testMultiFactorAuth}
                className="w-full px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-all"
              >
                🔐 Test Multi-Factor Auth
              </button>
              
              <button
                onClick={testAntiSpoofing}
                className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all"
              >
                🛡️ Test Anti-Spoofing
              </button>
              
              <button
                onClick={runAllTests}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-lg font-semibold transition-all"
              >
                🚀 Run All Tests
              </button>
            </div>
          </div>
        </div>

        {/* Results Display */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Voice Verification Results */}
          {results.verification && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">🔍 Voice Verification</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white">Content Match:</span>
                  <span className={results.verification.contentMatch ? 'text-green-400' : 'text-red-400'}>
                    {results.verification.contentMatch ? '✅' : '❌'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Biometric Match:</span>
                  <span className={results.verification.biometricMatch ? 'text-green-400' : 'text-red-400'}>
                    {results.verification.biometricMatch ? '✅' : '❌'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Overall Match:</span>
                  <span className={results.verification.overallMatch ? 'text-green-400' : 'text-red-400'}>
                    {results.verification.overallMatch ? '✅' : '❌'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Confidence:</span>
                  <span className="text-yellow-400">
                    {(results.verification.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Spelling Verification Results */}
          {results.spelling && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">🔤 Spelling Verification</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white">Spelling Match:</span>
                  <span className={results.spelling.spellingMatch ? 'text-green-400' : 'text-red-400'}>
                    {results.spelling.spellingMatch ? '✅' : '❌'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Confidence:</span>
                  <span className="text-yellow-400">
                    {(results.spelling.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-sm text-blue-200 mt-2">
                  {results.spelling.details}
                </div>
              </div>
            </div>
          )}

          {/* Multi-Factor Auth Results */}
          {results.multiFactor && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">🔐 Multi-Factor Auth</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white">Authenticated:</span>
                  <span className={results.multiFactor.authenticated ? 'text-green-400' : 'text-red-400'}>
                    {results.multiFactor.authenticated ? '✅' : '❌'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Confidence:</span>
                  <span className="text-yellow-400">
                    {(results.multiFactor.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Security Level:</span>
                  <span className="text-green-400">
                    {results.multiFactor.securityLevel.toUpperCase()}
                  </span>
                </div>
                <div className="text-sm text-blue-200 mt-2">
                  Factors: {results.multiFactor.factors.join(', ')}
                </div>
              </div>
            </div>
          )}

          {/* Anti-Spoofing Results */}
          {results.antiSpoof && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">🛡️ Anti-Spoofing</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white">Live Voice:</span>
                  <span className={results.antiSpoof.isLive ? 'text-green-400' : 'text-red-400'}>
                    {results.antiSpoof.isLive ? '✅' : '❌'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Spoofed:</span>
                  <span className={!results.antiSpoof.isSpoofed ? 'text-green-400' : 'text-red-400'}>
                    {!results.antiSpoof.isSpoofed ? '✅' : '❌'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Security Score:</span>
                  <span className="text-yellow-400">
                    {(results.antiSpoof.securityScore * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-sm text-blue-200 mt-2">
                  Recommendation: {results.antiSpoof.recommendation}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

