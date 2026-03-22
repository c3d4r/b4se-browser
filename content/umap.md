---
tags:
  - type/concept
  - topic/ml
  - topic/data-science
  - status/incubating
summary: Modern nonlinear projection grounded in manifold theory — better global structure than t-SNE, faster, more stable
---

# UMAP (Uniform Manifold Approximation and Projection)

The modern default for dimensionality reduction of embeddings. Same basic goal as [[t-sne]] (preserve local structure in low dimensions) but with stronger theoretical foundations and better practical properties.

## Theoretical Basis

UMAP assumes the data lies on a **locally connected Riemannian manifold** — a curved surface in the high-dimensional space. It constructs a topological representation (a fuzzy simplicial set) of this manifold, then finds the best low-dimensional layout that preserves the topological structure. The mathematical framework draws on category theory and algebraic topology (Spivak's work on metric realization of fuzzy simplicial sets).

In practice: it builds a weighted graph of local neighbourhoods in high-D, then optimises a low-D graph to match it. The optimisation uses cross-entropy rather than KL-divergence, which helps preserve global structure.

## Key Parameters

- **n_neighbors** (analogous to [[perplexity]] in t-SNE): how many neighbours to consider per point. Low values (5–15) emphasise micro-structure, higher values (30–50) show more global layout. For ~110 vault notes, 10–15 is a good starting point.
- **min_dist**: how tightly points can pack in the 2D map. Low (0.0–0.1) gives dense, separated clusters. Higher (0.3–0.5) gives more even spread. For vault visualisation, low min_dist makes clusters easier to see.
- **metric**: the distance metric in high-D space (cosine for [[embeddings]])

## Advantages Over t-SNE

- **Better global structure** — distances between clusters carry more meaning
- **Faster** — especially on larger datasets
- **More stable** across runs (though still not fully deterministic)
- **Supports adding new points** (transform method) without rerunning from scratch
- **Scales well** — can handle millions of points

## Limitations

- Still a nonlinear projection — some distortion is inevitable
- Parameters matter: bad choices give misleading layouts
- The manifold assumption may not hold for all data

## Connections

- Parent: [[projection-approaches]]
- Compared with [[t-sne]] (which it largely supersedes for practical use)
- [[principal-component-analysis]] sometimes used as preprocessing step
- Applied in [[visualizing-embeddings]] for the vault map
- Clusters found by [[clustering-methods|HDBSCAN]] can be overlaid on UMAP projections
