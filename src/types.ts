/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Candidate {
  id: string;
  name: string;
  cv: string;
}

export interface HiringInput {
  job_description: string;
  candidates: {
    name: string;
    cv: string;
  }[];
}

export interface CandidateAnalysis {
  name: string;
  summary: string;
  score: number;
  score_justification: string;
  decision: "Strong Fit" | "Potential Fit" | "Not a Fit";
  strengths: string[];
  weaknesses: string[];
  risk: {
    level: "Low" | "Medium" | "High";
    reason: string;
  };
  recommendation: string;
}

export interface HiringOutput {
  job_validation: string;
  candidates: CandidateAnalysis[];
  ranking: string[];
  shortlist: string[];
  dashboard: {
    label: string;
    value: string | number;
  }[];
  final_insight: string;
  interview_questions: Record<string, string[]>;
  tasks: Record<string, string>;
  messages: Record<string, string>;
}
