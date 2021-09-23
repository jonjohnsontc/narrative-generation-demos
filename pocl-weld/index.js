// Helper fn's are at the top, before POP. These are fn's that I haven't figured out if/how
// they're used in partial order planning (POP), but I find helpful to illustrate in code
const parsed = require("/Users/jonjohnson/dev/narrative-generation/shared-libs/parser/parser");

// I have this in cpopl/script.js as well
let coinFlip = () => {
  return Math.floor(Math.random() * 2);
};

// I was thinking about putting together some custom exception types like this
// Not using the Error object, which I'm not sure is good or bad: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/Error
const NoUnifierException = (literal) => {
  return {
    name: 'NoUnifierException',
    msg: `_|_, No unifier found for ${literal}`
  }
}

// TODO: I'd like to parameterize the "block"/"table" values 
let getParameters = (stateActions) => {
  let allActors = new Set();

  for (stateObject of stateActions) {
    if (stateObject.action === "block" || stateObject.action === "table") {
      allActors.add(stateObject.parameters[0])
    } 
  }
  return allActors
}

module.exports.getParameters = getParameters;

/**
 * A function that returns the most general unifier of literals Q & R with respect to the codedesignation constraints in B
 * @param {any} Q Literal - first portion of an agenda that needs to be satisfied
 * @param {any} R Literal - likely an effect of an action
 * @param {any} B Vector of (non)codedesignation constraints
 * @returns {any} Most general unifier of literals or false
 */
function BGU(Q, R, B) {
  // So if Q is:
  // { operation: '', action: 'on', parameters: ['b', 'c']}
  // and R is 
  // { operation: '', action: 'on', parameters: ['p1', 'p2']}
  // And variable bindings are: []
  // We could return:
  // ['b', 'c'] 
  
  // Since R could potentially be modified by binding constraints, we'll make a copy of it inside of a vector
  // The vector will hold all of the variable contstraints, either positioned before or after R
  let RCopy = [{...R}]
  let actors = getParameters()
  
  let QArgs = Q.parameters

  // Step one: apply valid variable bindings
  if (B.length > 0)  {
    for (binding of B) { 
      for (arg in Q.parameters) {
        // TODO?
        // If we can guarantee that a literal parameter within a binding constraint is always the first or the last
        // parameter in a parameter array, then we don't have to perform a loop, we can just access that element
        for (parameter of biding.parameters) {
          if (parameter === arg) {
            RCopy.push(binding)
          }
        }
      }
    }
  }
  // Step two: compare Q and R
  // Q, RCopy
  let justR = RCopy[0];

  if (justR.operation === Q.operation && justR.action === Q.action) {
    // If there are any binding constraints in within the RCopy vector
    // we need to apply them to Q or R, depending on whether operation = 'not'
    if (RCopy.length > 1) {
      for (constraint of RCopy.slice(1,)) {
        // constraint should look something like this:
        // { operation: 'not', action: 'eq', parameters: [ 'b', 'y' ] }
        if (constraint.operation === 'not') {
          
          // If operation = 'not', then we want to apply the binding constraints 
          // to Q, to ensure that neither of Q's arguments are within the binding constraints
          // I'm also assuming that constraint.action is always 'eq'
          for (arg of Q.parameters) {
            if (arg === constraint.parameters[0] || arg === constraint.parameters[1]) {
              throw NoUnifierException(Q)
            } 
          }
        } 
        // If operation = '', then we want to apply the binding constraints to justR
        // I'm also assuming that constraint.action is always 'eq'
        if (constraint.operation === '') {
          for (arg of constraint) {
            for (param of justR.parameters) {
              if (arg === param) {
                // Get opposite constraint and bind it to justR
                // or create some expression out of constraint that is passed through
                // as a filter when selecting arguments
                // constraint should be a pair within a list, so we should be able to use filter,
                // and pull the result out of the single array
                let otherArg = constraint.filter((x) => x != arg)[0]
                let binding = (state) => state === otherArg

              }
            }
          }
        }
      }
    }
  } else { 
    throw NoUnifierException(Q)
  }

  // Step three: return valid unifier or false
}

