# Smart Question Paper Generator

This project is a fully-functional, ML-powered system that generates structured question papers based on curriculum units. It consists of a Node.js + Express backend, a React + Vite frontend, and a 100% free local Python ML microservice using the `google/flan-t5-base` model.

## Features
- **Local ML Inference:** No paid APIs used (OpenAI removed). All generation runs on local hardware using HuggingFace `flan-t5-base`.
- **Syllabus Targeting:** Fetch specific units based on the selected Exam Type.
- **Difficulty Distribution:** Generates a mix of easy, medium, and hard questions matching requested percentages.
- **PDF Export:** Clean, nicely formatted printouts of the final generated paper.
- **Clean Architecture:** Fully scalable MVC node.js backend using Drizzle ORM and PostgreSQL.

## Prerequisites
- Node.js (v18 or higher)
- PostgreSQL Database
- Python 3.10+

## Setup & Run Instructions

### 1. Database Setup
Ensure PostgreSQL is running and update your `.env` connection string:
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/your_db
```
Apply migrations:
```bash
npm run db:push
```

### 2. Start the ML Service
The question generation relies on a local FastAPI server running the T5 model on CPU.
```bash
# 1. Navigate to the ML service folder
cd ml-service

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Start the FastAPI server (Runs on port 8000)
uvicorn main:app --reload --port 8000
```
*Note: The first time you start this, it will download the FLAN-T5-base model (~1GB).*

### 3. Start the Main Application
In a new terminal, from the root of the project:
```bash
# Install Node dependencies
npm install

# Start the frontend and backend development servers
npm run dev
```

The application will now be running on `http://localhost:5000`.
