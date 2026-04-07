from transformers import T5Tokenizer, T5ForConditionalGeneration
import torch

# Load model globally to avoid loading on every request
MODEL_NAME = "google/flan-t5-base"
device = torch.device("cpu") # Force CPU as requested

print(f"Loading model {MODEL_NAME}...")
tokenizer = T5Tokenizer.from_pretrained(MODEL_NAME)
model = T5ForConditionalGeneration.from_pretrained(MODEL_NAME).to(device)
print("Model loaded successfully.")

def map_difficulty(diff_dist: dict) -> str:
    """Maps difficulty percentages to specific instructional guidance for the AI."""
    easy = diff_dist.get("Easy", 0)
    medium = diff_dist.get("Medium", 0)
    hard = diff_dist.get("Hard", 0)
    
    instructions = []
    if easy > 40:
        instructions.append("Majority of questions should be concept-based, requiring definitions, lists, or simple explanations (Easy level).")
    if medium > 30:
        instructions.append("Include analytical questions requiring comparisons, detailed descriptions, and process analysis (Medium level).")
    if hard > 10:
        instructions.append("Include complex higher-order thinking questions requiring critical evaluation, architectural design, or proofs (Hard level).")
    
    return " ".join(instructions)

import random

def is_valid_question(q_text: str) -> bool:
    """Validates if a generated question meets the strict criteria."""
    q_lower = q_text.lower()
    
    if len(q_text.split()) < 8:
        return False
        
    if "which of the following" in q_lower:
        return False
        
    option_phrases = [" a)", " b)", " i)", " ii)", "1.", "2."]
    for phrase in option_phrases:
        if phrase in q_lower:
            return False
            
    if not q_text.endswith("?"):
        if not q_text.endswith("."):
            return False
            
    return True

def generate_single_question(topic_text: str, question_type: str, marks: int) -> str:
    """Uses the model to generate a single question based on syllabus text with strict validation."""
    
    if question_type == "long":
        verbs = ["Explain", "Discuss", "Analyze", "Describe in detail", "Compare and contrast", "Illustrate with examples"]
    else:
        verbs = ["Define", "List", "Write a short note on", "What is", "Mention"]
        
    verb = random.choice(verbs)
    
    prompt = (
        f"You are a university professor creating examination questions.\n"
        f"Generate ONE descriptive exam question based strictly on the given syllabus.\n"
        f"Rules:\n"
        f"- Use the syllabus content only\n"
        f"- Do NOT generate multiple choice questions\n"
        f"- Do NOT ask 'Which of the following'\n"
        f"- Use academic verb: {verb}\n"
        f"Output only the question text.\n"
        f"Syllabus:\n{topic_text[:500]}\n"
    )
    
    inputs = tokenizer(prompt, return_tensors="pt", max_length=1024, truncation=True).to(device)
    
    max_attempts = 3
    for attempt in range(max_attempts):
        outputs = model.generate(
            **inputs,
            max_length=64,
            temperature=0.8 + (attempt * 0.1), # slightly more creative if it keeps failing
            num_beams=4,
            early_stopping=True,
            no_repeat_ngram_size=2
        )
        
        q_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        q_text = q_text.replace("Question:", "").strip()
        
        if q_text and q_text[-1] not in ['.', '?']:
            if any(q_text.lower().startswith(word) for word in ["explain", "discuss", "describe", "define", "list"]):
                q_text += "."
            else:
                q_text += "?"
                
        if q_text:
            q_text = q_text[0].upper() + q_text[1:]
            
        if is_valid_question(q_text):
            return q_text
            
    fallback_topic = " ".join(topic_text.split()[:5]).replace('\n', ' ')
    if question_type == "long":
        return f"{random.choice(['Explain', 'Discuss in detail'])} the core concepts related to '{fallback_topic}'."
    else:
        return f"{random.choice(['Define', 'Write a short note on'])} '{fallback_topic}'."

