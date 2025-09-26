"use client";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [showButton, setShowButton] = useState(false);
  const [buttonSlide, setButtonSlide] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowButton(true), 6500); // 6.5s delay
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setButtonSlide(true), 20); // 0.02s delay for slide
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black">
      {/* Background video */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        playsInline
      >
        <source src="/bg.mp4" type="video/mp4" />
      </video>

      {/* Logo and Branding */}
      <div className="absolute z-10 inset-0 flex flex-col items-center justify-center">
        <div className="flex items-center space-x-4 mb-8">
          {/* Logo */}
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center shadow-2xl">
            <span className="text-2xl font-bold text-white">A</span>
          </div>
          {/* Brand Text */}
          <h1 className="text-4xl font-bold text-white tracking-wide">
            amihuman.net
          </h1>
        </div>
      </div>

      {/* ENTER button - separate element, positioned below */}
      <div 
        className="absolute z-10 flex w-full justify-center transition-all duration-1000 ease-out"
        style={{ 
          bottom: buttonSlide ? '100px' : 'calc(100vh + 100px)', // Start off-screen, slide to 100px from bottom
        }}
      >
        <button
          className="
            px-6 py-2     /* thinner vertical padding */
            text-base font-semibold tracking-wide
            text-white    /* white text */
            bg-gray-600   /* soft grey background */
            rounded-md    /* smaller corner radius */
            shadow-md     /* subtle shadow */
            hover:bg-gray-500 
            focus:outline-none focus:ring-2 focus:ring-gray-400/60
            transition-opacity duration-700 opacity-0 data-[show=true]:opacity-100
          "
          data-show={showButton}
          onClick={() => (window.location.href = "/connect")}
        >
          ENTER
        </button>
      </div>
    </main>
  );
}