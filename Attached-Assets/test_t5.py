from transformers import T5Tokenizer, T5ForConditionalGeneration
import torch

MODEL_NAME = "google/flan-t5-base"
device = torch.device("cpu")

tokenizer = T5Tokenizer.from_pretrained(MODEL_NAME)
model = T5ForConditionalGeneration.from_pretrained(MODEL_NAME).to(device)

def test_prompt(prompt):
    inputs = tokenizer(prompt, return_tensors="pt").to(device)
    outputs = model.generate(
        **inputs,
        max_length=512,
        temperature=0.7,
        num_beams=4,
        early_stopping=True,
        no_repeat_ngram_size=3,
        length_penalty=1.5
    )
    print("PROMPT:")
    print(prompt)
    print("----")
    print("OUTPUT:")
    print(tokenizer.decode(outputs[0], skip_special_tokens=True))
    print("="*40)

test_prompt("Write 5 examination questions about Computer Networks, specifically OSI Model and TCP/IP.")
test_prompt("Generate an exam paper with SECTION A and SECTION B about Computer Networks.")
