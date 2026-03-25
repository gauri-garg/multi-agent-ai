import pickle

# load model
with open("models/ml_model.pkl", "rb") as f:
    model, vectorizer = pickle.load(f)

def analyze_task(task):
    X = vectorizer.transform([task])
    prediction = model.predict(X)[0]

    return {
        "category": prediction,
        "confidence": "Real ML Model"
    }