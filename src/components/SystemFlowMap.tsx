"use client";

import React, { useMemo } from "react";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";

type NodeSpec = { id: string; label: string; group?: string; x?: number; y?: number };
type EdgeSpec = { from: string; to: string; label?: string };

const nodesSpec: NodeSpec[] = [
  { id: "register", label: "/register", group: "Registration", x: 0,  y: 0 },
  { id: "create",   label: "POST /api/user/create", group: "Registration", x: 250, y: 0 },
  { id: "complete", label: "/complete-registration", group: "Registration", x: 500, y: 0 },
  { id: "status",   label: "status: registered", group: "Registration", x: 750, y: 0 },
  { id: "dash",     label: "/member-dashboard", group: "Shared", x: 1000, y: 0 },
  { id: "connect",  label: "/connect", group: "Auth", x: 0, y: 200 },
  { id: "phone",    label: "POST /api/user/phone", group: "Auth", x: 250, y: 200 },
  { id: "tbCreate", label: "POST /api/trust/bonds/create", group: "Trust", x: 500, y: 200 },
  { id: "tbAccept", label: "POST /api/trust/bonds/accept", group: "Trust", x: 750, y: 200 },
  { id: "tuList",   label: "GET /api/trust/units/list", group: "Trust", x: 1000, y: 200 },
  { id: "vaultMsgs", label: "GET /api/vaults/[id]/messages", group: "Chat/Vault", x: 500, y: 400 },
  { id: "chatStart", label: "POST /api/chat/start", group: "Chat/Vault", x: 750, y: 400 },
  { id: "chatSend",  label: "POST /api/chat/send", group: "Chat/Vault", x: 1000, y: 400 },
  { id: "voiceUpload", label: "POST /api/voice/upload", group: "Voice", x: 250, y: 600 },
  { id: "voiceAnalyze", label: "POST /api/voice/analyze", group: "Voice", x: 500, y: 600 },
  { id: "voiceVerify",  label: "POST /api/voice/aws-verify", group: "Voice", x: 750, y: 600 },
];

const edgesSpec: EdgeSpec[] = [
  { from: "register", to: "create" },
  { from: "create", to: "complete" },
  { from: "complete", to: "status" },
  { from: "status", to: "dash" },
  { from: "connect", to: "phone" },
  { from: "phone", to: "dash", label: "found" },
  { from: "phone", to: "register", label: "not found" },
  { from: "dash", to: "tbCreate" },
  { from: "tbCreate", to: "tbAccept" },
  { from: "tbAccept", to: "tuList" },
  { from: "dash", to: "vaultMsgs" },
  { from: "dash", to: "chatStart" },
  { from: "chatStart", to: "chatSend" },
  { from: "chatSend", to: "vaultMsgs" },
  { from: "dash", to: "voiceUpload" },
  { from: "voiceUpload", to: "voiceAnalyze" },
  { from: "voiceAnalyze", to: "voiceVerify" },
  { from: "voiceVerify", to: "status" },
];

export default function SystemFlowMap() {
  const nodes = useMemo(() => nodesSpec.map(n => ({
    id: n.id,
    position: { x: n.x ?? 0, y: n.y ?? 0 },
    data: { 
      label: (
        <div className="px-3 py-2 rounded-xl shadow bg-white">
          <div className="text-xs text-gray-500">{n.group ?? "Flow"}</div>
          <div className="text-sm font-medium">{n.label}</div>
        </div>
      )
    },
    draggable: true,
    style: { borderRadius: 16, padding: 0, border: "none", background: "transparent" }
  })), []);

  const edges = useMemo(() => edgesSpec.map((e, i) => ({
    id: `e-${i}`, 
    source: e.from, 
    target: e.to, 
    animated: false, 
    label: e.label,
    type: "default", 
    labelBgPadding: [6, 2] as [number, number], 
    labelShowBg: !!e.label
  })), []);

  return (
    <div style={{ height: "70vh" }} className="rounded-2xl overflow-hidden border">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <MiniMap pannable zoomable />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}

