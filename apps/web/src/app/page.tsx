'use client';
import { useState } from 'react';

export default function Home() {
  const [step, setStep] = useState<"idle"|"nonce"|"name"|"challenge"|"done">("idle");
  const [prompt, setPrompt] = useState<string>("");

  async function start() {
    const r = await fetch("/api/anticipate", { method: "POST" });
    const j = await r.json();
    setPrompt(j.prebaked_challenges?.[0]?.prompt ?? "");
    setStep("nonce");
  }

  async function doNonce() {
    await fetch("/api/voice/nonce", { method: "POST" });
    setStep("name");
  }

  async function doName() {
    await fetch("/api/voice/name", { method: "POST" });
    setStep(prompt ? "challenge" : "done");
  }

  async function doChallenge() {
    await fetch("/api/challenge/answer", { method: "POST" });
    setStep("done");
    location.href = "/dash";
  }

  return (
    <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:'2rem'}}>
      <div style={{maxWidth:560}}>
        <h1>amihuman — Auth Flow (stub)</h1>
        {step==="idle" && <button onClick={start}>Enter</button>}
        {step==="nonce" && <>
          <p>Say the word <b>pinecone</b> (stub)</p>
          <button onClick={doNonce}>Continue</button>
        </>}
        {step==="name" && <>
          <p>Say your <b>full name</b> (stub)</p>
          <button onClick={doName}>Continue</button>
        </>}
        {step==="challenge" && <>
          <p>{prompt}</p>
          <button onClick={doChallenge}>Answer (stub)</button>
        </>}
        {step==="done" && <p>✅ Verified</p>}
      </div>
    </main>
  );
}