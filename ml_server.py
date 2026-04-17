from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import uvicorn
import torch

import os

app = FastAPI(title="Local ML Question Generator")

# Load the local model directly from the downloaded folder or fallback from HF if deployed
MODEL_DIR = "./my_custom_qg_model"
FALLBACK_MODEL = "t5-small"

try:
    if os.path.exists(MODEL_DIR):
        print(f"Loading Custom Deep Learning Model from {MODEL_DIR}...")
        tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
        model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_DIR)
    else:
        print(f"Local model not found. Downloading fallback {FALLBACK_MODEL} from HuggingFace...")
        tokenizer = AutoTokenizer.from_pretrained(FALLBACK_MODEL)
        model = AutoModelForSeq2SeqLM.from_pretrained(FALLBACK_MODEL)
    
    # Use GPU if available to speed up, otherwise use CPU
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model.to(device)
    print(f"Model loaded successfully on {device.upper()}!")
except Exception as e:
    print(f"Error loading model! Error: {e}")

class GenerateRequest(BaseModel):
    syllabus_content: str
    count: int = 1
    question_type: str = "Short"

@app.post("/generate-questions")
async def generate_questions(req: GenerateRequest):
    # Split the long syllabus into sentences so the model can generate a unique question for different parts
    sentences = req.syllabus_content.split('.')
    # Filter out empty or very short strings
    sentences = [s.strip() for s in sentences if len(s.strip()) > 15]
    
    # If the syllabus is too short, provide a fallback
    if len(sentences) == 0:
        sentences = [req.syllabus_content]
        
    generated_questions = []
    
    for i in range(req.count):
        # Pick sentences in order, wrapping around if we need more questions than sentences
        context = sentences[i % len(sentences)]
        
        # Format the input exactly as the T5-Small-SQuAD model trained it
        input_text = f"generate question: {context}"
        
        inputs = tokenizer(input_text, return_tensors="pt", max_length=512, truncation=True)
        inputs = inputs.to(device)
        
        # Generate the question text!
        outputs = model.generate(
            **inputs, 
            max_length=64, 
            num_beams=4,
            do_sample=True,
            temperature=0.7 # Add tiny randomness so questions aren't repetitive
        )
        
        question = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Clean up output artifacts (sometimes it outputs 'question: What...')
        if question.lower().startswith("question:"):
            question = question[9:].strip()
            
        # Capitalize first letter
        if len(question) > 0:
            question = question[0].upper() + question[1:]

        # Since T5-small natively generates factual "short" questions from SQuAD,
        # we programmatically expand it for "Long/Analytical" question requirements.
        if req.question_type == "Long" or req.question_type == "Analytical":
            if "what is" in question.lower() or "who" in question.lower():
                # Convert a short question to a long analytical format
                question = f"Discuss and evaluate the following: {question}"

        generated_questions.append(question)
        
    return {"questions": generated_questions}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
