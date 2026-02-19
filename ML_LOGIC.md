# ML Logic: Smart Question Paper Generator

This project implements a **Weighted Selection Algorithm** to simulate intelligent "Machine Learning" behavior for question paper generation.

## 🧠 Core Algorithm: Usage-Aware Weighted Selection

The selection process uses a "Feedback Loop" approach to minimize repetition and balance difficulty.

### 1. Feature Extraction (Selection Pool)
When a request comes in (e.g., Mathematics, 50 Marks, 30% Easy, 40% Medium, 30% Hard), the engine first filters the entire database to create three distinct "Selection Pools" based on the requested **Subject** and **Difficulty**.

### 2. Weighted Selection Strategy
Instead of simple random selection, the algorithm calculates weights for each question:
- **Usage Penalty**: The `times_used` attribute acts as a negative weight. Questions with `times_used = 0` have the highest priority.
- **Recency Bias**: The `last_used` timestamp is analyzed. Questions used recently in any paper are deprioritized.
- **Random Variance**: A small random factor is added to ensure that two papers generated with the same parameters aren't identical if multiple questions have the same usage count.

### 3. Training & Feedback Loop (The "Learning" Aspect)
While this doesn't use a deep neural network (which would be overkill for a static question bank), it implements **Reinforcement Learning principles**:
- **Action**: The engine selects a set of questions.
- **State Update**: Upon paper generation, the system "trains" itself by incrementing `times_used` and updating `last_used` for the selected questions.
- **Future Policy**: The next selection cycle automatically has a different "policy" because the weights have shifted.

### 4. Constraints & Optimization
- **Marks Matching**: The selection loop ensures the sum of marks exactly matches the target marks for that difficulty bucket.
- **Topic Coverage**: The algorithm tries to pick questions from different `topic` values within the same subject to ensure syllabus breadth.

## 🛠 Tech Stack
- **Backend**: Node.js/TypeScript (Server Logic)
- **Database**: PostgreSQL (State Management)
- **Engine**: Custom Weighted Heuristic Engine (simulating scikit-learn selection behavior)
