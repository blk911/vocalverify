"use client";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowButton(true), 6500); // 6.5s
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

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* LOGO - separate container */}
      <div className="relative z-10 flex h-full w-full items-center justify-center">
        <img
          src="/amihuman.png"
          alt=""
          className="block mx-auto w-[320px] md:w-[520px] drop-shadow-[0_0_35px_rgba(255,200,0,0.8)] select-none"
          draggable={false}
        />
      </div>

      {/* ENTER button - separate container, positioned below logo */}
      {showButton && (
        <div className="absolute z-10 flex w-full justify-center" style={{ top: 'calc(50% + 200px)' }}>
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
      )}
    </main>
  );
}