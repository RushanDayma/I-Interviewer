import uvicorn
import os
import io
import json
import tempfile
from fastapi import FastAPI,HTTPException,UploadFile,File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Optional
import ollama
import whisper
from pydub import AudioSegment

load_dotenv()

AI_SERVICE_PORT = int(os.getenv('AI_SERVICE_PORT', 8000))

OLLAMA_MODEL_NAME=os.getenv('OLLAMA_MODEL_NAME', "mistral")

app=FastAPI(title="I Interviewer Microservice",version="1.0")
origin=["*"] #allows all the origins but in production this should be restricted so just add the allowed origins i.e. backend url

app.add_middleware(
  CORSMiddleware,
  allow_origins=origin,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)


WISHPER_MODEL = None
try:
  print("Loading Whisper Model")
  WISHPER_MODEL = whisper.load_model("base.en")
  print("Whisper Model loaded Successfully")
except Exception as e:
  print("Error while loading Whisper Model")
  print(e)

class QuestionRequest(BaseModel):
  role: str="Software development Engineer"
  level: str="Junior"
  count: int=5
  interviewType: str="coding+oral"


class QuestionResponse(BaseModel):
  questions: list[dict]
  model_used: str

class EvaluationRequest(BaseModel):
  question:str
  question_type:str
  role:str
  level:str
  user_answer:Optional[str]=None
  user_code:Optional[str]=None

class EvaluationResponse(BaseModel):
  technicalScore:int
  confidenceScore:int
  aiFeedback:str
  idealAnswer:str

#checking if whisper model is loaded
@app.get("/")
async def root():
  return {"message": "Hello From I-Interviewer Microservice !!", "model":OLLAMA_MODEL_NAME}

@app.post("/generate-questions",response_model=QuestionResponse)
async def generate_questions(request: QuestionRequest):
  try:
    if request.interviewType=="coding+oral":
      coding_count=int(request.count*0.2)
      oral_count=int(request.count)-int(coding_count)

      instruction=(
        f"The first {coding_count} questions MUST be a general coding questions requiring function implementation with no specific coding language mentioned."
        f"The remaining {oral_count} questions MUST be conceptual oral questions asked in an actual interview."
      )
    else:
      instruction="All questions MUST be conceptual oral questions asked in an actual interview. Do not generate any coding or implementation questions."

    system_prompt=(
      "You are a professional technical interviewer."
      "Task: Generate interview questions. No conversationnal text or numbering."
      f"Crucial: {instruction}"
      "Output exactly one question per line."
      f"Role: {request.role}"
      f"Level: {request.level}"
    )
    
    user_prompt=(
      f"Generate exactly {request.count} unique interview questions for a {request.role} with a {request.level} level {request.role}."
    )

    response=ollama.generate(
      model=OLLAMA_MODEL_NAME,
      prompt=user_prompt,
      system=system_prompt,
      options={"temperature": 0.5, "num_predict": 1000},
    )
    raw_text=response['response'].strip()
    questions=[q.strip() for q in raw_text.split("\n") if q.strip()]
    
    # Format questions with index for frontend consumption
    formatted_questions=[{"qText": q, "index": i} for i, q in enumerate(questions[:request.count])]
    
    return QuestionResponse(
    questions=formatted_questions,
    model_used=OLLAMA_MODEL_NAME
    )
  
  except Exception as e:
    import traceback
    print("❌ EXPLICIT REJECTION ERROR DUMP:")
    traceback.print_exc() # This outputs the exact line breaking inside your terminal window!
    raise HTTPException(status_code=500, detail=str(e))
  
#whisper transcription
# @app.post("/transcribe-audio")
# async def transcribe_audio(file: UploadFile = File(...)):
#   try:
#     audio_bytes = await file.read()
#     audio_in_memory = io.BytesIO(audio_bytes) # create a BytesIO object that holds the audio data
#     audio_segment = AudioSegment.from_file(audio_in_memory)
#     with tempfile.NamedTemporaryFile(suffix=".mp3") as temp:
#       temp_audio_path=temp.name
#       audio_segment.export(temp_audio_path, format="mp3")
#     if not WISHPER_MODEL:
#       raise HTTPException(status_code=500, detail="Whisper Model not loaded")
    
#     result = WISHPER_MODEL.transcribe(temp_audio_path)
#     os.remove(temp_audio_path)
#     return {"transcription": result["text"].strip()}

#   except Exception as e:
#     if 'temp_audio_path' in locals() and os.path.exists(temp_audio_path):
#       os.remove(temp_audio_path)
#     raise HTTPException(status_code=500, detail=str(e))

