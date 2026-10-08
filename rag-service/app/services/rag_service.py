from app.rag.embeddings import embed_text
from app.rag.faiss_store import create_index,search_index
from app.rag.generator import generate_answer
async def index_document(document_id: int,chunks: list[dict],) -> int:
    embeddings = []
    chunk_ids = []

    for chunk in chunks:
        embedding = await embed_text(
            chunk["text"]
        )

        embeddings.append(embedding)
        chunk_ids.append(chunk["chunk_id"])

    create_index(
        document_id,
        embeddings,
        chunk_ids,
    )

    return len(chunks)

async def search_document(
        document_id: int,
        question: str,
        top_k: int = 3
) -> list[dict]:
    query_embedding = await embed_text(
        question, 
        is_query=True
    )

    results = search_index(
        document_id,
        query_embedding,
        top_k
    )

    return results


async def generate(
        question:str,
        context:str,
) -> str:
    answer = await generate_answer(
        question,
        context
    )

    return answer