from fastapi import FastAPI, Form, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import pytesseract
import io

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


# ✅ CORS FIX
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= REQUEST =================
class TaskRequest(BaseModel):
    task: str
    mode: str = "auto"

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

# ================= RENAME CHAT =================
@app.put("/chat/{chat_id}/rename")
def rename_chat(chat_id: int, name: str = Form(...)):
    chats = load_chats()
    for c in chats:
        if c["id"] == chat_id:
            c["name"] = name
            break
    save_chats(chats)
    return {"message": "renamed", "name": name}

# ================= TEXT MESSAGE =================
@app.post("/chat/{chat_id}")
def add_message(chat_id: int, task: str = Form(...), mode: str = Form(...)):

    chats = load_chats()

    for chat in chats:
        if chat["id"] == chat_id:

            context = build_smart_context(chat["messages"])

            chat["messages"].append({
                "type": "user",
                "text": task
            })

            ai_msg = generate_ai_response(
                task,
                mode,
                context=context,
                messages=chat["messages"]
            )

            chat["messages"].append(ai_msg)
            break

    save_chats(chats)
    return ai_msg

# ================= IMAGE UPLOAD =================
@app.post("/upload/{chat_id}")
async def upload_image(chat_id: int, file: UploadFile = File(...)):

    contents = await file.read()
    image = Image.open(io.BytesIO(contents))

    extracted_text = pytesseract.image_to_string(image)

    # 🖼️ Generate a lightweight thumbnail for persistent chat preview
    try:
        preview_img = image.copy()
        preview_img.thumbnail((500, 500))
        if preview_img.mode in ("RGBA", "P"):
            preview_img = preview_img.convert("RGB")
        
        buffered = io.BytesIO()
        preview_img.save(buffered, format="JPEG")
        
        import base64
        base64_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        img_data_url = f"data:image/jpeg;base64,{base64_str}"
    except Exception as e:
        img_data_url = None

    chats = load_chats()

    for chat in chats:
        if chat["id"] == chat_id:

            context = build_smart_context(chat["messages"])

            user_message = {
                "type": "user",
                "text": "[Image Uploaded 📷]"
            }
            if img_data_url:
                user_message["imageUrl"] = img_data_url
            
            chat["messages"].append(user_message)

            ai_msg = generate_ai_response(
                extracted_text,
                context=context,
                messages=chat["messages"]
            )

            chat["messages"].append(ai_msg)
            break

    save_chats(chats)
    return ai_msg

# ================= MODE DETECTION =================
def detect_mode(task: str):
    t = task.lower()
    if "summary" in t or "short" in t:
        return "summary"
    return "detailed"

##build_context(task)
def build_smart_context(messages, limit=6):
    context = []

    for msg in messages[-limit:]:
        if msg["type"] == "user":
            context.append(f"User: {msg['text']}")
        elif msg["type"] == "ai":
            short = msg.get("response", "")[:120]
            context.append(f"AI: {short}")

    return "\n".join(context)

def detect_query_type(task, context):
    task_lower = task.lower()

    if task_lower in context.lower():
        return "repeat"

    if any(word in task_lower for word in ["summary", "short", "brief"]):
        return "summary"

    if any(word in task_lower for word in ["more", "explain", "detail"]):
        return "followup"

    return "new"

# ================= AI CORE =================
def generate_ai_response(task: str, mode="auto", context="", messages=[]):

    # 🔥 SMART TYPE DETECTION
    query_type = detect_query_type(task, context)

    # 🔥 SYSTEM CONTROL (LIKE CHATGPT)
    system_instruction = f"""
You are an advanced AI assistant.

Context (reference only, DO NOT repeat):
{context}

Rules:
- Answer ONLY current query
- Do NOT repeat previous responses
- If same question → improve answer
- If follow-up → extend previous answer
- Be clear, structured, and useful
"""

    # 🔥 FINAL INPUT (CLEAN)
    final_input = task + "\n" + system_instruction

    # =============================
    # 1. PLAN
    # =============================
    steps = plan_task(final_input)

    if isinstance(steps, list):
        steps_list = steps
    else:
        steps_list = [s.strip() for s in steps.split("\n") if s.strip()]

    steps_list = steps_list[:6]

    # =============================
    # 2. ML + DL
    # =============================
    ml_result = analyze_task(task)

    if DL_AVAILABLE:
        dl_result = deep_analyze(task)
    else:
        dl_result = {"dl_category": "N/A", "dl_confidence": "0%"}

    # =============================
    # 3. MEMORY
    # =============================
    store_memory(task, metadata={"type": "task"})
    memory = search_memory(task)

    # =============================
    # 4. RESEARCH (SMART FILTER)
    # =============================
    existing_steps = []
    for m in messages:
        if m.get("plan"):
            existing_steps.extend(m["plan"])

    research_results = []

    for step in steps_list:
        if step in existing_steps:
            continue  # 🔥 skip repeated work

        research_results.append({
            "step": step,
            "research": research_step(step)
        })

    research_results = research_results[:4]

    # =============================
    # 5. RESPONSE LOGIC
    # =============================

    if query_type == "summary":
        response = f"📌 Summary:\n\n"
        for i, step in enumerate(steps_list[:5], 1):
            response += f"{i}. {step}\n"

    elif query_type == "followup":
        response = f"🔍 Additional Details:\n\n"
        for r in research_results:
            response += f"➡ {r['step']}\n{r['research'][:200]}...\n\n"

    elif query_type == "repeat":
        response = f"♻️ Improved Answer:\n\n"
        for r in research_results:
            response += f"➡ {r['step']}\n{r['research'][:150]}...\n\n"

    else:
        response = f"🚀 Answer:\n\n"

        for r in research_results:
            response += f"➡ {r['step']}\n{r['research'][:200]}...\n\n"

    response += f"\n🧠 ML: {ml_result['category']} ({ml_result['confidence']})"
    response += f"\n🤖 DL: {dl_result['dl_category']} ({dl_result['dl_confidence']})"

    return {
        "type": "ai",
        "response": response,
        "plan": steps_list,
        "research": research_results[:2],
        "full_research": research_results,
        "memory": memory
    }