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