// Here is an example action:
// {
//   action: 'move',
//   parameters: [
//     { parameter: 'b', type: null },
//     { parameter: 't1', type: null },
//     { parameter: 't2', type: null }
//   ],
//   precondition: [
//   { operation: 'and', action: 'block', parameters: [ 'b' ] },
//   { operation: '', action: 'table', parameters: [ 't1' ] },
//   { operation: '', action: 'table', parameters: [ 't2' ] },
//   { operation: '', action: 'on', parameters: [ 'b', 't1' ] },
//   { operation: 'not', action: 'on', parameters: [ 'b', 't2' ] },
//   { operation: '', action: 'clear', parameters: [ 'b' ] }
// ],
//   effect: [
//   { operation: 'and', action: 'on', parameters: [ 'b', 't2' ] },
//   { operation: 'not', action: 'on', parameters: [ 'b', 't1' ] }
// ]
// }
// Given that everything is expressed within an object, how should I design the (non)codedesignation constraints?
// maybe:
// { operation: 'not', action: 'eq', parameters: [ 'b', 'y' ] }
// { operation: '', action: 'eq', parameters: [ 't2', 'y' ] }


/**
 * The main function. This is built based off of me reading through `An Introduction to Least Commitment Planning`by Daniel Weld.
 * @param {Map<PropertyKey, Array>} plan An object consisting of a number of vectors for each portion of a partially ordered plan. Includes actions, orderingConstraints, causalLinks, and variableBindings
 * @param {any} agenda 
 * @returns {Map<PropertyKey, Array>} A complete ordered plan 
 */
