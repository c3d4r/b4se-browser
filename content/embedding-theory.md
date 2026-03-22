---
tags:
  - type/concept
  - topic/ml
  - topic/ai-cognition
  - status/incubating
summary: What embedding geometry actually encodes — linear concept directions, superposition, anisotropy, and the Platonic Representation Hypothesis
---

# Embedding Theory

Beyond using [[embeddings]] as a practical tool, there's a growing understanding of what the geometry of these spaces actually represents. The short version: embedding spaces are far richer than their nominal dimensionality suggests, concepts are encoded as directions, and different models converge on similar structure.

## Linear Concept Directions

The original king − man + woman ≈ queen finding (Mikolov et al., 2013, Word2Vec) showed that semantic relationships are encoded as approximately linear translations in embedding space. This extends beyond word analogies to document embeddings: there may be a "technical vs personal" direction, a "plan vs reflection" direction, a sentiment axis, a formality axis, etc.

These directions are discoverable via [[principal-component-analysis|PCA]] or by probing: pick two poles (e.g. "highly technical" and "highly personal" vault notes), compute the difference vector, and project all notes onto it.

## Superposition and Near-Orthogonality

The counterintuitive fact: a 1024-dimensional space can encode **far more than 1024 independent concepts**. In high dimensions, you can pack exponentially many vectors that are *almost* orthogonal (pairwise cosine similarity < 0.1). This is related to:

- **Johnson-Lindenstrauss lemma**: random projections preserve distances — you can project high-D data to much lower dimensions with bounded distortion
- **Superposition** (Anthropic's "Toy Models of Superposition" paper): neural networks represent more features than they have dimensions by encoding them as almost-orthogonal directions that coexist with small interference
- **Compressed sensing**: you can recover sparse signals from far fewer measurements than the signal's dimensionality

The practical implication: the 1024 dimensions of [[voyage-3.5-lite]] embeddings can encode thousands of independent concept-directions because the space is exponentially bigger than its basis.

## Anisotropy

Real embedding spaces aren't uniformly distributed. They tend to occupy a **narrow cone** — most vectors have surprisingly high cosine similarity to the mean vector. This means:

- Raw cosine distances can be misleading (everything looks somewhat similar)
- Subtracting the mean embedding or removing the first few PCA components ("whitening") can improve retrieval quality
- The effective dimensionality is lower than the nominal dimensionality

For visualisation this matters less. For retrieval quality and [[distance-metrics|distance metrics]], it can be significant.

## The Platonic Representation Hypothesis

Different models trained on different data with different objectives tend to converge on **similar representational structure**. This suggests that embedding spaces aren't arbitrary — they're discovering something about the actual structure of concepts. The geometry is not just a training artifact but reflects genuine semantic topology.

This connects to [[latent-space-dynamics]] — if both static embeddings and dynamic LLM hidden states converge on similar structure, there may be a "natural" coordinate system for meaning.

## Connections

- Parent: [[embeddings]]
- [[latent-space-dynamics]] — related space (LLM hidden states vs static document embeddings)
- [[superposition-and-near-orthogonality]] could be extracted as its own note if this grows
- [[distance-metrics]] — anisotropy affects which metrics work well
- [[principal-component-analysis]] — tool for discovering linear concept directions
- Anthropic's interpretability work (Sparse Autoencoders, Representation Engineering) probes these same questions in LLM internals
