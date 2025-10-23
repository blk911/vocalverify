'use client';
import { useState } from 'react';

type Step = 'idle' | 'seeding' | 'refining' | 'preview' | 'saving' | 'error';
type Extraction = { summary: string; anchors: string[]; confidence: number };

function safeFetch(url: string, init?: RequestInit) {
  // tolerate missing API during early wiring
  return fetch(url, init).catch(() =>
    new Response(JSON.stringify({ error: 'offline' }), { status: 599 })
  );
}

export default function PromptPanel() {
  const [step, setStep] = useState<Step>('idle');
  const [domain, setDomain] = useState<string>('cooking');
  const [prompt, setPrompt] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [preview, setPreview] = useState<Extraction | null>(null);
  const [authUsable, setAuthUsable] = useState<boolean>(false);

  async function startSession() {
    setPreview(null);
    setAnswer('');
    setStep('seeding');
    setPrompt('Cooking: Tell me something that defines how cooking worked in your family.');
    // optional notify (will no-op if API not wired)
    await safeFetch('/api/profile/session', { method: 'POST' });
  }

  async function submitAnswer(next: 'refine' | 'preview') {
    if (next === 'refine') {
      setStep('refining');
      // fake a refine prompt locally for now
      setTimeout(() => {
        setPrompt('Name the first dish you tried to copy, and how it went.');
        setAnswer('');
        setStep('refining');
      }, 50);
      return;
    }
    // preview path
    setStep('preview');
    // either ask API or synthesize a preview
    const res = await safeFetch('/api/profile/extract', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ domain, prompt, answer }),
    });
    let j: any = {};
    try { j = await res.json(); } catch {}
    const p = (j?.preview as Extraction) ?? {
      summary: 'Mother taught by example; first copied biscuits.',
      anchors: ['Cooking', 'Biscuits', 'Observation'],
      confidence: 0.92,
    };
    setPreview(p);
  }

  async function saveArtifact() {
    if (!preview) return;
    setStep('saving');
    await safeFetch('/api/profile/artifacts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ domain, preview, authUsable }),
    });
    setStep('idle');
    setPreview(null);
    setAnswer('');
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm text-gray-600">Domain</label>
        <select
          className="border rounded px-2 py-1"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          aria-label="Select domain"
        >
          <option value="cooking">cooking</option>
          <option value="trips">trips</option>
          <option value="rituals">rituals</option>
        </select>
      </div>

      {step === 'idle' && (
        <button className="border rounded px-3 py-1" onClick={startSession}>
          Start
        </button>
      )}

      {(step === 'seeding' || step === 'refining') && (
        <div className="space-y-3">
          <div className="rounded border p-3">{prompt}</div>
          <textarea
            className="w-full border rounded p-2 min-h-[120px]"
            placeholder="Type your answer (voice coming soon)…"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <div className="flex gap-2">
            <button className="border rounded px-3 py-1" onClick={() => submitAnswer('refine')}>Refine</button>
            <button className="border rounded px-3 py-1" onClick={() => submitAnswer('preview')}>Preview</button>
          </div>
        </div>
      )}

      {step === 'preview' && preview && (
        <div className="space-y-3">
          <div className="rounded border p-3">
            <div className="font-medium">{preview.summary}</div>
            <div className="text-sm mt-1">Anchors: {preview.anchors.join(', ')}</div>
            <div className="text-xs text-gray-500">Confidence: {Math.round(preview.confidence * 100)}%</div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={authUsable} onChange={(e) => setAuthUsable(e.target.checked)} />
            Make this auth-usable in selected TB
          </label>
          <div className="flex gap-2">
            <button className="border rounded px-3 py-1" onClick={saveArtifact}>Save</button>
            <button className="border rounded px-3 py-1" onClick={() => { setStep('idle'); setPreview(null); }}>Discard</button>
          </div>
        </div>
      )}

      {step === 'saving' && <p>Saving…</p>}
      {step === 'error' && <p className="text-red-600">Error—try again.</p>}
    </div>
  );
}