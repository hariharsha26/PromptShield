"""
Vectorised cosine similarity using NumPy broadcasting.
All comparisons are batched into a single matrix operation — ~10–50x faster than a Python loop.
"""
import numpy as np


def cosine_similarity_vectorised(query_vec: np.ndarray, matrix: np.ndarray) -> np.ndarray:
    """
    Compute cosine similarity between a single query vector and every row in matrix.

    Args:
        query_vec : (D,)  — embedding for a single prompt
        matrix    : (N, D) — pre-stacked training embeddings

    Returns:
        scores    : (N,)  — cosine similarity for each row in matrix
    """
    # Normalise query
    q_norm = query_vec / (np.linalg.norm(query_vec) + 1e-10)

    # Normalise each row of matrix
    row_norms = np.linalg.norm(matrix, axis=1, keepdims=True) + 1e-10
    m_normed = matrix / row_norms

    # Dot product = cosine similarity (already unit-length vectors)
    scores: np.ndarray = m_normed @ q_norm
    return scores
