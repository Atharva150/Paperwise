import os 

from dotenv import load_dotenv

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")

HF_EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"

QWEN_MODEL = "QWEN/QWEN3-8B"

FAISS_DIR = os.getenv(
    "FAISS_DIR",
    "./storage/faiss"
)

