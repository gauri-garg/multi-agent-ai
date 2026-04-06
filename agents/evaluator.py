from agents.genai_agent import generate_response

def evaluate_response(task, plan, ml_result, dl_result):
    
    score = 0
    feedback = []

    # 1. Check plan quality
    if isinstance(plan, list) and len(plan) >= 3:
        score += 3
    else:
        feedback.append("Plan is too short")

    # 2. Check ML confidence
    if "confidence" in ml_result:
        score += 2

    # 3. Check DL confidence
    try:
        conf = float(dl_result["dl_confidence"].replace("%", ""))
        if conf > 50:
            score += 3
        else:
            feedback.append("Low DL confidence")
    except:
        feedback.append("DL error")

    # 4. Improve if score low
    improved_output = None
    if score < 5:
        improved_output = generate_response(
            f"Improve this plan for task: {task}\nPlan: {plan}"
        )

    return {
        "score": score,
        "feedback": feedback,
        "improved_output": improved_output
    }