import os

import httpx


MODEL = "Qwen/Qwen3-8B"

HF_URL = "https://router.huggingface.co/v1/chat/completions"


async def generate_answer(
    question: str,
    context: str,
) -> str:

    messages = [
        {
            "role": "system",
            "content": (
                "You are a research assistant. "
                "Answer the user's question using only the provided context. "
                "If the context does not contain enough information, "
                "say that the information is not available in the provided context."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Context:\n{context}\n\n"
                f"Question:\n{question}"
            ),
        },
    ]

    headers = {
        "Authorization": f"Bearer {os.environ['HF_TOKEN']}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": MODEL,
        "messages": messages,
        "max_tokens": 1024,
        "temperature": 0.3
    }

    async with httpx.AsyncClient(timeout=120) as client:
        response = await client.post(
            HF_URL,
            headers=headers,
            json=payload,
        )

    response.raise_for_status()

    result = response.json()

    print("QWEN RAW RESPONSE:")
    print(result)

    choice = result["choices"][0]
    message = choice["message"]

    content = message.get("content")

    if content is None or not content.strip():
        raise RuntimeError(
            f"Qwen returned no final answer. "
            f"finish_reason={choice.get('finish_reason')}"
        )

    return content
        