def extract_units(syllabus_text: str) -> dict:
    """Parses the syllabus text containing [UNIT X: Title] markers into a dictionary."""
    units = {}
    current_unit = "General"
    current_text = []
    
    for line in syllabus_text.split('\n'):
        if line.startswith("[UNIT"):
            if current_text:
                units[current_unit] = "\n".join(current_text)
            current_unit = line.strip()
            current_text = []
        else:
            current_text.append(line)
            
    if current_text:
        units[current_unit] = "\n".join(current_text)
        
    return units

def generate_paper(subject_name: str, syllabus_text: str, exam_type: str, marks_dist: dict, diff_dist: dict, total_marks: int, duration: str) -> str:
    """
    Generates a professional question paper. Uses a STRICT algorithm for SEMESTER exams,
    or a dynamic approach for other types.
    """
    header = f"UNIVERSITY EXAMINATION\nSubject: {subject_name}\nMax Marks: {total_marks} | Duration: {duration} Min\n{'-'*40}\n\n"
    paper_content = header
    
    units_dict = extract_units(syllabus_text)
    all_units_text = "\n".join(units_dict.values())
    
    if exam_type == "SEMESTER":
        # SEMESTER EXACT PATTERN
        # SECTION A: 4 questions (Internal Choice a/b) x 15 Marks = 60 Marks
        paper_content += "SECTION - A (4x15 = 60 Marks)\nAnswer ALL Questions\n\n"
        
        # We need exactly 4 units for this pattern. If less, we reuse. If more, we just take first 4.
        unit_keys = list(units_dict.keys())
        if not unit_keys:
            unit_keys = ["General"]
            units_dict["General"] = syllabus_text
            
        for i in range(1, 5):
            # Pick the corresponding unit (1 to 4) if available, else wrap around
            unit_key = unit_keys[(i-1) % len(unit_keys)]
            unit_text = units_dict[unit_key]
            
            q_a = generate_single_question(unit_text, "long", 15)
            q_b = generate_single_question(unit_text, "long", 15)
            
            paper_content += f"{i}. a) {q_a} (15 Marks)\n"
            paper_content += f"   (OR)\n"
            paper_content += f"   b) {q_b} (15 Marks)\n\n"
            
        # SECTION B: 8 short questions, answer any 5 (5x3 = 15 Marks)
        paper_content += "SECTION - B (5x3 = 15 Marks)\nAnswer any FIVE Questions\n\n"
        
        for i in range(5, 13):
            # Short questions drawn from entire syllabus
            q = generate_single_question(all_units_text, "short", 3)
            paper_content += f"{i}. {q} (3 Marks)\n"
            
        return paper_content

    # ==== DYNAMIC PATTERN (MID EXAMS OR OTHERS) ====
    import re
    parsed_marks = []
    for mark_str, count in marks_dist.items():
        mark_val = int(re.sub(r'[^0-9]', '', str(mark_str)))
        for _ in range(count):
            parsed_marks.append(mark_val)
            
    parsed_marks.sort()
    
    section_num = ord('A')
    q_index = 1
    unique_marks = sorted(list(set(parsed_marks)))
    
    for mark_val in unique_marks:
        count = parsed_marks.count(mark_val)
        paper_content += f"SECTION - {chr(section_num)}\nAnswer ALL questions.\n\n"
        
        for _ in range(count):
            difficulty = "Medium"
            question_type = "short"
            if mark_val >= 10:
                difficulty = "Hard"
                question_type = "long"
            elif mark_val <= 3:
                difficulty = "Easy"
                
            q1 = generate_single_question(all_units_text, question_type, mark_val)
            
            if mark_val >= 5:
                q2 = generate_single_question(all_units_text, question_type, mark_val)
                paper_content += f"{q_index}. a) {q1} ({mark_val} Marks)\n"
                paper_content += f"   (OR)\n"
                paper_content += f"   b) {q2} ({mark_val} Marks)\n\n"
            else:
                paper_content += f"{q_index}. {q1} ({mark_val} Marks)\n\n"
            
            q_index += 1
            
        section_num += 1
        
    return paper_content
