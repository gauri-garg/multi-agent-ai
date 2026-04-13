from agents.genai_agent import generate_response

def plan_task(task):
    prompt = f"""
    Break the following task into detailed, practical, step-by-step execution plan.

    Requirements:
    - Minimum 8-12 steps
    - Each step should be actionable
    - Include tools, technologies, and strategy
    - Be detailed like a professional roadmap

    Task: {task}
    """

    response = generate_response(prompt)

    # convert into list
    steps = response.split("\n")
    steps = [step.strip() for step in steps if step.strip()]

    return steps