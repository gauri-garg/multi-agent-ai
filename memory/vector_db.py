from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
import os
import datetime

# embedding model
embedding = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# storage path
DB_PATH = "memory/faiss_index"

db = None

# load or create DB
def load_db():
    global db
    try:
        if os.path.exists(DB_PATH):
            db = FAISS.load_local(
                DB_PATH,
                embedding,
                allow_dangerous_deserialization=True
            )
            print("✅ Memory loaded")
        else:
            db = FAISS.from_texts(["Initial memory"], embedding)
            db.save_local(DB_PATH)
            print("✅ New memory created")
    except Exception as e:
        print("❌ DB Load Error:", e)


# store memory with metadata
def store_memory(text, metadata=None):
    global db

    if db is None:
        load_db()

    try:
        db.add_texts(
            [text],
            metadatas=[metadata if metadata else {
                "type": "general",
                "time": str(datetime.datetime.now())
            }]
        )
        db.save_local(DB_PATH)
    except Exception as e:
        print("❌ Store Error:", e)


# search memory
def search_memory(query, k=2):
    global db

    if db is None:
        load_db()

    try:
        results = db.similarity_search(query, k=k)

        return [
            {
                "text": r.page_content,
                "metadata": r.metadata
            }
            for r in results
        ]
    except Exception as e:
        print("❌ Search Error:", e)
        return []