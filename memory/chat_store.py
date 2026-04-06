import json
import os

FILE_PATH = "memory/chat_history.json"

# create file if not exists
def init_store():
    if not os.path.exists(FILE_PATH):
        with open(FILE_PATH, "w") as f:
            json.dump([], f)


def load_chats():
    with open(FILE_PATH, "r") as f:
        return json.load(f)


def save_chats(chats):
    with open(FILE_PATH, "w") as f:
        json.dump(chats, f, indent=2)