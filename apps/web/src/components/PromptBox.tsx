'use client';

interface PromptBoxProps {
  prompt: string;
}

export default function PromptBox({ prompt }: PromptBoxProps) {
  if (!prompt) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">AI</span>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-900 mb-1">System Prompt</h3>
          <p className="text-blue-800 text-sm leading-relaxed">{prompt}</p>
        </div>
      </div>
    </div>
  );
}