function POP(plan, agenda) {
  
  let isEqual = (Q, effect, B) => {
    // Q right now is a literal, but it needs more context to work with a binding
    if (B.length === 0) {
      // We don't need to test bindings, just compare Q and effect
      // TODO: This probably won't work, but wanted to have an example up
      return Q === effect
    } else {
      
      for (binding of B) {
        // Test if binding matches. If it does, we need to apply it to 
        Q = testBinding(binding) ? applyBinding(binding, Q) : Q;
      }
      return Q === effect
    }
  }

  /**
   * Given Q, selects an action from the set of AOLArray and actions.
   * @param {any} Q
   * @param {any} AOLArray
   * @param {any} actions
   * @returns {any} 'aAdd' an action
   */
  let chooseAction = (Q, AOLArray, actions, B = []) => {
    // Weld states that action can be chosen from either the array of actions
    // or the AOLArray, but does not give any guidance as to how the action
    // should be selected. I'm going for a super naive, actions array-first approach
    let allActions = actions.concat(AOLArray);
    
    for (let aAdd of allActions) {
      // The choice of aAdd must consider all new & existing actions, such that 
      // one of aAdd's effects unifies with the goal given the plan's codesignation constraints
      
      for (effect of aAdd.effects) {
      // TODO: the value equality comparison b/w Q and aAdd will likely have to change,
      // given the structure of effects e.g, { operation: 'and', action: 'on', parameters: [ 'b', 't2' ] }
        if (isEqual(Q, aAdd.effect, B)) {
          return aAdd;
      }
      }
    }
    // If there is no action that can satisfy Q in either array, we return a failure
    throw Error("no action matches Q, failure");
  };

  // If aAdd is already in A, then let Oprime be all O's with aAdd before aNeed
  // if aAdd is new, then let Oprime be all O's with aAdd after the start step (a0)
  // and before the goal step (aInf)
  let updateOrderingConstraints = (aAdd, aNeed, AOLArray) => {
    let actions = AOLArray.actions.slice();
    let orderingConstraintPrime;
    if (actions.find((x) => (x.name === aAdd.name) == null)) {
      // Find initial action
      // TODO: Is this the best name for the first action?
      let firstAction = actions.filter((x) => x.name === "first");
      // I don't *yet* know if ordering constraints are always 'lesser than' pairs (e.g, a < b)
      // but given that assumption we create another constraint with name as first step
      // and tail as the new action
      let newConstraint = [
        {
          name: aAdd.name,
          tail: AOLArray.actions[AOLArray.actions.length - 1],
        },
        {
          name: firstAction.name,
          tail: aAdd.name,
        },
      ];
      orderingConstraintPrime = AOLArray.order.concat(newConstraint);
    } else {
      // if the action isn't new to the plan (AOLArray)
      let newConstraint = {
        name: aAdd.name,
        tail: aNeed.name,
      };
      orderingConstraintPrime = AOLArray.order.concat(newConstraint);
    }
    // I'm arbitrarily sorting by name here, so all the ordering constraints
    // will be grouped as such. I don't think this is important if my assumption
    // about ordering constraint construction with lesser than pairs (name < tail) is true
    return orderingConstraintPrime.sort((a, b) => a.name - b.name);
  };
  /**
   * Create a causal link
   * @param {any} creator The Action that spawned
   * @param {any} consumer
   * @returns {any}
   */
  let createCausalLink = (creator, consumer, prep) => {
    return {
      createdBy: creator,
      consumedBy: consumer,
      // The preposition (or Q) needs to be a string representation of the effect/precondition
      // shared by the creator and consumer.
      preposition: prep,
    };
  };

  let updateCausalLinks = (causalLinks, action, Q) => {
    // I'm implying/setting the goal action name as "last"
    // I'm not sure if all causal links made by new actions
    // are always set to create a link like this, but I believe so
    let newCausalLink = createCausalLink(action, "last", Q);
    return causalLinks.concat(newCausalLink);
  };

  let createOrderingConstraint = (name, tail) => {
    return {
      name: name,
      tail: tail,
    };
  };

  let checkForThreats = (action, orderingConstraints, causalLinks) => {
    // Within each causal link, we need to check to see if it's 'Q' matches the opposite
    // of any effects within the action we just added.
    let newOrderingConstraints = orderingConstraints.slice();
    for (link of causalLinks) {
      // Because it's a single action, I don't know if it's possible to return more than
      // one result to potentialThreats
      potentiaThreats = action.effects.filter(
        (x) => x === `-${link.preposition}`
      );
      if (potentiaThreats.length !== 0) {
        // If there exists a threat from the action, we need to check the action to see if it's new
        if (
          orderingConstraints.filter((x) => x.name === action.name).length === 0
        ) {
          // If the action is new, we need to make sure that the ordering constraints we add respect the
          // rule O = O' U {A0 < Aadd < AInf}. Therefore the ordering constraint needs to be b/w the
          // action and the consumer of causalLink
          if (link.createdBy.name === "first") {
            newOrderingConstraints.push(
              createOrderingConstraint(action.name, link.consumedBy.name)
            );
          }
        } else {
          // If it's not new, we can can make either creator, or consumer the tail
          // In this case, I'll leave it to random "chance" by a coinFlip helper fn
          if (coinFlip() === 0) {
            newOrderingConstraints.push(
              createOrderingConstraint(action.name, link.createdBy.name)
            );
          } else {
            newOrderingConstraints.push(
              createOrderingConstraint(action.name, link.consumedBy.name)
            );
          }
        }
      }
    }
    return newOrderingConstraints;
  };

  // 1. If agenda is empty return <A, O, L>
  // We need to ensure that initial state contains no variable bindings, and all variables mentioned 
  // in the effects of an operator be included in the preconditions of an operator
  if (agenda.length === 0) {
    return plan;
  } else {
    // 2. Goal selection
    // we choose an item in the agenda. right now we're selecting the first item
    // but it doesn't need to be. It's destructured into Q which is a constant, and 
    // `aNeed` which 
    let { q, aNeed } = agenda[0];

    // 3. Action selection
    let aAdd = chooseAction(q, plan, actions);

    // Creating new inputs (iPrime) which will be called recursively in 6 below
    let linksPrime = updateCausalLinks(plan.links);
    let orderConstrPrime = updateOrderingConstraints(
      aAdd,
      aNeed,
      plan
    );
    let actionsPrime = plan.actions.concat(aAdd);

    // 4. Update the goal set
    let agendaPrime = agenda.splice(0, 1);

    // If aAdd is newly instantiated, then for each conjunct Qi, of its precondition,
    // add <Qi, aAdd> to the agenda
    // In other words, if aAdd.name is not in plan, we add each of
    // its preconditions to the agenda
    if (
      plan.actions.find((x) => x.name === aAdd.name) ==
      null
    ) {
      // This is deterministic (as long as the order of .preconditions doesn't change)
      // but this is another thing that could possibly be ordered explicitly
      agendaPrime.push(aAdd.preconditions);
    }

    // 5. causal link protection
    orderConstrPrime = checkForThreats(aAdd, orderConstrPrime, linksPrime);

    // 6. recursive invocation
    POP(
      { actions: actionsPrime, order: orderConstrPrime, links: linksPrime, variableBindings: null },
      agendaPrime
    );
  }
}

