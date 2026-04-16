/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { HiringInput, HiringOutput } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeHiringData(input: HiringInput): Promise<HiringOutput> {
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `You are a strict AI Hiring Filter System. Your priority is to ELIMINATE unqualified candidates before scoring.

--------------------------------------------------
STEP 0: HARD REJECTION RULES (CRITICAL)
If ANY of the following are NOT met, the candidate is automatically "Not a Fit" with score 0:
- Missing core required skill(s) from Job Description.
- Experience is less than required minimum years.
- No relevant field alignment.
DO NOT proceed to scoring if rejected here.

--------------------------------------------------
STEP 1: JOB MATCH CHECK
Check:
- Must-have skills (strict).
- Experience level match.
- Domain relevance.
If mismatch -> STOP -> Decision: "Not a Fit", Score: 0.

--------------------------------------------------
STEP 2: SCORING (ONLY if passed Step 1)
Score out of 10 based on:
- Skills match (40%)
- Experience (30%)
- Tools (20%)
- Education (10%)

--------------------------------------------------
STEP 3: OUTPUT RULES
- Be strict: Do NOT inflate scores.
- Do NOT assume skills not written in the CV.
- If CV is weak, say it clearly in the summary and justification.
- If candidate is weak, you MUST NOT label as "Potential Fit".
- Decision must be one of: "Strong Fit", "Potential Fit", "Not a Fit".
- Risk level must be one of: "Low", "Medium", "High".

--------------------------------------------------
MAPPING TO JSON FIELDS:
- summary: Short strict justification (Reason).
- score: X/10 (0 if rejected).
- score_justification: Detailed breakdown of the score.
- strengths: Only if valid.
- weaknesses: MUST include missing must-have skills if any.

--------------------------------------------------
JSON OUTPUT STRUCTURE:
- job_validation: Brief validation of the job requirements.
- candidates: Array of analysis objects.
- ranking: Names sorted by score.
- shortlist: Names of "Strong Fit" candidates.
- dashboard: Summary stats for the UI (e.g., Total Candidates, Strong Fits, Avg Score).
- final_insight: Overall hiring recommendation.
- interview_questions: Map of candidate name to array of questions.
- tasks: Map of candidate name to evaluation task.
- messages: Map of candidate name to outreach message.`;

  const prompt = JSON.stringify(input);

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          job_validation: { type: Type.STRING },
          candidates: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                summary: { type: Type.STRING },
                score: { type: Type.NUMBER },
                score_justification: { type: Type.STRING },
                decision: { type: Type.STRING },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                risk: {
                  type: Type.OBJECT,
                  properties: {
                    level: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  },
                  required: ["level", "reason"]
                },
                recommendation: { type: Type.STRING }
              },
              required: ["name", "summary", "score", "score_justification", "decision", "strengths", "weaknesses", "risk", "recommendation"]
            }
          },
          ranking: { type: Type.ARRAY, items: { type: Type.STRING } },
          shortlist: { type: Type.ARRAY, items: { type: Type.STRING } },
          dashboard: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                value: { type: Type.STRING }
              }
            }
          },
          final_insight: { type: Type.STRING },
          interview_questions: { type: Type.OBJECT, additionalProperties: { type: Type.ARRAY, items: { type: Type.STRING } } },
          tasks: { type: Type.OBJECT, additionalProperties: { type: Type.STRING } },
          messages: { type: Type.OBJECT, additionalProperties: { type: Type.STRING } }
        },
        required: ["job_validation", "candidates", "ranking", "shortlist", "dashboard", "final_insight", "interview_questions", "tasks", "messages"]
      }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response from AI");
  }

  return JSON.parse(text) as HiringOutput;
}
