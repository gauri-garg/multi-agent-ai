from fastapi import FastAPI
from agents.planner import plan_task
from agents.researcher import research_step
from agents.ml_agent import analyze_task
from agents.dl_agent import deep_analyze, load_dl_model
from memory.vector_db import store_memory, search_memory, load_db

app = FastAPI()

# startup event
@app.on_event("startup")
def startup_event():
    load_db()
    load_dl_model()

@app.get("/")
def home():
    return {"message": "Multi-Agent AI Running 🚀"}

@app.get("/execute")
def execute_task(task: str):

    # 1. Planning
    steps = plan_task(task)

    # handle both string and list
    if isinstance(steps, list):
        steps_list = steps
    else:
        steps_list = [s.strip() for s in steps.split("\n") if s.strip()]

    # 2. ML + DL Analysis
    ml_result = analyze_task(task)
    dl_result = deep_analyze(task)

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

    # Final response
    return {
        "task": task,
        "plan": steps_list,
        "ml_analysis": ml_result,
        "dl_analysis": dl_result,
        "memory": memory,
        "research": research_results
    }