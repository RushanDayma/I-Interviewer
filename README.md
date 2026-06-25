# I-Interviewer

I-Interviewer is an AI-powered technical interview simulator. You pick your role (Software Developer, Data Scientist, etc.) and experience level, then work through a mix of coding problems and verbal questions. When you're done, you get detailed feedback on your answers, confidence, and areas to work on.

## Features

- Role and level selection to match the type of interview you're preparing for
- Built-in Monaco editor with multi-language support for coding questions
- Voice recording for verbal answers, transcribed via OpenAI Whisper
- AI-generated feedback with technical scores and ideal implementation examples (using Llama 4 / Mistral via Ollama)
- Real-time UI updates over WebSocket so results appear without refreshing

## Tech Stack

The frontend runs on React + Vite with Redux Toolkit for state, Tailwind CSS for styling, the Monaco editor for code input, and Socket.io-client for real-time updates.

The backend is Node.js + Express with MongoDB for persistence and Socket.io for pushing events to the client.

The AI service is a Python + FastAPI app using OpenAI Whisper for speech-to-text and Ollama for LLM inference.

## Architecture

The backend handles data persistence and orchestration. When you submit an answer, the Node backend sends it to the Python AI microservice for async processing. Once the AI service finishes, the backend broadcasts the result over Socket.io so the frontend updates immediately.

<img width="1024" height="559" alt="Architecture diagram" src="https://github.com/user-attachments/assets/134ae7da-5389-4f91-b94d-f4e957efad5f" />

## Demo

[Watch on YouTube](https://youtu.be/luDyiCk5Gcc)

## Getting Started

**Prerequisites**

- Node.js v18+
- MongoDB
- Python 3.10+
- [Ollama](https://ollama.com/) running locally with your chosen model

**Backend**

```bash
cd backend
npm install
# Add MONGO_URI and PORT to a .env file
npm run dev
```

**AI Service**

```bash
cd ai-service
python -m venv venv
# Windows: venv\Scripts\activate
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

---

Developed by Rushan Asad Dayma
