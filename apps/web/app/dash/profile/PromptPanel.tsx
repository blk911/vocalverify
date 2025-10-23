'use client';
import { useEffect, useMemo, useState } from "react";

type Step = "idle"|"seeding"|"refining"|"preview"|"saving"|"error";
type Pack = { relationship:string; domains:{name:string;seeds:string[];refine:string[]}[]; nonce_words:string[] };
type Extraction = { summary:string; anchors:string[]; emotion?:string; confidence:number };

const API = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

export default function PromptPanel() {
  const [step, setStep] = useState<Step>("idle");
  const [pack, setPack] = useState<Pack | null>(null);
  const [domain, setDomain] = useState<string>("cooking");
  const [prompt, setPrompt] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [preview, setPreview] = useState<Extraction | null>(null);
  const [tbId, setTbId] = useState<string | null>(null);
  const [authUsable, setAuthUsable] = useState(false);

  useEffect(() => {
    // prefetch packs/domains
    fetch(`${API}/profile/anticipate`, { method:"GET" })
      .then(r=>r.json()).then(j=> setPack(j.pack ?? null))
      .catch(()=>{});
  }, []);

  const domainSeeds = useMemo(() => {
    const d = pack?.domains.find(d => d.name===domain);
    return d?.seeds ?? [];
  }, [pack, domain]);

  async function startSession() {
    setPreview(null); setAnswer(""); setStep("seeding");
    const seed = domainSeeds[0] ?? "Tell me a story from this domain.";
    setPrompt(seed);
    // (optional) notify API a session started
    await fetch(`${API}/profile/session`, { method:"POST", headers:{'content-type':'application/json'}, body: JSON.stringify({ tbId, domain }) });
  }

  async function submitAnswer(nextPhase:"refine"|"preview") {
    setStep(nextPhase === "refine" ? "refining" : "preview");
    const r = await fetch(`${API}/profile/extract`, {
      method:"POST",
      headers:{'content-type':'application/json'},
      body: JSON.stringify({ tbId, domain, prompt, answer })
    });
    const j = await r.json();
    if (j.error) { setStep("error"); return; }
    if (j.refinePrompt && nextPhase==="refine") {
      setPrompt(j.refinePrompt);
      setAnswer("");
      return;
    }
    if (j.preview) {
      setPreview(j.preview);
      return;
    }
    setStep("error");
  }

  async function saveArtifact() {
    if (!preview) return;
    setStep("saving");
    const r = await fetch(`${API}/profile/artifacts`, {
      method:"POST",
      headers:{'content-type':'application/json'},
      body: JSON.stringify({ tbId, domain, preview, authUsable })
    });
    const j = await r.json();
    if (j.ok) { setStep("idle"); setPreview(null); setAnswer(""); }
    else setStep("error");
  }

  return (
    <div className="rounded-xl border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Prompt Session</h2>
        <select
          className="border rounded px-2 py-1"
          value={domain}
          onChange={e=>setDomain(e.target.value)}
        >
          {(pack?.domains ?? [{name:"cooking",seeds:[],refine:[]}]).map(d=>(
            <option key={d.name} value={d.name}>{d.name}</option>
          ))}
        </select>
      </div>

      {step==="idle" && (
        <button className="border rounded px-3 py-1" onClick={startSession}>Start</button>
      )}

      {(step==="seeding" || step==="refining") && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Prompt</p>
          <div className="rounded border p-3">{prompt}</div>
          <textarea
            className="w-full border rounded p-2 min-h-[120px]"
            placeholder="Type your answer (voice coming soon)…"
            value={answer}
            onChange={e=>setAnswer(e.target.value)}
          />
          <div className="flex gap-2">
            <button className="border rounded px-3 py-1" onClick={()=>submitAnswer("refine")}>Refine</button>
            <button className="border rounded px-3 py-1" onClick={()=>submitAnswer("preview")}>Preview</button>
          </div>
        </div>
      )}

      {step==="preview" && preview && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Extraction Preview</p>
          <div className="rounded border p-3">
            <div className="font-medium">{preview.summary}</div>
            <div className="text-sm mt-1">Anchors: {preview.anchors.join(", ")}</div>
            <div className="text-xs text-gray-500">Confidence: {Math.round(preview.confidence*100)}%</div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={authUsable} onChange={e=>setAuthUsable(e.target.checked)} />
            Make this auth-usable in selected TB
          </label>
          <div className="flex gap-2">
            <button className="border rounded px-3 py-1" onClick={saveArtifact}>Save</button>
            <button className="border rounded px-3 py-1" onClick={()=>{ setStep("idle"); setPreview(null); }}>Discard</button>
          </div>
        </div>
      )}

      {step==="saving" && <p>Saving…</p>}
      {step==="error" && <p className="text-red-600">Error—try again.</p>}
    </div>
  );
}
