"use client";
import { useEffect, useState } from "react";

export default function HomePage() {
  // message sequence
  const [showFirst, setShowFirst] = useState(false);
  const [showSecond, setShowSecond] = useState(false);

  // enter button (appears after the sequence; change delay if you want 6.5s)
  const [showEnter, setShowEnter] = useState(false);

  useEffect(() => {
    // timeline (ms): 0: first on, 2000: first off + second on, 4000: second off, 4500: show button
    const t1 = setTimeout(() => setShowFirst(true), 0);
    const t2 = setTimeout(() => { setShowFirst(false); setShowSecond(true); }, 2000);
    const t3 = setTimeout(() => setShowSecond(false), 4000);
    const t4 = setTimeout(() => setShowEnter(true), 4500);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  return (
    <main className="relative h-screen w-full overflow-hidden bg-black">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/amihuman-bkgrnd.png)" }}
        aria-hidden
      />

      {/* Two-step messages at 40% from top, horizontally centered */}
      <div className="pointer-events-none absolute left-1/2 top-[40%] z-10 -translate-x-1/2 -translate-y-1/2">
        {/* first line */}
        <p
          className={[
            "text-center text-2xl font-semibold text-white transition-opacity duration-500",
            showFirst ? "opacity-100" : "opacity-0",
          ].join(" ")}
        >
          Does Google, Apple, or FB know you're human...?
        </p>

        {/* second line (occupies space only when visible so there's no layout jump) */}
        <p
          className={[
            "mt-3 text-center text-2xl font-semibold text-white transition-opacity duration-500",
            showSecond ? "opacity-100" : "opacity-0",
          ].join(" ")}
        >
          ...only your loved ones know!
        </p>
      </div>

      {/* ENTER button â€” centered near bottom; fades in after sequence */}
      <div className="absolute bottom-24 left-1/2 z-10 -translate-x-1/2">
        <button
          onClick={() => (window.location.href = "/connect")}
          className={[
            // thinner, soft gray, white letters
            "px-6 py-2 text-base font-semibold tracking-wide text-white",
            "bg-gray-600/90 hover:bg-gray-500 rounded-md shadow-md",
            "focus:outline-none focus:ring-2 focus:ring-gray-400/60",
            "transition-opacity duration-700",
            showEnter ? "opacity-100" : "opacity-0",
          ].join(" ")}
          aria-hidden={!showEnter}
        >
          ENTER
        </button>
      </div>
    </main>
  );
}



