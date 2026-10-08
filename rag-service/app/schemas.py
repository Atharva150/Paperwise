from pydantic import BaseModel


class ChunkInput(BaseModel):
    chunk_id: int
    text: str


class IndexRequest(BaseModel):
    document_id: int
    chunks: list[ChunkInput]


class IndexResponse(BaseModel):
    document_id: int
    indexed_chunks: int


class SearchRequest(BaseModel):
    document_id: int
    question: str
    top_k: int = 3

class SearchResult(BaseModel):
    chunk_id: int
    score: float

class SearchResponse(BaseModel):
    document_id: int
    results: list[SearchResult]

class GenerateRequest(BaseModel):
    question: str
    context: str        

class GenerateResponse(BaseModel):
    answer: str    