# Backpropagation

#ml #optimisation #fundamentals

Backpropagation (backprop) is the algorithm that makes training deep neural networks tractable. It computes the **gradient of the loss function** with respect to every weight in the network by applying the [[chain-rule-calculus|chain rule]] recursively from output to input.

## Core Idea

A neural network is a composition of differentiable functions. Backprop exploits this by decomposing the end-to-end gradient into a product of local gradients, computed layer by layer in reverse order. This is what makes it "back" propagation — information about error flows backward through the [[computational-graph|computational graph]].

## The Two Passes

1. **Forward pass** — input flows through the network; each node computes its output and caches intermediate values (activations, pre-activations) needed later.
2. **Backward pass** — starting from the [[loss-functions-backprop|loss]], gradients are propagated backward. Each node receives the gradient of the loss w.r.t. its output (the "upstream gradient") and computes the gradient w.r.t. its inputs and parameters using local Jacobians.

## Key Equation

For a composition $L = f_n \circ f_{n-1} \circ \dots \circ f_1$:

$$\frac{\partial L}{\partial \theta_k} = \frac{\partial L}{\partial h_n} \cdot \frac{\partial h_n}{\partial h_{n-1}} \cdots \frac{\partial h_{k+1}}{\partial h_k} \cdot \frac{\partial h_k}{\partial \theta_k}$$

Each $\frac{\partial h_{i+1}}{\partial h_i}$ is a local Jacobian — cheap to compute and multiply.

## Why It Works

- **Efficiency**: Computing all gradients costs roughly 2× the forward pass (one forward, one backward). Without backprop, you'd need a separate forward pass per weight — catastrophically expensive.
- **Modularity**: Each layer only needs to know its own local derivative. This is why frameworks like PyTorch and JAX can auto-differentiate arbitrary compositions.

## Related Notes

- [[chain-rule-calculus]] — the mathematical foundation
- [[computational-graph]] — the data structure backprop operates on
- [[gradient-descent-optimisation]] — what we do with the gradients once we have them
- [[vanishing-exploding-gradients]] — the pathology that plagued early deep networks
- [[automatic-differentiation]] — the generalisation of backprop in modern frameworks
- [[loss-functions-backprop]] — the starting point of the backward pass

## History

Backprop was independently discovered multiple times. Bryson and Ho (1969), Werbos (1974), and Rumelhart, Hinton & Williams (1986) are the key milestones. The 1986 Nature paper is what catalysed widespread adoption in neural network research.

## Connections to Broader Thinking

From an [[automatic-differentiation|AD]] perspective, backprop is just reverse-mode AD applied to a specific computational graph. The insight generalises far beyond neural networks — anywhere you have a differentiable program and want gradients w.r.t. its parameters.
