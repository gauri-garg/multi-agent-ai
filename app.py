import pytesseract
from PIL import Image
from fastapi import UploadFile, File
import shutil
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agents.planner import plan_task
from agents.researcher import research_step
from agents.ml_agent import analyze_task
from memory.vector_db import store_memory, search_memory, load_db
from memory.chat_store import init_store, load_chats, save_chats


# 🔥 SAFE DL IMPORT
try:
    from agents.dl_agent import deep_analyze, load_dl_model
    DL_AVAILABLE = True
except:
    DL_AVAILABLE = False

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= OCR =================
def extract_text_from_image(file_path):
    try:
        img = Image.open(file_path)
        text = pytesseract.image_to_string(img)
        return text.strip()
    except Exception as e:
        return "Could not extract text"

# ================= REQUEST =================

class TaskRequest(BaseModel):
    task: str
    mode: str = "auto"   # auto | detailed | summary

# ================= STARTUP =================

@app.on_event("startup")
def startup():
    load_db()
    init_store()
    if DL_AVAILABLE:
        load_dl_model()

@app.get("/")
def home():
    return {"message": "AI Running 🚀"}

# ================= CHAT =================

@app.get("/chats")
def get_chats():
    return load_chats()

@app.post("/chat")
def create_chat():
    chats = load_chats()

    new_chat = {
        "id": len(chats) + 1,
        "name": f"Chat {len(chats)+1}",
        "pinned": False,
        "messages": []
    }

    chats.append(new_chat)
    save_chats(chats)
    return new_chat

@app.delete("/chat/{chat_id}")
def delete_chat(chat_id: int):
    chats = load_chats()
    chats = [c for c in chats if c["id"] != chat_id]
    save_chats(chats)
    return {"message": "deleted"}

@app.put("/chat/{chat_id}/pin")
def pin_chat(chat_id: int):
    chats = load_chats()
    for c in chats:
        if c["id"] == chat_id:
            c["pinned"] = not c.get("pinned", False)
    save_chats(chats)
    return {"message": "toggled"}

@app.post("/upload-image/{chat_id}")
async def upload_image(chat_id: int, file: UploadFile = File(...)):

    chats = load_chats()

    # save file
    file_path = f"temp_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # OCR
    extracted_text = extract_text_from_image(file_path)

    # delete temp
    os.remove(file_path)

    # fallback if empty
    if not extracted_text:
        extracted_text = "No readable text found in image"

    for chat in chats:
        if chat["id"] == chat_id:

            # USER IMAGE MESSAGE
            chat["messages"].append({
                "type": "user",
                "text": f"[Image Uploaded]",
                "image": True
            })

            # AI RESPONSE USING OCR TEXT
            ai_msg = generate_ai_response(extracted_text)

            chat["messages"].append(ai_msg)
            break

    save_chats(chats)

    return {
        "extracted_text": extracted_text,
        "ai": ai_msg
    }

# ================= MODE DETECTION =================

def detect_mode(task: str):
    t = task.lower()
    if "summary" in t or "short" in t:
        return "summary"
    return "detailed"

# ================= AI CORE =================

def generate_ai_response(task: str, mode="auto"):

    # 🔥 AUTO MODE DETECT
    if mode == "auto":
        mode = detect_mode(task)

    # 1. PLAN
    steps = plan_task(task)

    if isinstance(steps, list):
        steps_list = steps
    else:
        steps_list = [s.strip() for s in steps.split("\n") if s.strip()]

    # LIMIT STEPS
    MAX_STEPS = 6
    steps_list = steps_list[:MAX_STEPS]

    # 2. ML
    ml_result = analyze_task(task)

    # 3. DL
    if DL_AVAILABLE:
        dl_result = deep_analyze(task)
    else:
        dl_result = {
            "dl_category": "N/A",
            "dl_confidence": "0%"
        }

    # 4. MEMORY
    store_memory(task, metadata={"type": "task"})
    memory = search_memory(task)

    # 5. RESEARCH (LIMITED FOR UI)
    research_results = []
    MAX_RESEARCH = 4

    for step in steps_list[:MAX_RESEARCH]:
        research_results.append({
            "step": step,
            "research": research_step(step + " explain in detail with example")
        })

    # ================= RESPONSE =================

    if mode == "summary":
        # 🔹 SHORT RESPONSE
        response = f"📌 Summary: {task}\n\n"

        for i, step in enumerate(steps_list[:10], 1):
            response += f"{i}. {step}\n"

        response += f"\n🧠 ML: {ml_result['category']} ({ml_result['confidence']})"
        response += f"\n🤖 DL: {dl_result['dl_category']} ({dl_result['dl_confidence']})"

    else:
        # 🔹 DETAILED RESPONSE
        response = f"🚀 TASK: {task}\n\n"

        response += "📌 Step-by-step plan:\n"
        for i, step in enumerate(steps_list, 1):
            response += f"{i}. {step}\n"

        response += "\n🔍 Explanation:\n"

        for r in research_results:
            short_text = r["research"][:300]  # prevent huge output
            response += f"\n➡ {r['step']}\n{short_text}...\n"

        response += f"\n🧠 ML: {ml_result['category']} ({ml_result['confidence']})"
        response += f"\n🤖 DL: {dl_result['dl_category']} ({dl_result['dl_confidence']})"

    # ================= RETURN =================

    return {
        "type": "ai",
        "mode": mode,
        "response": response,
        "plan": steps_list,
        "ml": ml_result,
        "dl": dl_result,

        # 🔥 UI CONTROL
        "research": research_results[:2],     # SHORT (default UI)
        "full_research": research_results,    # FULL (expand button)
        "memory": memory
    }

# ================= SEND MESSAGE =================

@app.post("/chat/{chat_id}")
def add_message(chat_id: int, request: TaskRequest):

    chats = load_chats()

    for chat in chats:
        if chat["id"] == chat_id:

            # USER MESSAGE
            chat["messages"].append({
                "type": "user",
                "text": request.task
            })

            # AI RESPONSE
            ai_msg = generate_ai_response(request.task, request.mode)

            chat["messages"].append(ai_msg)
            break

    save_chats(chats)
    return ai_msg