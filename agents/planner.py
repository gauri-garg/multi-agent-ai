from agents.genai_agent import generate_response

def plan_task(user_input):
    prompt = f"""
    Break this task into clear numbered steps.

    Task: {user_input}

    Output format:
    1. Step one
    2. Step two
    3. Step three
    """

    response = generate_response(prompt)

    # convert into list
    steps = response.split("\n")
    steps = [step.strip() for step in steps if step.strip()]

    return steps