from fastapi import FastAPI, Form, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from PIL import Image
import pytesseract
import io
import asyncio
import json
import re

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

    new_id = max((c["id"] for c in chats), default=0) + 1

    new_chat = {
        "id": new_id,
        "name": f"Chat {new_id}",
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
async def add_message(
    chat_id: int, 
    task: str = Form(...), 
    ai_length: str = Form("Auto"),
    ai_format: str = Form("Auto"),
    ai_tone: str = Form("Auto"),
    ai_language: str = Form("Auto")
):

    chats = load_chats()
    chat_found = next((c for c in chats if c["id"] == chat_id), None)
    if not chat_found:
        return {"error": "Chat not found"}

    context = build_smart_context(chat_found["messages"])
    chat_found["messages"].append({"type": "user", "text": task})

    async def stream_response():
        ai_msg = await asyncio.to_thread(generate_ai_response, task, context, chat_found["messages"], ai_length, ai_format, ai_tone, ai_language)
        text = str(ai_msg.get("response", ""))
        tokens = re.split(r'(\s+)', text)
        for token in tokens:
            if token:
                yield json.dumps({"type": "chunk", "text": token}) + "\n"
                await asyncio.sleep(0.02)  # Fast, realistic stream delay
        chat_found["messages"].append(ai_msg)
        save_chats(chats)
        yield json.dumps({"type": "done", "full": ai_msg}) + "\n"

    return StreamingResponse(stream_response(), media_type="application/x-ndjson")

# ================= FILE UPLOAD =================
@app.post("/upload/{chat_id}")
async def upload_file(
    chat_id: int, 
    file: UploadFile = File(...),
    ai_length: str = Form("Auto"),
    ai_format: str = Form("Auto"),
    ai_tone: str = Form("Auto"),
    ai_language: str = Form("Auto")
):

    contents = await file.read()
    filename = file.filename.lower()
    extracted_text = ""
    img_data_url = None

    if filename.endswith((".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif")):
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
            
    elif filename.endswith(".pdf"):
        try:
            import PyPDF2
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text: extracted_text += text + "\n"
        except ImportError:
            extracted_text = "[Error: PyPDF2 is not installed. Run `pip install PyPDF2`]"
        except Exception as e:
            extracted_text = f"[PDF Extraction Error: {e}]"
            
    elif filename.endswith(".pptx"):
        try:
            from pptx import Presentation
            prs = Presentation(io.BytesIO(contents))
            for slide in prs.slides:
                for shape in slide.shapes:
                    if hasattr(shape, "text"):
                        extracted_text += shape.text + "\n"
        except ImportError:
            extracted_text = "[Error: python-pptx is not installed. Run `pip install python-pptx`]"
        except Exception as e:
            extracted_text = f"[PPTX Extraction Error: {e}]"
            
    else:
        try:
            extracted_text = contents.decode("utf-8")
        except:
            extracted_text = f"[Uploaded file: {file.filename}, but content could not be read as text.]"
            
    if not extracted_text.strip():
        extracted_text = f"[Uploaded file: {file.filename}, but no text was found.]"

    chats = load_chats()
    chat_found = next((c for c in chats if c["id"] == chat_id), None)
    if not chat_found:
        return {"error": "Chat not found"}

    context = build_smart_context(chat_found["messages"])
    user_message = {"type": "user", "text": f"[File Uploaded: {file.filename} 📎]"}
    if img_data_url:
        user_message["imageUrl"] = img_data_url
    chat_found["messages"].append(user_message)

    async def stream_upload_response():
        ai_msg = await asyncio.to_thread(generate_ai_response, extracted_text, context, chat_found["messages"], ai_length, ai_format, ai_tone, ai_language)
        text = str(ai_msg.get("response", ""))
        tokens = re.split(r'(\s+)', text)
        for token in tokens:
            if token:
                yield json.dumps({"type": "chunk", "text": token}) + "\n"
                await asyncio.sleep(0.02)
        chat_found["messages"].append(ai_msg)
        save_chats(chats)
        yield json.dumps({"type": "done", "full": ai_msg}) + "\n"

    return StreamingResponse(stream_upload_response(), media_type="application/x-ndjson")

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
def generate_ai_response(task: str, context="", messages=[], ai_length="Auto", ai_format="Auto", ai_tone="Auto", ai_language="Auto"):

    # 🔥 SMART TYPE DETECTION
    query_type = detect_query_type(task, context)

    # =============================
    # 1. PLAN
    # =============================
    planning_prompt = f"Break down this task into 3-5 concise search queries or sub-topics for research: {task}"
    steps = plan_task(planning_prompt)

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
    research_text = "\n".join([f"- {r['step']}: {r['research']}" for r in research_results])

    # =============================
    # 5. STRICT PROMPT BUILDER & AI SYNTHESIS
    # =============================
    length_mapping = {
        "Short": "3-6 lines maximum.",
        "Medium": "1-3 paragraphs.",
        "Detailed": "Full comprehensive explanation with headings.",
        "10 lines": "Exactly around 10 lines.",
        "100 lines": "Long, highly structured answer."
    }

    format_mapping = {
        "Paragraph": "Use readable paragraphs with spacing.",
        "Bullet Points": "Use markdown bullet points. Every point on a new line.",
        "Numbered Steps": "Use numbered steps (1., 2., 3.).",
        "Table": "Generate a COMPLETE markdown table. NEVER output broken tables.",
        "Comparison": "Generate a comparison format (use a table if applicable).",
        "Report": "Use Report format: Title, Introduction, Analysis, Conclusion.",
        "Flowchart Text": "Output text formatted like a flowchart (e.g., Step A -> Step B).",
        "Markdown": "Use rich markdown formatting."
    }

    auto_mode_rules = """
<SMART_DETECTION>
User settings are 'Auto'. Act like an elite AI:
- Greeting → short natural reply
- Report request → headings format
- Compare request → table
- Explain topic → medium clean answer
- Code request → code block
- Steps request → numbered list
- Summary request → concise bullets
- Chart/Graph/Flowchart request → Use Mermaid.js (```mermaid) syntax to draw the chart. Do NOT put titles or explanations inside the mermaid block.
</SMART_DETECTION>
"""

    is_custom = ai_length != "Auto" or ai_format != "Auto" or ai_tone != "Auto" or ai_language != "Auto"

    system_instruction = f"""
You are an elite, highly capable AI assistant (like ChatGPT / Gemini). Your intelligence is vast.

<USER_PREFERENCES>
Length: {length_mapping.get(ai_length, ai_length)}
Format: {format_mapping.get(ai_format, ai_format)}
Tone: {ai_tone}
Language: {ai_language}
</USER_PREFERENCES>

<STRICT_RULES>
1. PRIORITY ORDER: Format > Length > Tone > Language.
2. STRICT COMPLIANCE: You MUST strictly follow the selected settings above. If Format is 'Table', output a table.
3. BAD OUTPUT PREVENTION: 
   - NEVER generate repeated headings or duplicated paragraphs.
   - NEVER repeat the exact same sentence twice.
   - NEVER output random task execution plans, internal research steps, or irrelevant planning steps. Synthesize the knowledge instead.
   - Remove all robotic filler text. Answer directly and naturally.
4. ACCURACY: Answer the user's prompt directly using the Knowledge Base.
5. VISUALIZATIONS: If the user explicitly asks for a flowchart, chart, graph, or timeline, YOU MUST generate a valid Mermaid.js code block. Nodes MUST use simple alphanumeric IDs without spaces (e.g., A, B, C). Node labels MUST be enclosed in brackets (e.g., A[Patient Arrival] -->|Label| B[Next Step]). DO NOT output a markdown table or text list when a flowchart is requested. NEVER use spaces in node IDs. NEVER add a `>` after the text label like `-->|text|>node`. NEVER include titles, explanations, or normal text inside the ```mermaid block.
6. {auto_mode_rules if not is_custom else "Enforce the user preferences strictly. However, if the user prompt explicitly asks for a flowchart, Mermaid visualization overrides Format preference."}
</STRICT_RULES>

<KNOWLEDGE_BASE>
{research_text}
</KNOWLEDGE_BASE>

Respond to: {task}
Answer ONLY with the final response. Use professional formatting. No repetition.
"""

    # Send the combined data back to the LLM to generate the TRUE final response
    final_response = plan_task(system_instruction)
    
    if isinstance(final_response, list):
        final_response = "\n".join(str(x) for x in final_response)

    # =============================
    # 6. RETRY ENFORCEMENT LOGIC
    # =============================
    if ai_format == "Table" and "|" not in final_response:
        print("⚠️ AI ignored Table format. Retrying...")
        retry_prompt = system_instruction + "\n\n[SYSTEM ERROR]: You failed validation. Rewrite your previous response entirely as a COMPLETE MARKDOWN TABLE."
        final_response = plan_task(retry_prompt)
        if isinstance(final_response, list):
            final_response = "\n".join(str(x) for x in final_response)
    elif ai_format == "Bullet Points" and not any(c in final_response for c in ["- ", "* ", "• "]):
        print("⚠️ AI ignored Bullet format. Retrying...")
        retry_prompt = system_instruction + "\n\n[SYSTEM ERROR]: You failed validation. Rewrite your previous response entirely as a BULLETED LIST."
        final_response = plan_task(retry_prompt)
        if isinstance(final_response, list):
            final_response = "\n".join(str(x) for x in final_response)

    # Append Metrics
    final_response += f"\n\n🧠 ML: {ml_result['category']} ({ml_result['confidence']})"
    final_response += f"\n🤖 DL: {dl_result['dl_category']} ({dl_result['dl_confidence']})"

    return {
        "type": "ai",
        "response": final_response,
        "plan": steps_list,
        "research": research_results[:2],
        "full_research": research_results,
        "memory": memory
    }