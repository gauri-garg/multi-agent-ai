import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from sklearn.feature_extraction.text import CountVectorizer
import pickle

# dataset
data = [
    ("create youtube channel", 0),
    ("start business", 1),
    ("learn python", 2),
    ("build ai app", 3),
]

texts = [x[0] for x in data]
labels = [x[1] for x in data]

# vectorize text
vectorizer = CountVectorizer()
X = vectorizer.fit_transform(texts).toarray()
y = np.array(labels)

# DL model
model = Sequential()
model.add(Dense(16, input_dim=X.shape[1], activation='relu'))
model.add(Dense(8, activation='relu'))
model.add(Dense(4, activation='softmax'))

model.compile(loss='sparse_categorical_crossentropy', optimizer='adam', metrics=['accuracy'])

model.fit(X, y, epochs=50, verbose=1)

# save model + vectorizer
model.save("models/dl_model.h5")

with open("models/dl_vectorizer.pkl", "wb") as f:
    pickle.dump(vectorizer, f)

print("✅ DL model trained!")