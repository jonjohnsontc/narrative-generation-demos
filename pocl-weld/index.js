// Helper fn's are at the top, before POP. These are fn's that I haven't figured out if/how
// they're used in partial order planning (POP), but I find helpful to illustrate in code
const parsed = require("/Users/jonjohnson/dev/narrative-generation/shared-libs/parser/parser");

// I have this in cpopl/script.js as well
/**
 * Helper function meant to simulate a coin flip
 * @returns {Number} either 0 or 1
 */
let coinFlip = () => {
  return Math.floor(Math.random() * 2);
};

let zip = (array1, array2) => {
  let pairs = [];
  for (let i = 0; i < array1.length; i++) {
    pairs.push([array1[i], array2[i]]);
  }
  return pairs;
};

module.exports.zip = zip;

// I was thinking about putting together some custom exception types like this
// Not using the Error object, which I'm not sure is good or bad: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/Error
const NoUnifierException = (literal) => {
  return {
    name: "NoUnifierException",
    msg: `_|_, No unifier found for ${literal}`,
  };
};

/**
 * Returns true if the vector pair a matches the vector pair b
 * @param {Array} a
 * @param {Array} b
 * @returns {Boolean}
 */
const pairMatch = function doVectorPairsMatch(a, b) {
  if (a.length != 2) {
    throw Error("a length must be 2");
  }
  if (b.length != 2) {
    throw Error("b length must be 2");
  }
  if (a[0] === a[1]) {
    throw Error("member of pairs should not be equal, a is equal");
  }
  if (b[0] === b[1]) {
    throw Error("member of pairs should not be equal, b is equal");
  }
  if ((a[0] === b[1] || a[0] === b[0]) && (a[1] === b[0] || a[1] === b[1])) {
    return true;
  } else {
    return false;
  }
};

module.exports.pairMatch = pairMatch;

// TODO: I'd like to parameterize the "block"/"table" values
/**
 * Description
 * @param {any} stateActions
 * @returns {any}
 */
let getParameters = (stateActions) => {
  let allActors = new Set();

  for (stateObject of stateActions) {
    if (stateObject.action === "block" || stateObject.action === "table") {
      allActors.add(stateObject.parameters[0]);
    }
  }
  return [...allActors];
};

module.exports.getParameters = getParameters;

/**
 * Creates a binding constraint from the two params provided
 * @param {any} assignor A parameter from an operator
 * @param {any} assignee A parameter from an operator or param of Q
 * @param {boolean} equal true if the params should be set to equal, false if not
 * @returns {any}
 */
let createBindingConstraint = function createBindingConstraintFromLiterals(
  assignor,
  assignee,
  equal
) {
  // Making sure the assignor is not capitalized
  if (assignor.charCodeAt(0) < 96) {
    throw Error("Invalid assignor");
  }
  return {
    equal: equal,

    // This isn't a construct of POP from Weld, rather something I did to try and more easily
    // differentiate constants from Q vs params from an operator
    assignor: assignor,
    assignee: assignee,
  };
};

module.exports.createBindingConstraint = createBindingConstraint;

/**
 * A function that returns the most general unifier of literals Q & R with respect to the codedesignation constraints in B
 * @param {any} Q Literal - first portion of an agenda that needs to be satisfied
 * @param {any} R Literal - likely an effect of an action
 * @param {any} B Vector of (non)codedesignation constraints
 * @returns {any} Most general unifier of literals or false
 */
let MGU = function findMostGenerialUnifier(Q, R, B) {
  // So if Q is:
  // { operation: '', action: 'on', parameters: ['b', 'c']}
  // and R is
  // { operation: '', action: 'on', parameters: ['p1', 'p2']}
  // And variable bindings are: []
  // We could return:
  // ['b', 'c']

  // Since R could potentially be modified by binding constraints, we'll make a copy of it inside of a vector
  // The vector will hold all of the variable contstraints, either positioned before or after R
  let RCopy = [{ ...R }];

  // For the most general unifier, let's just assume Q's parameters
  /** @type {Array} */
  let QArgs = Q.parameters;
  let checkBindings = function checkBindingsForConflict(binding, effect, Q) {
    // binding each parameter with each value
    qPairs = zip(effect.parameters, Q.parameters);

    // If it's an equals binding, we need to make sure that the value within the binding linked to the
    // operator's parameter is resolvable to our chosen parameters
    if (binding.equal) {
      // If the assignee is capitalized, then we want to make sure that the variable it's set
      // equal to is the same as the variable tied to it in qPairs
      if (binding.assignee.charCodeAt(0) < 96) {
        let qBinding = qPairs.filter(x => x[0] === binding.assignee || x[1] === binding.assignee);
        
        // If the binding pair and the binding scenario are equal, then there is no coflict and we can return true
        // Otherwise we return false
        return pairMatch([binding.assignor, binding.assignee], qBinding[0])
      } else {
        // to my knowledge, there shouldn't be equal bindings between variable names
        // if there is, I should figure out the right way to handle them
        throw Error(`Invalid Binding, ${binding}`)
      }
      // else binding is not equal (noncodesignation constraint)
    } else {
      if (binding.assignee.charCodeAt(0) < 96) {
        let qBinding = qPairs.filter(x => x[0] === binding.assignee || x[1] === binding.assignee);

        return !pairMatch([binding.assignor, binding.assignee], qBinding[0])
      } else {
        // We're going to look at the variable pairs and make sure that they aren't equal
        // TODO: What do i do if it's a variable from something in A? 
        // TODO: Would it ever be something not in Q or R?
        let vBinding = "";
      }
    }
  };
  // Step one: apply valid variable bindings
  // Step two: compare Q and R
  if (B.length > 0) {
    for (binding of B) {
      // If any binding parameters are equal to any of Q's or the effects parameters, we will evaluate
      // via `checkBindings`
      if (
        binding.assignee === QArgs[0] ||
        binding.assignee === QArgs[1] ||
        binding.assignee === effect.parameters[0] ||
        binding.assignee === effect.parameters[1] ||
        binding.assignor === QArgs[0] ||
        binding.assignor === QArgs[1] ||
        binding.assignor === effect.parameters[0] ||
        binding.assignor === effect.parameters[1]
      ) {
        if (checkBindings(binding, R, Q)) {
          continue
        } else {
          throw NoUnifierException(Q)
        }
      }
    }
  }

  return QArgs
};
module.exports.MGU = MGU;

