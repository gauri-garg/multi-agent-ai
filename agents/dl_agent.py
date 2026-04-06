import pickle
import numpy as np
from tensorflow.keras.models import load_model

model = None
vectorizer = None
encoder = None

def load_dl_model():
    global model, vectorizer, encoder
    try:
        model = load_model("models/dl_model.h5")

        with open("models/dl_vectorizer.pkl", "rb") as f:
            vectorizer = pickle.load(f)

        with open("models/dl_label_encoder.pkl", "rb") as f:
            encoder = pickle.load(f)

        print("✅ DL model loaded")

    except Exception as e:
        print("❌ DL Load Error:", e)

def deep_analyze(task):
    if model is None or vectorizer is None or encoder is None:
        return {"error": "DL model not loaded"}

    X = vectorizer.transform([task]).toarray()
    pred = model.predict(X)

    category_index = int(np.argmax(pred))
    confidence = float(np.max(pred))
    confidence = min(confidence * 1.5, 1.0)

    category = encoder.inverse_transform([category_index])[0]

    return {
        "dl_category": category,
        "dl_confidence": f"{round(confidence*100, 2)}%"
    }

load_dl_model()