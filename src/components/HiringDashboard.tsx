/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Trophy, 
  MessageSquare, 
  ClipboardCheck, 
  Mail,
  TrendingUp,
  ShieldAlert,
  Lightbulb,
  UserCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { HiringOutput, CandidateAnalysis } from "../types";
import { motion } from "motion/react";

interface Props {
  data: HiringOutput;
}

export function HiringDashboard({ data }: Props) {
  return (
    <div className="space-y-12 pb-32">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.dashboard.map((stat, i) => (
          <div key={i} className="bento-card">
            <div className="bento-card-title">{stat.label}</div>
            <div className="text-3xl font-bold tracking-tight text-bento-accent">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Strategic Insight & Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bento-card">
          <div className="bento-card-title">Strategic Insight</div>
          <p className="text-lg text-bento-text leading-relaxed opacity-90">{data.final_insight}</p>
          <div className="mt-8 pt-8 border-t border-bento-border">
            <div className="bento-card-title">Job Validation</div>
            <p className="text-sm text-bento-dim italic leading-relaxed">"{data.job_validation}"</p>
          </div>
        </div>

        <div className="bento-card">
          <div className="bento-card-title">Top Ranking</div>
          <div className="space-y-4">
            {data.ranking.map((name, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-bento-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-bento-border font-bold text-xs">0{i + 1}</span>
                  <span className="font-medium text-bento-text">{name}</span>
                </div>
                {data.shortlist.includes(name) && (
                  <div className="w-1.5 h-1.5 rounded-full bg-bento-success shadow-[0_0_8px_var(--bento-success)]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Candidate Detailed Analysis */}
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="h-px flex-grow bg-bento-border" />
          <h3 className="text-[10px] font-bold text-bento-border uppercase tracking-[0.4em] whitespace-nowrap">Candidate Deep Dive</h3>
          <div className="h-px flex-grow bg-bento-border" />
        </div>
        <div className="space-y-16">
          {data.candidates.map((candidate, i) => (
            <CandidateAnalysisSection key={i} candidate={candidate} data={data} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CandidateAnalysisSection({ candidate, data }: { candidate: CandidateAnalysis; data: HiringOutput; key?: React.Key }) {
  const decisionColors = {
    "Strong Fit": "text-bento-success",
    "Potential Fit": "text-bento-warning",
    "Not a Fit": "text-bento-danger"
  };

  const riskColors = {
    "Low": "bg-bento-success/10 text-bento-success border-bento-success/20",
    "Medium": "bg-bento-warning/10 text-bento-warning border-bento-warning/20",
    "High": "bg-bento-danger/10 text-bento-danger border-bento-danger/20"
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h4 className="text-2xl font-bold tracking-tight text-bento-text">{candidate.name}</h4>
        <div className="flex items-center gap-4">
          <span className={`text-xs font-bold uppercase tracking-widest ${decisionColors[candidate.decision]}`}>
            {candidate.decision}
          </span>
          <div className={`px-3 py-1 rounded-full text-[10px] font-bold border ${riskColors[candidate.risk.level]}`}>
            {candidate.risk.level} RISK
          </div>
        </div>
      </div>

      <div className="bento-grid">
        {/* Profile Card */}
        <div className="bento-card md:col-span-2 md:row-span-2">
          <div className="bento-card-title">Assessment Reason</div>
          <p className="text-lg leading-relaxed opacity-90 mb-8 text-bento-text">{candidate.summary}</p>
          <div className="mt-auto space-y-6">
            <div>
              <div className="bento-card-title">Score Breakdown</div>
              <p className="text-sm text-bento-dim leading-relaxed">{candidate.score_justification}</p>
            </div>
            <div>
              <div className="bento-card-title">AI Recommendation</div>
              <p className="text-sm text-bento-dim leading-relaxed">{candidate.recommendation}</p>
            </div>
          </div>
        </div>

        {/* Score Card */}
        <div className="bento-card md:col-span-1">
          <div className="bento-card-title">Match Score</div>
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-6xl font-bold text-bento-success">{candidate.score}</span>
            <span className="text-bento-border font-bold text-sm">/ 10</span>
          </div>
          <p className="text-[10px] text-bento-dim mt-4 leading-relaxed uppercase tracking-wider">
            Strict 10-point assessment scale
          </p>
        </div>

        {/* Risk Card */}
        <div className="bento-card md:col-span-1">
          <div className="bento-card-title">Risk Assessment</div>
          <div className="text-2xl font-bold mb-2 text-bento-text">{candidate.risk.level}</div>
          <div className="flex items-center gap-2 mt-auto">
            <div className={`w-2 h-2 rounded-full ${candidate.risk.level === 'Low' ? 'bg-bento-success shadow-[0_0_8px_var(--bento-success)]' : candidate.risk.level === 'Medium' ? 'bg-bento-warning' : 'bg-bento-danger'}`} />
            <span className="text-xs text-bento-dim leading-tight">{candidate.risk.reason}</span>
          </div>
        </div>

        {/* Strengths Card */}
        <div className="bento-card md:col-span-2">
          <div className="bento-card-title">Top Strengths</div>
          <div className="flex flex-wrap gap-2">
            {candidate.strengths.map((s, i) => (
              <span key={i} className="bento-badge bento-badge-success">{s}</span>
            ))}
          </div>
        </div>

        {/* Weaknesses Card */}
        <div className="bento-card md:col-span-2">
          <div className="bento-card-title">Critical Weaknesses</div>
          <div className="flex flex-wrap gap-2">
            {candidate.weaknesses.map((w, i) => (
              <span key={i} className="bento-badge bento-badge-danger">{w}</span>
            ))}
          </div>
        </div>

        {/* Interview Card */}
        <div className="bento-card md:col-span-2">
          <div className="bento-card-title">Tailored Interview Questions</div>
          <div className="space-y-4">
            {data.interview_questions[candidate.name]?.slice(0, 2).map((q, i) => (
              <div key={i} className="text-sm text-bento-text opacity-80 leading-relaxed flex gap-3">
                <span className="text-bento-accent font-bold">Q{i + 1}</span>
                {q}
              </div>
            ))}
          </div>
        </div>

        {/* Insight Card */}
        <div className="bento-card md:col-span-2">
          <div className="bento-card-title">Final AI Insight</div>
          <p className="bento-insight-box">
            {data.tasks[candidate.name] || "Assessment recommended to verify deep technical claims."}
          </p>
        </div>
      </div>
    </div>
  );
}
