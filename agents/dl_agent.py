import pickle
import numpy as np
from tensorflow.keras.models import load_model

model = None
vectorizer = None

labels_map = {
    0: "Content Creation",
    1: "Business",
    2: "Education",
    3: "Technology"
}

def load_dl_model():
    global model, vectorizer
    try:
        model = load_model("models/dl_model.h5")
        with open("models/dl_vectorizer.pkl", "rb") as f:
            vectorizer = pickle.load(f)
        print("✅ DL model loaded")
    except Exception as e:
        print("❌ DL Model Load Error:", e)

def deep_analyze(task):
    if model is None or vectorizer is None:
        return {"error": "DL model not loaded"}

    X = vectorizer.transform([task]).toarray()
    pred = model.predict(X)

    category_index = int(np.argmax(pred))
    confidence = float(np.max(pred))

    return {
        "dl_category": labels_map.get(category_index, "Unknown"),
        "dl_confidence": f"{round(confidence*100, 2)}%"
    }