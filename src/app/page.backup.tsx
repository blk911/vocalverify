"use client";
import { useState } from "react";
import Link from "next/link";
import NameInputModal from "@/components/NameInputModal";

export default function Home() {
  const [show, setShow] = useState(false);
  const onAdminDashboard = (name: string) => { try{localStorage.setItem("userName",name);}catch{}; window.location.href="/admin-dashboard"; };
  const onMemberDashboard = (name: string) => { try{localStorage.setItem("userName",name);}catch{}; window.location.href="/member-dashboard?memberCode=demo"; };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[url('/amihuman-bkgrnd.png')] bg-cover bg-center">
      <div className="max-w-xl w-full mx-auto p-8 bg-white/90 backdrop-blur rounded-2xl shadow border text-center space-y-6">
        <h1 className="text-3xl font-bold">AM I HUMAN</h1>
        <p className="text-sm text-gray-600">Baseline home page check.</p>
        <button
          onClick={() => setShow(true)}
          className="inline-flex items-center justify-center rounded-xl px-6 py-3 border hover:bg-gray-50"
        >
          ENTER
        </button>
        <div className="text-xs text-gray-500">
          Or go: <Link className="underline" href="/member-dashboard?memberCode=demo">Member</Link> | <Link className="underline" href="/admin-dashboard">Admin</Link>
        </div>
      </div>
      {show && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow w-full max-w-md p-6">
            <NameInputModal
              isOpen={show}
              onClose={() => setShow(false)}
              onAdminDashboard={onAdminDashboard}
              onMemberDashboard={onMemberDashboard}
            />
          </div>
        </div>
      )}
    </main>
  );
}
