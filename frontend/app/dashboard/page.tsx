'use client';

import { useState } from 'react';

type Role = 'Developer' | 'PM' | 'Support';

export default function Dashboard() {
  const [text, setText] = useState('');
  const [summaries, setSummaries] = useState<Record<Role, string> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSummarize = async () => {
    setIsLoading(true);
    setSummaries(null);
    const roles: Role[] = ['Developer', 'PM', 'Support'];
    const newSummaries: Record<Role, string> = { Developer: '', PM: '', Support: '' };

    for (const role of roles) {
      try {
        const response = await fetch('/api/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, role }),
        });
        const data = await response.json();
        newSummaries[role] = data.summary;
      } catch (error) {
        console.error(`Error summarizing for ${role}:`, error);
        newSummaries[role] = 'Failed to generate summary.';
      }
    }

    setSummaries(newSummaries);
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <textarea
            className="w-full h-64 p-2 border rounded"
            placeholder="Paste your PR diff, commit logs, or ticket here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          ></textarea>
          <button
            className="mt-4 w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            onClick={handleSummarize}
            disabled={isLoading || !text}
          >
            {isLoading ? 'Generating Summaries...' : 'Summarize'}
          </button>
        </div>
        <div>
          {isLoading && <p>Loading...</p>}
          {summaries && (
            <div className="space-y-4">
              {Object.entries(summaries).map(([role, summary]) => (
                <div key={role} className="bg-white shadow-md rounded-lg p-4">
                  <h2 className="text-xl font-semibold mb-2">{role} Summary</h2>
                  <p className="text-gray-700">{summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
