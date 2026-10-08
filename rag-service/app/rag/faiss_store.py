import json
from pathlib import Path

import faiss
import numpy as np


FAISS_DIR = Path("storage/faiss")


def _index_path(document_id: int) -> Path:
    return FAISS_DIR / f"document-{document_id}.index"


def _metadata_path(document_id: int) -> Path:
    return FAISS_DIR / f"document-{document_id}.json"


def create_index(
    document_id: int,
    embeddings: list[list[float]],
    chunk_ids: list[int],
) -> None:

    if len(embeddings) != len(chunk_ids):
        raise ValueError(
            "Embedding and chunk ID counts do not match"
        )

    if not embeddings:
        return

    FAISS_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    vectors = np.array(
        embeddings,
        dtype=np.float32,
    )

    dimension = vectors.shape[1]

    if dimension != 384:
        raise ValueError(
            f"Expected 384 dimensions, got {dimension}"
        )

    index = faiss.IndexFlatIP(dimension)

    index.add(vectors)

    faiss.write_index(
        index,
        str(_index_path(document_id)),
    )

    metadata = [
        {"chunkId": chunk_id}
        for chunk_id in chunk_ids
    ]

    _metadata_path(document_id).write_text(
        json.dumps(metadata, indent=2),
        encoding="utf-8",
    )


def search_index(
    document_id: int,
    query_embedding: list[float],
    top_k: int = 3,
) -> list[dict]:

    index = faiss.read_index(
        str(_index_path(document_id))
    )

    metadata = json.loads(
        _metadata_path(document_id).read_text(
            encoding="utf-8"
        )
    )

    k = min(top_k, len(metadata))

    if k == 0:
        return []

    query = np.array(
        [query_embedding],
        dtype=np.float32,
    )

    distances, labels = index.search(
        query,
        k,
    )

    results = []

    for position, label in enumerate(labels[0]):
        results.append({
            "chunkId": metadata[label]["chunkId"],
            "score": float(distances[0][position]),
        })

    return results