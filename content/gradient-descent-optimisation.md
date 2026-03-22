# Gradient Descent & Optimisation

#ml #optimisation #fundamentals

Gradient descent is the family of algorithms that use the gradients computed by [[backpropagation]] to iteratively update model parameters toward a loss minimum.

## Vanilla Gradient Descent

$$\theta_{t+1} = \theta_t - \eta \nabla_\theta L$$

Where $\eta$ is the learning rate. Simple, but has well-known problems: sensitive to learning rate, slow in ravines, can get stuck in saddle points.

## Stochastic Gradient Descent (SGD)

Instead of computing the gradient over the entire dataset, SGD estimates it from a **mini-batch**. This introduces noise that paradoxically helps — it can escape shallow local minima and saddle points. The trade-off is variance in the gradient estimate.

## Momentum

Accumulates a velocity vector from past gradients, damping oscillations and accelerating along consistent gradient directions:

$$v_{t+1} = \beta v_t + \nabla_\theta L, \quad \theta_{t+1} = \theta_t - \eta v_{t+1}$$

Intuition: a ball rolling downhill accumulates speed in consistent directions.

## Adaptive Methods

- **Adam** (Adaptive Moment Estimation): maintains per-parameter running averages of both first moment (mean) and second moment (variance) of gradients. Most widely used in practice.
- **RMSProp**: adapts learning rate per parameter based on recent gradient magnitudes.
- **AdaGrad**: accumulates all past squared gradients — good for sparse features, but learning rate monotonically decreases.

## Learning Rate Schedules

The learning rate is arguably the most important hyperparameter. Common schedules: cosine annealing, warm-up + decay, cyclical learning rates. The right schedule often matters more than the choice of optimiser.

## Connection to Backprop

[[Backpropagation]] computes $\nabla_\theta L$ — the gradient. Optimisation algorithms decide **what to do** with that gradient. They are separable concerns, which is why frameworks cleanly separate the backward pass from the optimiser step.

## See Also

- [[backpropagation]] — computes the gradients these methods consume
- [[vanishing-exploding-gradients]] — pathologies that affect optimisation dynamics
- [[loss-functions-backprop]] — what we're actually minimising
