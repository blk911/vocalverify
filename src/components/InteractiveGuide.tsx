"use client";
import { useState } from 'react';

interface InteractiveGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: () => void;
}

export default function InteractiveGuide({ isOpen, onClose, onFinish }: InteractiveGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to AM I HUMAN.net",
      content: "This guide will help you complete your member profile setup.",
      action: "Next"
    },
    {
      title: "Voice Recording",
      content: "You'll need to record your voice for verification purposes.",
      action: "Next"
    },
    {
      title: "Profile Completion",
      content: "Complete all required fields to activate your membership.",
      action: "Finish"
    }
  ];

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onFinish();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">{currentStepData.title}</h2>
        <p className="text-gray-700 mb-6">{currentStepData.content}</p>
        
        <div className="flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {currentStepData.action}
          </button>
        </div>
        
        <div className="mt-4 flex justify-center space-x-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
