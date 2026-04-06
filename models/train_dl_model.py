import pandas as pd
import numpy as np
import pickle

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
from tensorflow.keras.utils import to_categorical

# Load dataset
df = pd.read_csv("data/dataset.csv")

texts = df["text"]
labels = df["label"]

# Encode labels
encoder = LabelEncoder()
y = encoder.fit_transform(labels)
y = to_categorical(y)

# Vectorize text (IMPROVED)
vectorizer = TfidfVectorizer(
    max_features=8000,
    ngram_range=(1,2)
)
X = vectorizer.fit_transform(texts).toarray()

# Build model (IMPROVED)
model = Sequential([
    Dense(256, activation='relu', input_shape=(X.shape[1],)),
    Dropout(0.3),
    Dense(128, activation='relu'),
    Dropout(0.3),
    Dense(64, activation='relu'),
    Dense(len(set(labels)), activation='softmax')
])

model.compile(
    loss='categorical_crossentropy',
    optimizer='adam',
    metrics=['accuracy']
)

# Train model
model.fit(X, y, epochs=30, batch_size=8)

# Save model
model.save("models/dl_model.h5")

# Save vectorizer
with open("models/dl_vectorizer.pkl", "wb") as f:
    pickle.dump(vectorizer, f)

# Save label encoder (NEW)
with open("models/dl_label_encoder.pkl", "wb") as f:
    pickle.dump(encoder, f)

print("✅ DL model trained and saved!")