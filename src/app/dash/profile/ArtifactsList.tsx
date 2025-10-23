'use client';

type Artifact = { id: string; theme: string; summary: string; date: string };

const DEFAULT_ARTIFACTS: Artifact[] = [
  { id: 'a1', theme: 'cooking', summary: 'Mother taught by example; biscuits first copy', date: '2025-10-20' },
];

export default function ArtifactsList() {
  const items = DEFAULT_ARTIFACTS;

  return (
    <ul className="divide-y">
      {items.map(i => (
        <li key={i.id} className="py-2">
          <div className="text-sm font-medium">{i.theme}</div>
          <div className="text-sm text-gray-700">{i.summary}</div>
          <div className="text-xs text-gray-500">{i.date}</div>
        </li>
      ))}
    </ul>
  );
}