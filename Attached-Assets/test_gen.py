import requests
import json

url = "http://127.0.0.1:8000/generate"
payload = {
    "subject_name": "Computer Networks",
    "syllabus_text": "OSI Model, TCP/IP, Routing Algorithms, IP Addressing",
    "exam_type": "MID-1&2",
    "marks_distribution": {"5 Marks": 4, "10 Marks": 3},
    "difficulty_distribution": {"Easy": 30, "Medium": 50, "Hard": 20},
    "total_marks": 50,
    "duration": "120"
}

try:
    response = requests.post(url, json=payload, timeout=60)
    print("STATUS:", response.status_code)
    print("RESPONSE:", json.dumps(response.json(), indent=2))
except Exception as e:
    print("ERROR:", str(e))
