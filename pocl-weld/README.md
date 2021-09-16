# An Introduction to Least Commitment Planning

I've compiled some notes from Daniel Weld's paper below.
## Implementation Details

Choose a data structure to represent partial order over actions (O).

```
[]
```

- needs to support adding new constraints to O
- testing if O is consistent
- determining if Ai can be consistently ordered prior to Aj
- returning the set of actions that can be ordered before Aj

...can be reduced to

- the ability to add or delete Ai < Aj from O 
- test O for consistency

On handling threats:

> Whenever a new causal link is added to L, all actions in A are tested to see if they threaten it.  This  action  takes  O(a)  time.  Whenever a new action instance is added to A, all links in L are tested to see if they are threatened. This action takes O(a2) time

## Analysis

Expected performance of a search algorithm is O(cb^n), where:

- n = how many times nondeterministic choose is called
- b = how many possibilities need to be considered for each choose?
- c = how long does it take to process a given node in the search space?

(what is a node?) - I think it is a full run of POP(<A,O,L>, agenda)
## Planning with Partially Instantiated Actions

- Thus, a plan is now <A, O, L, B>, and a problem’s null plan has B = {}.
- Need a way to perform unification
  - **WHAT IS THAT**
  - I think it's a way to ensure that actions are only performed based on valid variable bindings?
  

