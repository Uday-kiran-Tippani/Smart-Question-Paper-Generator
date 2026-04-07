# Project ML Methodology and Architecture

## 1. Introduction
This project is an **AI-Powered University Examination Question Paper Generator**. It is built to automate the creation of academic-standard model question papers based on provided syllabuses, adhering to specific formatting, length, and marking rules required by universities.

## 2. Machine Learning Algorithm Used
The project does **not** use a traditional Machine Learning algorithm trained from scratch (like a Random Forest, SVM, or traditional CNN). Instead, it relies on a foundation **Large Language Model (LLM)**—specifically **Google's Gemini 2.5 Flash** model—accessed via the `@google/generative-ai` API.

The intelligent "algorithm" used here is a combination of **Prompt Engineering**, **Context Injection**, and **Retrieval-Augmented Generation (RAG)** principles.

## 3. Detailed ML Methodology
The core logic for generating questions resides in `server/services/gemini.ts` and `server/services/questionGenerator.ts`. 

### A. Context Injection & Prompt Engineering
When a request to generate a paper is initiated, the system creates a prompt for the Gemini AI model by injecting specific context to ensure high relevance and academic standard:
- **Syllabus Constraints:** It passes the specific `subjectName`, `unitTitle`, and `syllabusContent`.
- **Bloom's Taxonomy Constraints:** It maps question types to specific academic verbs:
  - *Long Questions:* "Explain in detail, Discuss, Describe, Illustrate, Evaluate"
  - *Analytical Questions:* "Analyze, Compare and contrast, Differentiate, Examine, Solve"
  - *Short/MCQ:* "Define, List, Mention, What is, State"
- **Structural Constraints:** Strict rules are explicitly provided limiting sentence count and word length (e.g., "Maximum 10 words. Must be exactly 1 short sentence" for Short questions, "DO NOT write paragraphs" for Long questions).
- **JSON Output Formatting:** Gemini is forced to return the output purely as a JSON array of strings to allow programmatic integration directly into the backend.

### B. Hybrid Generation System (Caching/DB-First Approach)
To ensure variety, speed, and avoid unnecessary API calls, the system uses a hybrid question retrieval mechanism:
1. **Database Check:** For each required unit and question format, it first queries the local `QuestionBank` database.
2. **Dynamic Generation:** If the system is lacking questions relative to the paper format requirements (a deficit), it calls the Gemini API to dynamically generate exact quantities of missing questions.
3. **Continuous Learning (Caching):** The newly generated questions from Gemini are asynchronously saved back to the database. This implies the system's "question bank" grows specifically smarter and richer for that syllabus with every question paper generated.
4. **Shuffling:** The intelligently selected blend of Database and AI questions are randomized to ensure unique exam papers each time they are generated.

### C. Paper Assembly Format
The final questions are strictly organized to match the required university layout algorithmically:
- **Section A:** 4 Long Answer questions with an internal "OR" choice (15 marks each). Expected length ensures deep answers.
- **Section B:** 8 Short Answer questions, from which students answer 5 (3 marks each). Expected length ensures brief, direct definitions/statements.
The code dynamically pads or compensates if the question bank/AI happens to return fewer questions than the minimum requirement.

## 4. Complete Project Architecture & Stack (How it was Built)

### Technology Stack
- **Backend:** Node.js, Express.js
- **Frontend:** React.js, Vite
- **Database:** PostgreSQL with Drizzle ORM
- **Styling/UI Components:** Tailwind CSS, Radix UI (Shadcn UI style)
- **AI Integration:** Google Generative AI (`gemini-2.5-flash`)

### Plan and Workflow of the Application
1. **User Setup:** The user inputs the subject details, specific units, and uploads/pastes the syllabus content into the platform.
2. **Generation Trigger:** The system requests a paper generation for a specific Midterm pattern (e.g., "MID-1&2" restricts generation to Units 1 & 2).
3. **Data Fetching:** The Node.js Backend pulls the required unit syllabi from the PostgreSQL DB.
4. **Question Assembly (The Artificial Intelligence Module):** 
   - Uses the Hybrid AI Generator to check the DB for existing questions.
   - Triggers the Gemini API for any missing questions using highly restricted prompts.
5. **Formatting:** Assembles the raw array of questions into a continuous string format that resembles a physical university paper printout.
6. **Delivery:** The formatted `paperText` and `parsedQuestions` are sent back to the React JS UI (e.g., `paper-detail.tsx`), allowing the user to view, edit, and potentially export the examination paper seamlessly.
