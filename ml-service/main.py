from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from model import generate_paper

app = FastAPI(title="Local ML Generator")

class GenerateRequest(BaseModel):
    subject_name: str
    syllabus_text: str
    exam_type: str
    marks_distribution: Dict[str, int]
    difficulty_distribution: Dict[str, int]
    total_marks: int
    duration: str

@app.post("/generate")
def generate(req: GenerateRequest):
    try:
        result = generate_paper(
            subject_name=req.subject_name,
            syllabus_text=req.syllabus_text,
            exam_type=req.exam_type,
            marks_dist=req.marks_distribution,
            diff_dist=req.difficulty_distribution,
            total_marks=req.total_marks,
            duration=req.duration
        )
        return {"generated_text": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
