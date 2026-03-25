from agents.genai_agent import generate_response

def research_step(step):
    prompt = f"""
    Provide detailed information for this task step:
    {step}

    Give concise and useful explanation.
    """

    return generate_response(prompt)