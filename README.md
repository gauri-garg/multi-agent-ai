# 🚀 Multi-Agent AI System

An advanced **Multi-Agent AI System** built using **Python, Machine Learning, Deep Learning, and Generative AI**.

This project simulates how multiple intelligent agents collaborate to solve complex tasks using planning, analysis, memory, and research.

---

## 🧠 Features

- 🧩 **Planner Agent**
  - Breaks user tasks into structured actionable steps

- 🤖 **ML Agent**
  - Classifies task category using Machine Learning

- 🧠 **DL Agent**
  - Uses Deep Learning model for advanced task understanding

- 🔍 **Research Agent**
  - Performs contextual research for each step

- 💾 **Memory System (FAISS)**
  - Stores and retrieves past tasks using vector similarity

- ⚡ **FastAPI Backend**
  - High-performance API for execution

---
## 🔄 System Workflow

User Input → Planner → ML + DL Analysis → Memory → Research → Final Output

---

## 🛠️ Tech Stack

- Python 🐍
- FastAPI ⚡
- Machine Learning (Scikit-learn)
- Deep Learning (TensorFlow/Keras)
- LangChain
- FAISS (Vector Database)
- HuggingFace Embeddings

---

```markdown
## 🎯 Why This Project?

- Demonstrates real-world multi-agent AI systems
- Combines ML + DL + Memory + APIs
- Scalable architecture
- Simulates autonomous AI workflows


## ⚙️ Installation

### 1. Clone the repository
```bash
git clone https://github.com/gauri-garg/multi-agent-ai.git

python -m venv venv310
source venv310/bin/activate   # Mac/Linux

pip install -r requirements.txt

uvicorn app:app --reload

http://127.0.0.1:8000/execute?task=build%20ai%20startup

## 📦 Download Models

Download models from:g
https://drive.google.com/drive/folders/1ZqiAbHk0LUiRd2Ym8xn0bvV0dM9jUP24?usp=sharing

Place them inside:
models/
memory/faiss_index/


