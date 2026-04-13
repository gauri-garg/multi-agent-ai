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

class TaskRequest(BaseModel):
    task: str

# 🚀 STARTUP
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

# ================= AI CORE =================

def generate_ai_response(task: str):

    # 1. PLAN (NO LIMIT ❗)
    steps = plan_task(task)

    if isinstance(steps, list):
        steps_list = steps
    else:
        steps_list = [s.strip() for s in steps.split("\n") if s.strip()]

    # 2. ML
    ml_result = analyze_task(task)

    # 3. DL (SAFE)
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

    # 5. RESEARCH
    research_results = []
    MAX_STEPS = 6   # 🔥 control length
    MAX_RESEARCH = 4

    steps_list = steps_list[:MAX_STEPS]

    research_results = []
    for step in steps_list[:MAX_RESEARCH]:
        research_results.append({
            "step": step,
            "research": research_step(step)
        })

    # 🔥 HUMAN-LIKE RESPONSE (LONG)
    response = f"🚀 TASK: {task}\n\n"

    response += "📌 Step-by-step plan:\n"
    for i, step in enumerate(steps_list, 1):
        response += f"{i}. {step}\n"

    response += "\n🔍 Detailed Explanation:\n"
    for r in research_results:
        short_research = r['research'][:300]  # limit each block
        response += f"\n➡ {r['step']}\n{short_research}...\n"

    response += f"\n🧠 ML: {ml_result['category']} ({ml_result['confidence']})"
    response += f"\n🤖 DL: {dl_result['dl_category']} ({dl_result['dl_confidence']})"

    return {
    "type": "ai",
    "response": response,
    "plan": steps_list,
    "ml": ml_result,
    "dl": dl_result,
    "research": research_results[:3],      # 🔥 short version
    "full_research": research_results      # 🔥 full version
}

# ================= SEND MESSAGE =================

@app.post("/chat/{chat_id}")
def add_message(chat_id: int, request: TaskRequest):

    chats = load_chats()

    for chat in chats:
        if chat["id"] == chat_id:

            chat["messages"].append({
                "type": "user",
                "text": request.task
            })

            ai_msg = generate_ai_response(request.task)
            chat["messages"].append(ai_msg)
            break

    save_chats(chats)
    return ai_msg