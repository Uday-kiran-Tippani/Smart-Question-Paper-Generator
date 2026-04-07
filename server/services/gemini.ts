import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export type QuestionType = 'Short' | 'Long' | 'MCQ' | 'Analytical';

export async function generateQuestionsFromGemini(
  subjectName: string,
  unitTitle: string,
  syllabusContent: string,
  questionType: QuestionType,
  count: number
): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Ensure strict instructions for Bloom's Taxonomy matching the question type
    let verbs = "";
    if (questionType === "Long") {
      verbs = "Explain in detail, Discuss, Describe, Illustrate, Evaluate";
    } else if (questionType === "Analytical") {
      verbs = "Analyze, Compare and contrast, Differentiate, Examine, Solve";
    } else {
      // Short or MCQ
      verbs = "Define, List, Mention, What is, State";
    }

    let extraInstructions = "";
    if (questionType === "MCQ") {
      extraInstructions = "Ensure you provide 4 options (A, B, C, D) and clearly state the correct answer.";
    }

    const prompt = `
You are an expert university professor creating high-quality examination questions.
Generate EXACTLY ${count} ${questionType} question(s) for the subject "${subjectName}", specifically from the following unit syllabus:
Unit: "${unitTitle}"
Syllabus:
"""
${syllabusContent}
"""

CRITICAL LENGTH RULES:
- If this is a "Short" question: Maximum 10 words. Must be exactly 1 short sentence.
- If this is a "Long" question: Maximum 20 words. Must be exactly 1 short sentence. DO NOT write paragraphs. DO NOT write multiple sentences.

CRITICAL INSTRUCTIONS:
1. Generate meaningful, concept-based questions that test understanding and application, following Bloom's Taxonomy.
2. Use academic verbs such as: ${verbs}.
3. DO NOT generate generic questions like "Explain the topic" or "What is [SubjectName]?". Focus on specific sub-topics in the syllabus.
4. Make the questions clear, specific, and university-level.
5. For "Long" questions, explicitly include a mark split at the end of the question text if it has subparts (e.g., Explain X and Y [8+7]).
${extraInstructions}

OUTPUT FORMAT:
Return ONLY a valid JSON array of strings. Do not use markdown code blocks or any other formatting around it.
Example:
["Question 1 text...", "Question 2 text..."]
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up potential markdown formatting from Gemini
    if (text.startsWith("```json")) {
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    } else if (text.startsWith("```")) {
      text = text.replace(/```/g, "").trim();
    }

    try {
      const parsedItems = JSON.parse(text);
      if (Array.isArray(parsedItems)) {
        return parsedItems;
      }
    } catch (e) {
      console.error("Failed to parse Gemini JSON output. Raw output:", text);
    }
    
    // Fallback if parsing fails or an array isn't returned natively
    return text.split('\n').filter(l => l.trim() && !l.startsWith('[') && !l.startsWith(']'));

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate questions using Gemini API.");
  }
}
