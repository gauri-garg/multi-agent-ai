from fastapi import FastAPI
from agents.planner import plan_task
from agents.researcher import research_step
from agents.ml_agent import analyze_task
from agents.dl_agent import deep_analyze, load_dl_model
from memory.vector_db import store_memory, search_memory, load_db
from agents.evaluator import evaluate_response
from fastapi.middleware.cors import CORSMiddleware
from memory.chat_store import init_store, load_chats, save_chats
from pydantic import BaseModel


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

# startup event
@app.on_event("startup")
def startup_event():
    load_db()
    load_dl_model()
    init_store()

@app.get("/")
def home():
    return {"message": "Multi-Agent AI Running 🚀"}

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

    return {"message": "Chat deleted"}

@app.put("/chat/{chat_id}")
def rename_chat(chat_id: int, name: str):
    chats = load_chats()

    for chat in chats:
        if chat["id"] == chat_id:
            chat["name"] = name
            break

    save_chats(chats)

    return {"message": "Chat renamed"}

@app.put("/chat/{chat_id}/pin")
def pin_chat(chat_id: int):
    chats = load_chats()

    for chat in chats:
        if chat["id"] == chat_id:
            chat["pinned"] = not chat.get("pinned", False)
            break

    save_chats(chats)

    return {"message": "Pin toggled"}

@app.post("/chat/{chat_id}")
def add_message(chat_id: int, request: TaskRequest):
    task = request.task

    chats = load_chats()

    for chat in chats:
        if chat["id"] == chat_id:

            # USER MESSAGE
            chat["messages"].append({
                "type": "user",
                "text": task
            })

            # AI PIPELINE
            steps = plan_task(task)

            ml_result = analyze_task(task)
            dl_result = deep_analyze(task)

            store_memory(task, metadata={"type": "user_task"})
            memory = search_memory(task)

            ai_msg = {
                "type": "ai",
                "plan": steps[:5] if isinstance(steps, list) else [steps],
                "ml": ml_result,
                "dl": dl_result,
                "memory": memory
            }

            chat["messages"].append(ai_msg)
            break

    save_chats(chats)

    return ai_msg

@app.get("/execute")
def execute_task(task: str):

    # 1. Planning
    steps = plan_task(task)

    # handle both string and list
    if isinstance(steps, list):
        steps_list = steps
        
    else:
        steps_list = [s.strip() for s in steps.split("\n") if s.strip()]
        # clean + limit steps
       
    steps_list = [s for s in steps_list if len(s) > 10]
    steps_list = steps_list[:5]

    # 2. ML + DL Analysis
    ml_result = analyze_task(task)
    dl_result = deep_analyze(task)
    if float(dl_result["dl_confidence"].replace("%","")) > 60:
        final_category = ml_result["category"]
    else:
        final_category = dl_result["dl_category"]
   

    # 3. Memory Store + Retrieve
    store_memory(task, metadata={"type": "user_task"})
    memory = search_memory(task)

    # 4. Research per step
    research_results = []
    for step in steps_list:
        result = research_step(step)
        research_results.append({
            "step": step,
            "research": result
        })
    #5 evaluation
    evaluation = evaluate_response(task, steps_list, ml_result, dl_result)

    # Summarize findings
    summary = f"This task is related to {ml_result['category']} and analyzed using multi-agent AI."

    # Final response
    return {
        "task": task,
        "summary": summary,
        "plan": steps_list,
        "ml_analysis": ml_result,
        "dl_analysis": dl_result,
        "final_decision": final_category,
        "memory": memory,
        "research": research_results,
        "evaluation": evaluation
    }