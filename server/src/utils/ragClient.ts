const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL ?? "http://localhost:8000";

type ChunkInput = {
    chunk_id: number,
    text: string
}

type IndexResponse = {
    document_id: number
    indexed_chunks: number
}

type SearchResult = {
    chunk_id: number
    score: number
}


type SearchResponse = {
    document_id: number
    results: SearchResult[]
}


type GenerateResponse = {
    answer: string
}

export async function indexDocumentInRagService(
    document_id: number,
    chunks: ChunkInput[]
): Promise<IndexResponse> {
    
    const response = await fetch(`${RAG_SERVICE_URL}/rag/index`,
        {
            method: "POST",
            
            headers: {
                "Content-Type": "application/json"
            },
            
            body: JSON.stringify({
                document_id: document_id,   
                chunks
            })
        }
    )
    if(!response.ok){
        const errortext = await response.text()
        
        throw new Error(
            `RAG Service Indexing Failed(${response.status}): ${errortext}`
        )
    }
    
    return response.json() as Promise<IndexResponse>
    
}


export async function searchDocumentInRagService(
    document_id: number,
    question: string,
    topK: number =3
): Promise<SearchResponse> {
    
    const response = await fetch(`${RAG_SERVICE_URL}/rag/search`,
        {
            method: "POST",
            
            headers: {
                "Content-Type": "application/json"
            },
            
            body: JSON.stringify({
                document_id: document_id,   
                question,
                top_k:topK
            })
        }
    )
    if(!response.ok){
        const errortext = await response.text()
        
        throw new Error(
            `RAG Service Search Failed(${response.status}): ${errortext}`
        )
    }
    
    return response.json() as Promise<SearchResponse>

}



export async function generateRagService(
    question: string,
    context: string
): Promise<GenerateResponse> {
    
    const response = await fetch(`${RAG_SERVICE_URL}/rag/generate`,
        {
            method: "POST",
            
            headers: {
                "Content-Type": "application/json"
            },
            
            body: JSON.stringify({
                question,   
                context
            })
        }
    )
    if(!response.ok){
        const errortext = await response.text()
        
        throw new Error(
            `RAG Service Generation Failed(${response.status}): ${errortext}`
        )
    }
    
    return response.json() as Promise<GenerateResponse>
    
}