from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import shutil
import os
from pathlib import Path
from pypdf import PdfReader
from docx import Document
import pytesseract
from PIL import Image
import io
import re
import json

app = FastAPI()

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Helper: Text Extraction
def extract_text_from_pdf(file_path):
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""

def extract_text_from_docx(file_path):
    try:
        doc = Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])
    except Exception as e:
        print(f"Error reading DOCX: {e}")
        return ""

def extract_text_from_image(file_path):
    try:
        # Check if tesseract is installed
        # In a real scenario, we might need to specify the path
        # pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        image = Image.open(file_path)
        return pytesseract.image_to_string(image)
    except Exception as e:
        print(f"Error reading Image: {e}")
        return "(OCR Failed: Tesseract not found or image error)"

# Helper: Resume Parsing (Simple Heuristics)
def parse_resume_text(text):
    data = {
        "name": "",
        "email": "",
        "phone": "",
        "skills": [],
        "education": [],
        "experience": []
    }
    
    # Email
    email_match = re.search(r'[\w\.-]+@[\w\.-]+', text)
    if email_match:
        data["email"] = email_match.group(0)
        
    # Phone
    phone_match = re.search(r'(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}', text)
    if phone_match:
        data["phone"] = phone_match.group(0)
        
    # Name (Heuristic: First lines, look for Capitalized words)
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    if lines:
        data["name"] = lines[0] # Very naive, but works for many header formats

    # Skills (Keyword matching)
    common_skills = ["Python", "Java", "C++", "React", "JavaScript", "SQL", "AWS", "Docker", "Machine Learning", "Communication", "Teamwork"]
    found_skills = set()
    for skill in common_skills:
        if re.search(r'\b' + re.escape(skill) + r'\b', text, re.IGNORECASE):
            found_skills.add(skill)
    data["skills"] = list(found_skills)

    return data

@app.post("/extract")
async def extract_resume(file: UploadFile = File(...)):
    file_location = UPLOAD_DIR / file.filename
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    text = ""
    filename = file.filename.lower()
    
    if filename.endswith('.pdf'):
        text = extract_text_from_pdf(file_location)
    elif filename.endswith('.docx'):
        text = extract_text_from_docx(file_location)
    elif filename.endswith(('.png', '.jpg', '.jpeg')):
        text = extract_text_from_image(file_location)
    else:
        # Fallback for txt
        try:
            with open(file_location, 'r', encoding='utf-8') as f:
                text = f.read()
        except:
            text = ""

    parsed_data = parse_resume_text(text)
    
    # Clean up
    try:
        os.remove(file_location)
    except:
        pass
        
    return parsed_data

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
