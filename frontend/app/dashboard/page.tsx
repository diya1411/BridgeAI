"use client";

import { useState } from "react";
import { generateAllSummaries } from "./actions";
import { readStreamableValue } from "@ai-sdk/rsc";

type Role = "Developer" | "PM" | "Support";

function IconCopy({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      strokeWidth={2}
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconSpinner({ className = "w-5 h-5 animate-spin" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.2" stroke="currentColor" strokeWidth="4" />
      <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function IconExpand({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} strokeWidth={2}>
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  );
}

function IconCheck({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} strokeWidth={3}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}


interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role;
  content: string;
  onCopy: () => void;
  copied: boolean;
}

function Dialog({ isOpen, onClose, role, content, onCopy, copied }: DialogProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <div>
            <h2 className="text-[20px] font-semibold text-zinc-900">{role}</h2>
            <p className="text-[13px] text-zinc-500 mt-0.5">Full summary</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
          <div className="prose prose-sm max-w-none">
            <p className="text-[15px] text-zinc-700 leading-[1.7] whitespace-pre-wrap">
              {content || "No summary available."}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 bg-zinc-50">
          <button
            onClick={onCopy}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-200 transition-colors text-[13px] font-medium text-zinc-700"
          >
            {copied ? <IconCheck className="w-3.5 h-3.5" /> : <IconCopy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 transition-colors text-[13px] font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [text, setText] = useState("");
  const [summaries, setSummaries] = useState<Record<Role, string>>({
    Developer: "",
    PM: "",
    Support: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState<Role | null>(null);
  const [copiedRole, setCopiedRole] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  const roles: Role[] = ["Developer", "PM", "Support"];

  const handleSummarize = async () => {
    if (!text.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setSummaries({ Developer: "", PM: "", Support: "" });

    try {
      // Get all three streaming summaries in parallel
      const results = await generateAllSummaries(text);

      // Process each stream as it arrives
      await Promise.all(
        results.map(async ({ role, stream }) => {
          try {
            for await (const delta of readStreamableValue(stream)) {
              if (delta) {
                // Update by appending to existing content
                setSummaries((prev) => ({
                  ...prev,
                  [role]: prev[role] + delta,
                }));
              }
            }
          } catch (streamError) {
            console.error(`Stream error for ${role}:`, streamError);
            setSummaries((prev) => ({
              ...prev,
              [role]: "Error: Please check your API key in .env.local",
            }));
          }
        })
      );
    } catch (error) {
      console.error("Error generating summaries:", error);
      setError("Failed to generate summaries. Please check your API key and try again.");
      setSummaries({
        Developer: "Error: Unable to generate summary",
        PM: "Error: Unable to generate summary",
        Support: "Error: Unable to generate summary",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (role: Role) => {
    try {
      await navigator.clipboard.writeText(summaries[role]);
      setCopiedRole(role);
      setTimeout(() => setCopiedRole(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const roleInfo = {
    Developer: {
      icon: "{ }",
      description: "Technical details",
    },
    PM: {
      icon: "◆",
      description: "Business impact",
    },
    Support: {
      icon: "○",
      description: "Customer changes",
    },
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-lg">
            <div className="flex flex-col items-center gap-4">
              <IconSpinner className="w-8 h-8 text-zinc-900" />
              <div className="text-center">
                <p className="text-[15px] font-medium text-zinc-900">Generating summaries</p>
                <p className="text-[13px] text-zinc-500 mt-1">This will take a few seconds</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Minimal Header */}
      <div className="border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-baseline justify-between">
            <div>
              <h1 className="text-[28px] font-semibold tracking-tight text-zinc-900 mb-1">
                BridgeAI
              </h1>
              <p className="text-[15px] text-zinc-500">
                Technical content, translated for every team
              </p>
            </div>
            <div className="text-[13px] text-zinc-400">
              Powered by Gemini
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Panel */}
          <section className="lg:col-span-4">
            <div className="sticky top-8">
              <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200">
                <label className="block text-[13px] font-medium text-zinc-900 mb-3 uppercase tracking-wide">
                  Input
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your PR, commit, or technical update..."
                  className="w-full h-32 p-3 rounded-lg bg-white border border-zinc-200 focus:outline-none focus:border-zinc-400 resize-none text-[15px] text-zinc-900 placeholder:text-zinc-400 transition-colors"
                />
                
                <button
                  onClick={handleSummarize}
                  disabled={isLoading || !text.trim()}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-lg text-[15px] font-medium hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? <IconSpinner className="w-4 h-4 text-white" /> : null}
                  <span>{isLoading ? "Generating" : "Generate Summaries"}</span>
                </button>
              </div>

              {/* Context note */}
              <div className="mt-6 px-2">
                <p className="text-[13px] text-zinc-500 leading-relaxed">
                  Technical updates often get lost in translation. We help everyone on your team understand what matters to them.
                </p>
              </div>
            </div>
          </section>

          {/* Role Summaries */}
          <section className="lg:col-span-8">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-[14px] text-red-800 font-medium">{error}</p>
                <p className="text-[13px] text-red-600 mt-1">
                  Set GOOGLE_GENERATIVE_AI_API_KEY in frontend/.env.local and restart the dev server
                </p>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-[20px] font-semibold text-zinc-900 mb-1">Summaries</h2>
              <p className="text-[14px] text-zinc-500">Click to expand</p>
            </div>

            <div className="space-y-4">{roles.map((role) => (
                <article
                  key={role}
                  className="relative rounded-xl bg-white border border-zinc-200 p-5 hover:border-zinc-300 transition-all cursor-pointer group"
                  onClick={() => summaries[role] && setOpenDialog(role)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-[18px]">
                      {roleInfo[role].icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3 mb-2">
                        <div>
                          <h3 className="text-[17px] font-semibold text-zinc-900">{role}</h3>
                          <p className="text-[13px] text-zinc-500 mt-0.5">{roleInfo[role].description}</p>
                        </div>
                        
                        {summaries[role] && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(role);
                              }}
                              className="p-1.5 rounded-md hover:bg-zinc-100 transition-colors"
                              aria-label={`Copy ${role} summary`}
                            >
                              {copiedRole === role ? (
                                <IconCheck className="w-4 h-4 text-zinc-600" />
                              ) : (
                                <IconCopy className="w-4 h-4 text-zinc-400" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="min-h-[80px] text-[14px] text-zinc-700 leading-relaxed">
                        {isLoading ? (
                          <div className="flex items-center gap-2 text-zinc-400">
                            <IconSpinner className="w-4 h-4" />
                            <span>Generating summary...</span>
                          </div>
                        ) : summaries[role] ? (
                          <div>
                            <p className="line-clamp-3 whitespace-pre-wrap">{summaries[role]}</p>
                            {summaries[role].length > 200 && (
                              <button
                                onClick={() => setOpenDialog(role)}
                                className="mt-2 text-[13px] text-zinc-500 hover:text-zinc-900 transition-colors"
                              >
                                Read more →
                              </button>
                            )}
                          </div>
                        ) : (
                          <p className="text-zinc-400">Waiting for input</p>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        {/* Footer note */}
        <div className="mt-16 pt-8 border-t border-zinc-200">
          <div className="max-w-2xl">
            <h3 className="text-[15px] font-semibold text-zinc-900 mb-3">
              Why this exists
            </h3>
            <p className="text-[14px] text-zinc-600 leading-relaxed mb-3">
              Teams waste hours explaining technical changes to different stakeholders. 
              Developers want implementation details. PMs need business impact. 
              Support needs customer-facing changes.
            </p>
            <p className="text-[14px] text-zinc-600 leading-relaxed">
              BridgeAI translates once, everyone understands.
            </p>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {roles.map((role) => (
        <Dialog
          key={role}
          isOpen={openDialog === role}
          onClose={() => setOpenDialog(null)}
          role={role}
          content={summaries[role]}
          onCopy={() => copyToClipboard(role)}
          copied={copiedRole === role}
        />
      ))}
    </div>
  );
}
