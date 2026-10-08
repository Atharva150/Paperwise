
import httpx
import numpy as np
import os 
from app.config import HF_EMBEDDING_MODEL,HF_TOKEN

TOKEN = HF_TOKEN

MODEL = HF_EMBEDDING_MODEL

HF_URL = (
    "https://router.huggingface.co/"
    "hf-inference/models/"
    f"{MODEL}"
)


async def embed_text(
    text: str,
    is_query: bool = False,
) -> list[float]:

    if is_query:
        text = (
            "Represent this sentence for searching "
            f"relevant passages: {text}"
        )

    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json",
    }

    payload = {
        "inputs": text,
    }

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            HF_URL,
            headers=headers,
            json=payload,
        )

    response.raise_for_status()

    data = response.json()

    embedding = np.asarray(
        data,
        dtype=np.float32,
    )

    # Hugging Face may return [384] or [1, 384].
    # We want exactly [384].
    if embedding.ndim == 2:
        if embedding.shape[0] != 1:
            raise ValueError(
                f"Expected one embedding, got shape {embedding.shape}"
            )

        embedding = embedding[0]

    if embedding.ndim != 1:
        raise ValueError(
            f"Expected 1D embedding, got shape {embedding.shape}"
        )

    if embedding.shape[0] != 384:
        raise ValueError(
            f"Expected 384 dimensions, got {embedding.shape[0]}"
        )

    norm = np.linalg.norm(embedding)

    if norm == 0:
        raise ValueError(
            "Embedding has zero magnitude"
        )

    embedding = embedding / norm

    return embedding.tolist()