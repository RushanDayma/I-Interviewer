# I-Interviewer

I-Interviewer is an AI-powered technical interview simulation platform designed to help developers practice and refine their interview skills. By simulating a real-world technical interview environment, the platform provides users with personalized coding challenges and oral questions, followed by real-time AI-driven feedback.

---

## 🚀 Key Features

* **Customized Interviews:** Select your role (e.g., Software Developer, Data Scientist) and experience level.
* **Integrated Coding Environment:** Built-in Monaco editor supporting multiple languages.
* **Real-time Interaction:** Voice recording for oral questions and code submission for coding tasks.
* **AI-Powered Feedback:** Instant technical scores, confidence analysis, and ideal implementation suggestions using LLMs (Llama-4/Mistral).
* **Real-time Updates:** WebSocket-based event system to keep the UI in sync with background AI processing.

---

## 🛠 Tech Stack

### Frontend
* **React + Vite**
* **Redux Toolkit** (State Management)
* **Tailwind CSS** (Styling)
* **Monaco Editor**
* **Socket.io-client**

### Backend
* **Node.js + Express.js**
* **MongoDB + Mongoose**
* **Socket.io** (Real-time events)

### AI Service
* **Python + FastAPI**
* **OpenAI Whisper** (Speech-to-Text)
* **Ollama** (LLM Integration)

---

## 🏗 Architecture

The platform follows a decoupled, event-driven architecture to ensure responsiveness during heavy AI processing.



<img width="1024" height="559" alt="image" src="https://github.com/user-attachments/assets/134ae7da-5389-4f91-b94d-f4e957efad5f" />


1.  **Client:** Submits answers via HTTP.
2.  **Node Backend:** Orchestrates the process, handles data persistence, and triggers AI services.
3.  **AI Microservice:** Asynchronously processes audio and code, then returns feedback.
4.  **Real-time sync:** Backend broadcasts updates via Socket.io to trigger instant UI refreshes.

---

## 📺 Project Demo
<div align="center">
  <a href="https://youtu.be/luDyiCk5Gcc">
    <img src="https://img.shields.io/badge/Watch_Demo_Video-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="Watch Demo">
  </a>
</div>

---

## 📦 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+)
* [MongoDB](https://www.mongodb.com/)
* [Python 3.10+](https://www.python.org/)
* [Ollama](https://ollama.com/) (running locally)

### Installation

**1. Clone the repository:**
```bash
git clone [https://github.com/RushanDayma/I-Interviewer.git](https://github.com/RushanDayma/I-Interviewer.git)
cd I-Interviewer
   ```
2. Setup Backend:
   ```bash
    cd backend
    npm install
    # Create .env file with MONGO_URI and PORT
    npm run devgit clone [https://github.com/RushanDayma/I-Interviewer.git](https://github.com/RushanDayma/I-Interviewer.git)
    cd I-Interviewer
   ```
4. Setup AI Service:
   ```bash
    cd ai-service
    python -m venv venv
    source venv/bin/activate  # Windows: venv\Scripts\activate
    pip install -r requirements.txt
    uvicorn main:app --reload
   ```
6. Setup Frontend:
   ```bash
    cd frontend
    npm install
    npm run dev
   ```

### Developed By:

Rushan Asad Dayma
