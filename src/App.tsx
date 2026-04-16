/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Briefcase, 
  Sparkles, 
  ChevronRight, 
  Plus, 
  Trash2, 
  ArrowLeft,
  Loader2,
  Upload,
  FileText,
  X,
  Loader,
  Sun,
  Moon
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Candidate, HiringOutput } from "./types";
import { analyzeHiringData } from "./services/gemini";
import { HiringDashboard } from "./components/HiringDashboard";

type Step = "job" | "candidates" | "analyzing" | "results";

export default function App() {
  const [step, setStep] = useState<Step>("job");
  const [jobDescription, setJobDescription] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [results, setResults] = useState<HiringOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const addCandidate = () => {
    const newCandidate: Candidate = {
      id: crypto.randomUUID(),
      name: "",
      cv: ""
    };
    setCandidates([...candidates, newCandidate]);
  };

  const updateCandidate = (id: string, field: keyof Candidate, value: string) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeCandidate = (id: string) => {
    setCandidates(candidates.filter(c => c.id !== id));
  };

  const handleFileUpload = async (id: string, file: File) => {
    if (!file) return;

    setIsParsing(id);
    setError(null);

    try {
      let text = "";
      if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item: any) => item.str);
          fullText += strings.join(" ") + "\n";
        }
        text = fullText;
      } else if (file.type === "text/plain") {
        text = await file.text();
      } else {
        throw new Error("Unsupported file type. Please upload a PDF or TXT file.");
      }

      if (text.trim()) {
        setCandidates(prev => prev.map(c => {
          if (c.id === id) {
            const updates: Partial<Candidate> = { cv: text };
            if (!c.name) {
              updates.name = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
            }
            return { ...c, ...updates };
          }
          return c;
        }));
      } else {
        throw new Error("Could not extract text from file.");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to parse file.");
    } finally {
      setIsParsing(null);
    }
  };

  const handleAnalyze = async () => {
    if (!jobDescription || candidates.length === 0) {
      setError("Please provide a job description and at least one candidate.");
      return;
    }

    setStep("analyzing");
    setError(null);

    try {
      const output = await analyzeHiringData({
        job_description: jobDescription,
        candidates: candidates.map(({ name, cv }) => ({ name, cv }))
      });
      setResults(output);
      setStep("results");
    } catch (err) {
      console.error(err);
      setError("Failed to analyze data. Please try again.");
      setStep("candidates");
    }
  };

  const reset = () => {
    setStep("job");
    setResults(null);
  };

  return (
    <div className="min-h-screen bg-[var(--bento-bg)] text-[var(--bento-text)] font-sans selection:bg-[var(--bento-accent)]/30 transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-[var(--bento-border)] bg-[var(--bento-bg)]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="font-bold text-lg tracking-[0.2em] text-[var(--bento-accent)] uppercase">AI Hiring Engine v2.4</h1>
            <p className="text-[var(--bento-dim)] text-xs mt-1 font-medium">
              {results ? `Job ID: SR-ENG-2024 / Analysis Complete` : `Ready for assessment`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full w-10 h-10 text-[var(--bento-dim)] hover:text-[var(--bento-accent)] hover:bg-[var(--bento-accent)]/10 transition-all"
            >
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>
            {step === "results" ? (
              <span className="bg-[var(--bento-accent)]/10 border border-[var(--bento-accent)] text-[var(--bento-accent)] px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase">
                Processing Complete
              </span>
            ) : (
              <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-[var(--bento-dim)] uppercase tracking-[0.2em]">
                <span className={step === "job" ? "text-[var(--bento-accent)]" : ""}>Job</span>
                <div className="w-1 h-1 rounded-full bg-[var(--bento-border)]" />
                <span className={step === "candidates" ? "text-[var(--bento-accent)]" : ""}>Candidates</span>
                <div className="w-1 h-1 rounded-full bg-[var(--bento-border)]" />
                <span className={step === "results" ? "text-[var(--bento-accent)]" : ""}>Results</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {step === "job" && (
            <motion.div
              key="job"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 max-w-3xl mx-auto"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-bento-accent uppercase tracking-[0.2em]">Phase 01</span>
                <h2 className="text-4xl font-bold tracking-tight">Define the Role</h2>
                <p className="text-bento-dim text-lg">Paste the job description to set the baseline for candidate evaluation.</p>
              </div>

              <div className="bento-card">
                <div className="bento-card-title">Job Description</div>
                <Textarea 
                  placeholder="e.g. We are looking for a Senior Frontend Engineer with 5+ years of experience in React..."
                  className="min-h-[300px] resize-none bg-transparent border-none p-0 focus-visible:ring-0 text-lg leading-relaxed placeholder:text-bento-border"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  size="lg" 
                  className="bg-bento-accent text-bento-bg hover:bg-bento-accent/90 rounded-xl px-10 font-bold uppercase tracking-widest text-xs h-14"
                  onClick={() => setStep("candidates")}
                  disabled={!jobDescription.trim()}
                >
                  Next: Add Candidates
                  <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === "candidates" && (
            <motion.div
              key="candidates"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-bento-accent uppercase tracking-[0.2em]">Phase 02</span>
                  <h2 className="text-4xl font-bold tracking-tight">Candidate Pool</h2>
                  <p className="text-bento-dim text-lg">Add candidates and their full CV text for analysis.</p>
                </div>
                <Button variant="ghost" onClick={() => setStep("job")} className="text-bento-dim hover:text-bento-text hover:bg-bento-card">
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Back
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {candidates.map((candidate, index) => (
                  <motion.div
                    key={candidate.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bento-card"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-[10px] font-bold text-bento-border uppercase tracking-[0.2em]">Candidate #{index + 1}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-bento-border hover:text-bento-danger hover:bg-bento-danger/10 h-8 w-8 p-0"
                        onClick={() => removeCandidate(candidate.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-bento-dim uppercase tracking-widest">Full Name</label>
                        <Input 
                          placeholder="e.g. Jane Doe"
                          value={candidate.name}
                          onChange={(e) => updateCandidate(candidate.id, "name", e.target.value)}
                          className="bg-bento-bg/50 border-bento-border focus-visible:ring-bento-accent rounded-lg"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-bento-dim uppercase tracking-widest">CV / Resume</label>
                        
                        <div 
                          className={`relative border-2 border-dashed rounded-xl p-6 transition-all flex flex-col items-center justify-center gap-3 group cursor-pointer ${
                            candidate.cv 
                              ? "border-bento-success/30 bg-bento-success/5" 
                              : "border-bento-border hover:border-bento-accent hover:bg-bento-accent/5"
                          }`}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const file = e.dataTransfer.files?.[0];
                            if (file) handleFileUpload(candidate.id, file);
                          }}
                          onClick={() => fileInputRefs.current[candidate.id]?.click()}
                        >
                          <input 
                            type="file"
                            ref={el => fileInputRefs.current[candidate.id] = el}
                            className="hidden"
                            accept=".pdf,.txt"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(candidate.id, file);
                            }}
                          />

                          {isParsing === candidate.id ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader className="w-8 h-8 text-bento-accent animate-spin" />
                              <span className="text-[10px] font-bold text-bento-accent uppercase tracking-widest">Parsing File...</span>
                            </div>
                          ) : candidate.cv ? (
                            <div className="flex flex-col items-center gap-2 text-bento-success">
                              <div className="flex items-center gap-2">
                                <FileText className="w-8 h-8" />
                                <span className="text-xs font-bold uppercase tracking-widest">CV Loaded</span>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-[10px] font-bold uppercase tracking-widest text-bento-dim hover:text-bento-danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateCandidate(candidate.id, "cv", "");
                                }}
                              >
                                <X className="w-3 h-3 mr-1" />
                                Clear
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-bento-border group-hover:text-bento-accent transition-colors" />
                              <div className="text-center">
                                <p className="text-xs font-bold text-bento-text uppercase tracking-widest">Upload CV</p>
                                <p className="text-[10px] text-bento-dim mt-1 uppercase tracking-widest">PDF or TXT (Max 10MB)</p>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-bento-border" />
                          </div>
                          <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em]">
                            <span className="bg-bento-card px-2 text-bento-border font-bold">OR PASTE TEXT</span>
                          </div>
                        </div>

                        <Textarea 
                          placeholder="Paste CV text here if not uploading..."
                          className="min-h-[120px] resize-none bg-bento-bg/50 border-bento-border focus-visible:ring-bento-accent rounded-lg text-sm"
                          value={candidate.cv}
                          onChange={(e) => updateCandidate(candidate.id, "cv", e.target.value)}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}

                <Button 
                  variant="outline" 
                  className="h-full min-h-[300px] border-2 border-dashed border-bento-border hover:border-bento-accent hover:bg-bento-accent/5 text-bento-dim hover:text-bento-accent rounded-2xl transition-all"
                  onClick={addCandidate}
                >
                  <Plus className="mr-2 w-6 h-6" />
                  <span className="font-bold uppercase tracking-widest text-xs">Add Candidate</span>
                </Button>
              </div>

              {error && (
                <div className="bg-bento-danger/10 border border-bento-danger/20 text-bento-danger px-6 py-4 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="flex flex-col items-end gap-2 pt-8">
                <Button 
                  size="lg" 
                  className="bg-bento-accent text-bento-bg hover:bg-bento-accent/90 rounded-xl px-12 font-bold uppercase tracking-widest text-xs h-14"
                  onClick={handleAnalyze}
                  disabled={candidates.length === 0 || candidates.some(c => !c.name || !c.cv)}
                >
                  <Sparkles className="mr-2 w-4 h-4" />
                  Analyze Candidates
                </Button>
                {candidates.length > 0 && candidates.some(c => !c.name || !c.cv) && (
                  <p className="text-[10px] text-bento-danger font-bold uppercase tracking-widest">
                    Please fill in all candidate names and CV details
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {step === "analyzing" && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 space-y-8"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-bento-accent/20 blur-[100px] rounded-full animate-pulse" />
                <Loader2 className="w-20 h-20 text-bento-accent animate-spin relative z-10" />
              </div>
              <div className="text-center space-y-3">
                <h3 className="text-3xl font-bold tracking-tight">AI Engine Processing</h3>
                <p className="text-bento-dim max-w-md text-lg">
                  Cross-referencing neural profiles with architectural requirements.
                </p>
              </div>
            </motion.div>
          )}

          {step === "results" && results && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              <div className="flex items-end justify-between border-b border-bento-border pb-8">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-bento-accent uppercase tracking-[0.2em]">Final Phase</span>
                  <h2 className="text-5xl font-bold tracking-tight">Hiring Insights</h2>
                </div>
                <Button 
                  variant="outline" 
                  onClick={reset} 
                  className="border-bento-border text-bento-dim hover:text-bento-text hover:bg-bento-card rounded-xl px-6"
                >
                  <Plus className="mr-2 w-4 h-4" />
                  New Analysis
                </Button>
              </div>

              <HiringDashboard data={results} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-bento-border py-16 bg-bento-bg">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-6">
          <div className="flex items-center justify-center gap-3 opacity-30">
            <Sparkles className="w-5 h-5 text-bento-accent" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-bento-text">Neural Engine v2.4</span>
          </div>
          <p className="text-bento-border text-xs font-medium tracking-widest uppercase">© 2026 AI Hiring Engine. Secure Neural Assessment.</p>
        </div>
      </footer>
    </div>
  );
}
