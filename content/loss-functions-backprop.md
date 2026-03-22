# Loss Functions (Backprop Context)

#ml #optimisation #fundamentals

The loss function is the scalar-valued function that [[backpropagation]] differentiates. It sits at the root of the [[computational-graph]] — the starting point of the backward pass. Everything in training is oriented toward minimising this function via [[gradient-descent-optimisation|gradient descent]].

## Role in Backprop

The backward pass begins with $\frac{\partial L}{\partial L} = 1$ and propagates backward via the [[chain-rule-calculus|chain rule]]. The choice of loss function determines the **initial gradient signal** that flows through the network. A poorly chosen loss can produce uninformative gradients regardless of architecture.

## Common Loss Functions

### Regression
- **MSE (Mean Squared Error)**: $L = \frac{1}{n}\sum(y - \hat{y})^2$. Gradient is proportional to the error — large errors produce large gradients (which can be good or bad).
- **MAE (Mean Absolute Error)**: $L = \frac{1}{n}\sum|y - \hat{y}|$. Constant gradient magnitude — more robust to outliers but non-smooth at zero.
- **Huber Loss**: MSE for small errors, MAE for large — best of both worlds.

### Classification
- **Cross-entropy**: $L = -\sum y_i \log(\hat{y}_i)$. The natural loss for probability distributions. When paired with softmax, the gradient simplifies beautifully to $\hat{y} - y$ — the predicted distribution minus the true distribution.
- **Binary cross-entropy**: the two-class special case, paired with sigmoid.

### Why Cross-Entropy, Not MSE, for Classification?

MSE with sigmoid produces gradients that vanish when predictions are confidently wrong (because $\sigma'(x) \to 0$ at extremes). Cross-entropy's gradient doesn't have this problem — it stays proportional to the error magnitude. This is a direct consequence of how the loss interacts with [[vanishing-exploding-gradients|gradient dynamics]].

## Regularisation Terms

Losses often include penalty terms:
- **L2 (weight decay)**: $\lambda \|\theta\|^2$ — encourages small weights, equivalent to a Gaussian prior.
- **L1**: $\lambda \|\theta\|_1$ — encourages sparsity.

These add their own gradient contributions during [[backpropagation]].

## See Also

- [[backpropagation]] — the algorithm that starts from the loss
- [[gradient-descent-optimisation]] — what minimises the loss
- [[computational-graph]] — where the loss sits as the root node
- [[vanishing-exploding-gradients]] — how loss choice affects gradient health
