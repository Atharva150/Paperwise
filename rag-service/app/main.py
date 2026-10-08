from fastapi import FastAPI

from app.schemas import IndexRequest,IndexResponse,SearchRequest,SearchResponse,GenerateRequest,GenerateResponse
from app.services.rag_service import (index_document as index_document_service,search_document,generate)
app = FastAPI(
    title = "Paperwise RAG Service",
    version = "1.0.0"
)

@app.get("/health")
def health():
    return {
        "status":"ok",
        "service": "rag-service"
    }

@app.post("/rag/index",response_model=IndexResponse,)
async def index_document(
    request: IndexRequest
):
    indexed_chunks = await index_document_service(
        request.document_id,
        [
            {
                "chunk_id":chunk.chunk_id,
                "text": chunk.text
            }
            for chunk in request.chunks
        ]
    )
    return IndexResponse(
        document_id=request.document_id,
        indexed_chunks=indexed_chunks
    )

@app.post("/rag/search",response_model=SearchResponse)
async def search_rag_document(
        request:SearchRequest
):
    results = await search_document(
        request.document_id,
        request.question,
        request.top_k
    )

    return SearchResponse(
        document_id=request.document_id,
        results=[
            {
                "chunk_id": result["chunkId"],
                "score": result["score"],
            }
            for result in results
        ]
    )


@app.post("/rag/generate",response_model=GenerateResponse,)
async def generate_rag_answer(
    request:GenerateRequest
):
    answer = await generate(
        request.question,
        request.context
    )

    return GenerateResponse(
        answer=answer
    )