// TODO: This needs to bind params in the correct order
/**
 * Binds parameters to an action. If the action contains more parameters than specified,
 * a nondeterministic choose is called which retrieves any additional arguments
 * @param {any} action
 * @param {any} args
 * @returns {any}
 */
let bindParams = function bindParameters(action, args) {
  let actionWithParams = { ...action };
  // If the number of parameters is the same as the number of args
  // we can bind them without needing to generate additional args
  if (actionWithParams.parameters.length === args.length) {
    actionWithParams.parameters = args;
  }
  return actionWithParams;
};

module.exports.bindParams = bindParams;

let isNew = function isActionNew(action) {
  return action.parameters[0].parameter.charCodeAt(0) > 96;
};

module.exports.isNew = isNew;

// I had build this to try and make a recursive way of checking the newness of all params
// but I keep either running into recursion errors or returning undefined
// TODO: Port to cljs and see if works?
let verifyPreconditions = function checkAllPreconditions(
  parameters,
  isActionNew
) {
  if (parameters.length === 0) {
    return isActionNew;
  } else {
    // Is the parameter an upper or lowercase? We check by looking at the charcode of the parameter
    let isThisParamNew = parameters[0].parameter.charCodeAt(0) > 96;

    // If 'isNewAction' is consistent with the current param, or undefined, we recur
    // otherwise we throw an error that the action is bad
    if (isThisParamNew === isActionNew || typeof isActionNew === "undefined") {
      checkAllPreconditions(parameters.slice(1), isThisParamNew);
    } else {
      return "butt";
    }
  }
};

/**
 * Given Q, selects an action from the set of AOLArray and actions.
 * @param {any} Q
 * @param {any} AOLArray
 * @param {any} actions
 * @returns {any} 'aAdd' an action
 */
let chooseAction = function findActionThatSatisfiesQ(
  Q,
  AOLArray,
  actions,
  B = []
) {
  // Weld states that action can be chosen from either the array of actions
  // or the AOLArray, but does not give any guidance as to how the action
  // should be selected. I'm going for a super naive, actions array-first approach
  /** @type {Array<Map<PropertyKey, Map<PropertyKey, Array>>>} */
  let allActions = actions.concat(AOLArray);

  for (let aAdd of allActions) {
    // The choice of aAdd must consider all new & existing actions, such that
    // one of aAdd's effects unifies with the goal given the plan's codesignation constraints
    for (let effect of aAdd.effects) {
      // If an effect matches the `action` Q, that means we have a match, and can perform
      // MGU to ensure we have a matching set of arguments/parameters
      let unifiers, newBindingConstraints;
      if (Q.action === effect.action && Q.operation === effect.operation) {
        try {
          unifiers = MGU(Q, effect, B, A);
          newBindingConstraints = createBindingConstraint(unifiers);

          // the action needs to be returned to add to A
          // newConstraints need to be returned to be added to B
          return aAdd, newBindingConstraints;
        } catch (error) {
          // If MGU doesn't work, we should break out of the action, and into the next one
          // TODO: I don't know if this will work
          console.log(error);

          break;
        }
      } else {
        continue;
      }
    }
    // If there is no action that can satisfy Q in either array, we return a failure
    throw Error("no action matches Q, failure");
  }
};

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
// { action: 'eq' | 'noteq', }
//

/**
 * The main function. This is built based off of me reading through `An Introduction to Least Commitment Planning`by Daniel Weld.
 * @param {Map<PropertyKey, Array>} plan An object consisting of a number of vectors for each portion of a partially ordered plan. Includes actions, orderingConstraints, causalLinks, and variableBindings
 * @param {any} agenda
 * @returns {Map<PropertyKey, Array>} A complete ordered plan
 */
function POP(plan, agenda) {
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
  let variableBindings;

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
    let aAdd,
      newBindingConstraints = chooseAction(q, plan, actions);

    // Creating new inputs (iPrime) which will be called recursively in 6 below
    let linksPrime = updateCausalLinks(plan.links, aAdd);
    let orderConstrPrime = updateOrderingConstraints(aAdd, aNeed, plan);
    let actionsPrime = plan.actions.concat(aAdd);
    // TODO: I need to create more bindings here as well

    // 4. Update the goal set
    let agendaPrime = agenda.splice(0, 1);

    // If aAdd is newly instantiated, then for each conjunct Qi, of its precondition,
    // add <Qi, aAdd> to the agenda
    // In other words, if aAdd.name is not in plan, we add each of
    // its preconditions to the agenda
    if (plan.actions.find((x) => x.name === aAdd.name) === null) {
      // This is deterministic (as long as the order of preconditions doesn't change)
      // but this is another thing that could possibly be ordered explicitly
      agendaPrime.push(aAdd.preconditions);
    }

    // 5. causal link protection
    orderConstrPrime = checkForThreats(aAdd, orderConstrPrime, linksPrime);

    // 6. recursive invocation
    POP(
      {
        actions: actionsPrime,
        order: orderConstrPrime,
        links: linksPrime,
        variableBindings: variableBindings,
      },
      agendaPrime
    );
  }
}