@app.post("/transcribe-audio")
async def transcribe_audio(file: UploadFile = File(...)):
    # Define a safe path inside your project directory
    save_dir = os.path.join(os.getcwd(), "temp_audio")
    os.makedirs(save_dir, exist_ok=True)
    
    # Generate a unique path using the filename
    file_path = os.path.join(save_dir, f"{file.filename}_{os.urandom(4).hex()}.mp3")
    
    try:
        audio_bytes = await file.read()
        audio_in_memory = io.BytesIO(audio_bytes)
        audio_segment = AudioSegment.from_file(audio_in_memory)
        
        # Export the file
        audio_segment.export(file_path, format="mp3")
        
        if not WISHPER_MODEL:
            raise HTTPException(status_code=500, detail="Whisper Model not loaded")
        
        # Transcribe
        result = WISHPER_MODEL.transcribe(file_path)
        return {"transcription": result["text"].strip()}

    except Exception as e:
        print(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        # Cleanup
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as cleanup_err:
                print(f"Could not delete temp file: {cleanup_err}")

@app.post("/evaluate-answer",response_model=EvaluationResponse)
async def evaluate_question(request: EvaluationRequest):
  try:
    if request.question_type=="oral":
      assessment_instruction=(
        "This is a conceptual oral question. Focus purely on candidates verbal explanation."
        "Ignore any code blocks."
        "CRITICAL: If the transcript is empty, nonsense or irrelevant(eg. 'blah blah blah', 'testing), score 0. and feedback 'Did not understand'."
      )
    else:
      assessment_instruction=(
        "This is a coding question. Evaluate the logic and efficiency."
        "Use the transcription only for insight into ther though process."
        "CRITICAL: If the code is empty, nonsense or irrelevant(eg. blank, random comments, random characters), score 0. and feedback 'No code submitted'."
      )
    
    system_prompt=(
      "You are a strict technical interviewer. "
      "Your output must be a single, valid JSON object. "
      "CRITICAL RULES: "
      "1. Respond ONLY with the JSON object. Do not include any prefix, suffix, introduction, or conversational filler. "
      "2. Do NOT use markdown code blocks (no ```json ... ```). "
      "3. If the answer is gibberish, irrelevant, or empty, set 'technicalScore': 0 and 'confidenceScore': 0. "
      "4. 'idealAnswer' must be a single string containing Markdown formatting for code, if applicable. Do not nest objects inside 'idealAnswer'. "
      f"Context: {assessment_instruction} "
      "Required JSON Keys: 'technicalScore' (integer 0-100), 'confidenceScore' (integer 0-100), 'aiFeedback' (string), 'idealAnswer' (string)."
    )

    user_prompt=(
      f"Evaluate the following question:"
      f"Question: {request.question} \n"
      f"Role: {request.role}\n"
      f"Level: {request.level}\n"
      f"Verbal Answer: {request.user_answer or 'No answer provided '}\n"
      f"Code Answer: {request.user_code or 'No code submitted '}\n"

    )
    response=ollama.generate(
      model=OLLAMA_MODEL_NAME,
      prompt=user_prompt,
      system=system_prompt,
      # format="json",
      options={"temperature": 0.1}, #strict and less creative
    )
    response_text=response['response'].strip()

    import re
    # 1. Extract the JSON block if the model included filler text
    match = re.search(r'\{.*\}', response_text, re.DOTALL)

    if match:
      json_str = match.group(0)
    else:
      # Fallback if the AI just spat out plain text without braces
      print(f"DEBUG: AI failed to wrap response in JSON: {response_text}")
      return EvaluationResponse(technicalScore=0, confidenceScore=0, aiFeedback="Formatting error", idealAnswer="N/A")

    
    # 2. Clean common JSON-breaking characters
    json_str = json_str.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
    
    try:
        evaluation_data = json.loads(json_str)
        
        # 3. Ensure idealAnswer is a string
        if 'idealAnswer' in evaluation_data and not isinstance(evaluation_data['idealAnswer'], str):
            evaluation_data['idealAnswer'] = json.dumps(evaluation_data['idealAnswer'])
            
        return EvaluationResponse(**evaluation_data)

    except json.JSONDecodeError as e:
        print(f"Failed to parse response: {response_text}")
        print(f"Extraction attempt: {json_str}")
        return EvaluationResponse( 
            technicalScore=0, 
            confidenceScore=0, 
            aiFeedback="AI generated invalid JSON. Please try again.", 
            idealAnswer="N/A"
        )
  except Exception as e:
    print(f"Failed to evaluate question: {e}")
    raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
  uvicorn.run(app, host="0.0.0.0", port=AI_SERVICE_PORT)