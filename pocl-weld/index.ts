// Type Declarations
type VariableBinding = {
  equal: boolean;
  assignor: string;
  assignee: string;
};

type BindingMap = Map<PropertyKey, VariableBinding>;

type OrderingConstraint = {
  name: string;
  tail: string;
};

type Literal = {
  operation: string;
  action: string;
  parameters: readonly string[];
};

type Action = {
  name: string;
  parameters: readonly ActionParam[];
  precondition: readonly Literal[];
  effect: readonly Literal[];
};

// TODO: Right now, this represents the first and last state of the problem
type State = {
  name: string;
  actions: readonly Literal[];
};

type ActionParam = {
  parameter: string;
  type: string | null;
};

type AgendaItem = {
  q: Literal;
  name: string;
};

type Agenda = AgendaItem[];

type CausalLink = {
  createdBy: string; // action effect
  consumedBy: string; // action precondition

  // The preposition (or Q) needs to be a string representation of the effect/precondition
  // shared by the creator and consumer.
  preposition: Literal;
};
// I have this in cpopl/script.js as well
/**
 * Helper function meant to simulate a coin flip
 * @returns {Number} either 0 or 1
 */
let coinFlip = () => {
  return Math.floor(Math.random() * 2);
};

export let zip = (array1, array2) => {
  let pairs = [];
  for (let i = 0; i < array1.length; i++) {
    pairs.push([array1[i], array2[i]]);
  }
  return pairs;
};

export let isLiteralEqual = (lit1: Literal, lit2: Literal): boolean => {
  if (lit1.operation === lit2.operation && lit1.action === lit2.action) {
    for (let i = 0; i < lit1.parameters.length; i++) {
      if (lit1.parameters[i] !== lit2.parameters[i]) {
        return false;
      }
    }
    return true;
  } else {
    return false;
  }
};

/**
 * Updates action with new parameters to correspond to Weld on binding constraints
 * @param action An action whos parameters need to be updated
 * @returns An updated version of the passed through action with parameters + 1
 */
export let updateAction = function updateActionVariables(
  action: Action
): Action {
  let currentParams = action.parameters.map((x) => x.parameter);
  let updateParam = (param: string) => {
    if (param.includes("-")) {
      let [par, num] = param.split("-");
      return `${par}-${num + 1}`;
    } else {
      return `${param}-1`;
    }
  };
  let updateParams = (param: ActionParam) => {
    return {
      parameter: updateParam(param.parameter),
      type: param.type,
    };
  };
  let updateLiteral = (lit: Literal, refParams: readonly string[]) => {
    let newParams: string[] = [];
    for (let param of lit.parameters) {
      if (refParams.includes(param)) {
        newParams.push(updateParam(param));
      } else {
        newParams.push(param);
      }
    }
    return { ...lit, parameters: newParams };
  };
  let newParameters = action.parameters.map((x) => updateParams(x));
  let newPreconditions = action.precondition.map((x) =>
    updateLiteral(x, currentParams)
  );
  let newEffects = action.effect.map((x) => updateLiteral(x, currentParams));

  let updatedAction = {
    name: action.name,
    parameters: newParameters,
    precondition: newPreconditions,
    effect: newEffects,
  };

  return updatedAction;
};

export let replaceAction = function replaceActionWithNewVersion(
  domain: Action[],
  action: Action
): Action[] {
  let newDomain = domain.slice(1);
  newDomain.unshift(action);
  return newDomain;
};

// I was thinking about putting together some custom exception types like this
// Not using the Error object, which I'm not sure is good or bad: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/Error
export const NoUnifierException = (literal) => {
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
export const pairMatch = function doVectorPairsMatch(a, b) {
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

/**
 * Creates a binding constraint from the two params provided
 * @param assignor A parameter from an operator
 * @param assignee A parameter from an operator or param of Q
 * @param equal true if the params should be set to equal, false if not
 * @returns
 */
export let createBindingConstraint =
  function createBindingConstraintFromLiterals(
    assignor: string,
    assignee: string,
    equal: boolean
  ): { bindingConstraint: VariableBinding; key: string } {
    // Making sure the assignor is not capitalized
    if (assignor.charCodeAt(0) < 96) {
      throw Error("Invalid assignor");
    }

    let sign = equal ? "=" : "≠";
    let constraintString = `${assignor}${sign}${assignee}`;

    return {
      bindingConstraint: {
        equal: equal,

        // This isn't a construct of POP from Weld, rather something I did to try and more easily
        // differentiate constants from Q vs params from an operator
        assignor: assignor,
        assignee: assignee,
      },
      key: constraintString,
    };
  };

/**
 * Creates binding constraint from a unifier
 * @param {Map} unifier
 * @returns {any}
 */
export let createBindConstrFromUnifier =
  function createBindingConstraintFromUnifiers(unifier) {
    // we can unpack the unifier by calling entries and next, since it should only be one k,v pair
    let [assignor, assignee] = unifier.entries().next().value;

    // A binding contstraint from unifiers is always true, because unifiers are always equal
    return createBindingConstraint(assignor, assignee, true);
  };
/**
 * Pushes Literal and reference action (name) to the agenda passed through, mutating the agenda.
 * @param agenda
 * @param Q
 * @param name
 */
export let pushToAgenda = function addItemToAgenda(
  agenda: AgendaItem[],
  q: Literal,
  name: string
) {
  agenda.push({
    q: q,
    name: name,
  });
};
/**
 * Conditionally updates agenda and binding constraints if the action passed
 * through has not yet been added to the plan
 * */
export let updateAgendaAndContraints = function condUpdateAgendaAndConstraints(
  action: Action,
  actions: Action[],
  agenda: AgendaItem[],
  bindingConstraints: BindingMap
) {
  if (actions.find((x: Action) => x.name === action.name) !== undefined) {
    let nonCodeDesignationConstr = action.precondition.filter(
      (lit) => lit.action === "neq"
    );

    let newConstraints = nonCodeDesignationConstr.map((x) =>
      createBindingConstraint(x.parameters[0], x.parameters[1], false)
    );

    updateBindingConstraints(bindingConstraints, newConstraints);

    // This is deterministic (as long as the order of preconditions doesn't change)
    // but this is another thing that could possibly be ordered explicitly
    let codeDesignationConstr = action.precondition.filter(
      (lit) => lit.action !== "neq"
    );
    for (let constr of codeDesignationConstr) {
      pushToAgenda(agenda, constr, action.name);
    }
  }
};
export let checkBindings = function checkBindingsForConflict(
  binding,
  argumentPairs,
  argumentMaps
) {
  // If it's an equals binding, we need to make sure that the value within the binding linked to the
  // operator's parameter is resolvable to our chosen parameters
  if (binding.equal) {
    // If the assignee is capitalized, then we want to make sure that the variable it's set
    // equal to is the same as the variable tied to it in qPairs
    if (binding.assignee.charCodeAt(0) < 96) {
      let qBinding = argumentPairs.filter(
        (x) => x[0] === binding.assignee || x[1] === binding.assignee
      );
      // If the binding pair and the binding scenario are equal, then there is no coflict and we can return true
      // Otherwise we return false
      return pairMatch([binding.assignor, binding.assignee], qBinding[0]);
    } else {
      // to my knowledge, there shouldn't be equal bindings between variable names
      // if there is, I should figure out the right way to handle them
      throw Error(`Invalid Binding, ${binding}`);
    }
    // else binding is not equal (noncodesignation constraint)
  } else {
    if (binding.assignee.charCodeAt(0) < 96) {
      let qBinding = argumentPairs.filter(
        (x) => x[0] === binding.assignee || x[1] === binding.assignee
      );

      return !pairMatch([binding.assignor, binding.assignee], qBinding[0]);
      // If it's not a capital letter, then it must be some variable binding
      // (e.g., {equal: false,  assignor: 'p1',  assignee: 'p2'})
    } else {
      // If each of the binding variables is within argumentMaps, we'll look to see that the literals
      // they equal arent the same.
      // TODO: What do i do if it's a variable from something in A?
      // TODO: What if it's not in Q or R?
      let assignorKV =
        argumentMaps.filter((x) => x.get(binding.assignor) !== undefined)[0] ||
        new Map();
      let assigneeKV =
        argumentMaps.filter((x) => x.get(binding.assignee) !== undefined)[0] ||
        new Map();
      let assignorValue = assignorKV.get(binding.assignor);
      let assigneeValue = assigneeKV.get(binding.assignee);
      return assignorValue !== assigneeValue;
    }
  }
};
// TODO: Add doctsring
export let updateBindingConstraints = function condUpdateBindingConstraints(
  currentBindings: BindingMap,
  newBindings: Array<{ bindingConstraint: VariableBinding; key: string }>
) {
  for (let binding of newBindings) {
    if (currentBindings.has(binding.key) === false) {
      currentBindings.set(binding.key, binding.bindingConstraint);
    }
  }
};

/**
 * A function that returns the most general unifier of literals Q & R with respect to the codedesignation constraints in B.
 * So if Q has parameters: ['b', 'c'], and R has parameters: ['p1', 'p2'], and variable bindings are: [],
 * we would return: ['b', 'c']
 * @param {Literal} Q Literal - first portion of an agenda that needs to be satisfied
 * @param {Literal} R Literal - likely an effect of an action
 * @param {any} B Vector of (non)codedesignation constraints
 * @returns {any} Most general unifier of literals
 */
export let MGU = function findMostGenerialUnifier(Q, R, B) {
  // For the most general unifier, let's just assume Q's parameters
  /** @type {Array} */
  let QArgs = Q.parameters;

  // binding each parameter with each value
  let qPairs = zip(R.parameters, Q.parameters);

  // These are variable bindings as maps e.g., {b1: 'C'}
  let qMaps = qPairs.map((x) => new Map().set(x[0], x[1]));

  // If we have any bindings, we can evaluate them against Q and R's parameters
  if (B.length > 0) {
    for (let binding of B) {
      // If any binding parameters are equal to any of Q's or the effects parameters, we will evaluate
      // via `checkBindings`
      if (
        binding.assignee === QArgs[0] ||
        binding.assignee === QArgs[1] ||
        binding.assignee === R.parameters[0] ||
        binding.assignee === R.parameters[1] ||
        binding.assignor === QArgs[0] ||
        binding.assignor === QArgs[1] ||
        binding.assignor === R.parameters[0] ||
        binding.assignor === R.parameters[1]
      ) {
        if (checkBindings(binding, qPairs, qMaps)) {
          continue;
        } else {
          throw NoUnifierException(Q);
        }
      }
    }
  }
  return qMaps;
};

export let isNew = function isActionNew(action) {
  return action.parameters[0].parameter.charCodeAt(0) > 96;
};

/**
 * Given Q, selects an action from the set of AOLArray and actions.
 * @param Q
 * @param actions
 * @param domain
 * @returns An object containing an action, along with an array of binding constraints
 */
export let chooseAction = function findActionThatSatisfiesQ(
  Q: Literal,
  actions: Action[],
  domain: Action[],
  B: VariableBinding[] = []
) {
  // Weld states that action can be chosen from either the array of actions
  // or the AOLArray, but does not give any guidance as to how the action
  // should be selected. I'm going for a super naive, actions array-first approach
  let allActions = domain.concat(actions);

  for (let aAdd of allActions) {
    // The choice of aAdd must consider all new & existing actions, such that
    // one of aAdd's effects unifies with the goal given the plan's codesignation constraints
    for (let effect of aAdd.effect) {
      // If an effect matches the `action` Q, that means we have a match, and can perform
      // MGU to ensure we have a matching set of arguments/parameters
      if (Q.action === effect.action && Q.operation === effect.operation) {
        try {
          let unifiers = MGU(Q, effect, B);
          let newBindingConstraints = unifiers.map((x) =>
            createBindConstrFromUnifier(x)
          );
          let newName = `${aAdd.name} - ${effect.parameters}`;
          let aAddNewName = { ...aAdd, name: newName };

          // the action needs to be returned to add to A
          // newConstraints need to be returned to be added to B
          return {
            action: aAddNewName,
            newBindingConstraints: newBindingConstraints,
          };
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

// If aAdd is already in A, then let Oprime be all O's with aAdd before aNeed
// if aAdd is new, then let Oprime be all O's with aAdd after the start step (a0)
// and before the goal step (aInf)
export let updateOrderingConstraints = (
  aAdd: Action,
  aNeed: string,
  actions: Action[],
  orderingConstraints: OrderingConstraint[]
) => {
  let orderingConstraintPrime;
  if (actions.filter((x) => (x.name === aAdd.name)).length === 0) {
    // I don't *yet* know if ordering constraints are always 'lesser than' pairs (e.g, a < b)
    // but given that assumption we create another constraint with name as first step
    // and tail as the new action
    let newConstraints = [
      {
        name: "init",
        tail: aAdd.name,
      },
      {
        name: aAdd.name,
        tail: "goal",
      },
    ];
    orderingConstraintPrime = orderingConstraints.concat(newConstraints);
  } else {
    // if the action isn't new to the plan (AOLArray)
    let newConstraint = {
      name: aAdd.name,
      tail: aNeed,
    };
    orderingConstraintPrime = orderingConstraints.concat(newConstraint);
  }
  // I'm arbitrarily sorting by name here, so all the ordering constraints
  // will be grouped as such. I don't think this is important if my assumption
  // about ordering constraint construction with lesser than pairs (name < tail) is true
  return orderingConstraintPrime.sort((a, b) => a.name - b.name);
};
let createOrderingConstraint = (
  name: string,
  tail: string
): OrderingConstraint => {
  return {
    name: name,
    tail: tail,
  };
};

export let getOppositeLiteral = (lit: Literal) => {
  let opposite = lit.operation === "not" ? "" : "not";
  return { ...lit, operation: opposite };
};
/**
 * Checks for potential threats to the array of casual links based on the action chosen. If a threat exists,
 * a new ordering constraint should be created to mitigate.
 *
 * @param action
 * @param orderingConstraints
 * @param causalLinks
 * @param variableBindings
 * @returns
 */
export let checkForThreats = function checkForThreatsGivenConstraints(
  action: Action,
  orderingConstraints: OrderingConstraint[],
  causalLinks: CausalLink[],
  variableBindings: BindingMap
) {
  let replaceMap = new Map();
  let justBindings = Array.from(variableBindings, ([name, value]) => value);
  for (let param of action.parameters) {
    for (let index = 0; index < variableBindings.size; index++) {
      if (justBindings[index].assignor === param.parameter) {
        replaceMap.set(param.parameter, justBindings[index].assignee);
        break;
      } else if (justBindings[index].assignee === param.parameter) {
        replaceMap.set(param.parameter, justBindings[index].assignor);
        break;
      }
    }
  }
  // First, we need to bind the literal variable to the action's effect parameters
  // That way we can match a causal link with a threat just by comparing Literal objects
  // As far as I know, we only need to bind the effects to their variable counterpart
  let boundEffect = [];
  for (let effect of action.effect) {
    let newEffect = { ...effect, parameters: [] };
    for (let param of effect.parameters) {
      newEffect.parameters.push(replaceMap.get(param));
    }
    boundEffect.push(newEffect);
  }
  let boundAction = { ...action, effect: boundEffect };

  /**
   * Conditionally mutates/adds ordering constraints to current array of constraints,
   * respecting the rule `O = O' U {A0 < Aadd < AInf}`.
   *
   * If the link being threatenened is connected to the first action, then the new ordering
   * constraint is guaranteed to be occuring after the actions in the link. Otherwise,
   * whether the new constraint occurs before or after the link is up to chance
   * @param link
   * @param action
   * @param ordConstr
   */
  let condAddConstraints = (
    link: CausalLink,
    action: Action,
    ordConstr: OrderingConstraint[]
  ) => {
    if (link.createdBy === "init") {
      ordConstr.push(createOrderingConstraint(link.consumedBy, action.name));
    } else if (link.consumedBy === "goal") {
      ordConstr.push(createOrderingConstraint(action.name, link.createdBy));
    } else {
      if (coinFlip() === 0) {
        ordConstr.push(createOrderingConstraint(action.name, link.createdBy));
      } else {
        ordConstr.push(createOrderingConstraint(link.consumedBy, action.name));
      }
    }
  };
  // Within each causal link, we need to check to see if it's 'Q' matches the opposite
  // of any effects within the action we just added.
  let newOrderingConstraints = orderingConstraints.slice();
  for (let link of causalLinks) {
    // Because it's a single action, I don't know if it's possible to return more than
    // one result to potentialThreats
    let opEffect = getOppositeLiteral(link.preposition);
    let potentiaThreats = boundAction.effect.filter((x) =>
      isLiteralEqual(x, opEffect)
    );
    if (potentiaThreats.length !== 0) {
      // If there exists a threat from the action, we need to check the action to see if it's new
      if (
        orderingConstraints.filter((x) => x.name === action.name).length === 0
      ) {
        // If the `init` step is the creator of the causalLink, then we know that the
        // threat needs to be ordered after it, because nothing can be ordered prior
        // to that step
        condAddConstraints(link, action, newOrderingConstraints);
      } else {
        // If the action isn't new, we should check to see if
        // the action has already been ordered. If it has, we can
        // break out of the current loop, and go to the next potential threat
        let isAlreadyOrdered = newOrderingConstraints.filter((x) => {
          (x.name === action.name && x.tail === link.createdBy) ||
            (x.name === link.consumedBy && x.tail === action.name);
        });
        if (isAlreadyOrdered.length > 0) {
          break;
        } else {
          condAddConstraints(link, action, newOrderingConstraints);
        }
      }
    }
  }
  return newOrderingConstraints;
  // TODO: This should return failure if the threat still exists., ie the threat
  // is not ordered after the `consumedBy` or prior to the `createdBy` link
};
/**
 * Create a causal link
 * @param creator The Action that spawned
 * @param consumer
 * @returns
 */
export let createCausalLink = (
  creator: string,
  consumer: string,
  prep: Literal
): CausalLink => {
  return {
    createdBy: creator,
    consumedBy: consumer,
    // The preposition (or Q) needs to be a string representation of the effect/precondition
    // shared by the creator and consumer.
    preposition: prep,
  };
};

export let updateCausalLinks = (
  causalLinks: CausalLink[],
  action: Action,
  Q: Literal,
  aNeed: string
) => {
  let newCausalLink = createCausalLink(action.name, aNeed, Q);
  return causalLinks.concat(newCausalLink);
};
/**
 * The main function. This is built based off of me reading through `An Introduction to Least Commitment Planning`by Daniel Weld.
 * @param plan An object consisting of a number of vectors for each portion of a partially ordered plan. Includes actions, orderingConstraints, causalLinks, and variableBindings
 * @param agenda
 * @returns  A complete ordered plan
 */
export let POP = function PartialOrderPlan(plan, agenda, domain) {
  // We need to ensure that initial state contains no variable bindings, and all variables mentioned
  // in the effects of an operator be included in the preconditions of an operator.
  // - Turns out that this is baked into the sussman anamoly, and likely any other problem - It's a check that I could
  //   make when reading in a problem and domain/constructing the space

  // 1. If agenda is empty, and all preconditions and effects are covered, return <A, O, L>
  if (agenda.length === 0) {
    return plan;
  } else {
    // destructuring plan
    let { actions, order, links, variableBindings } = plan;

    // 2. Goal selection
    // we choose an item in the agenda. right now we're selecting the first item
    // but it doesn't need to be. It's destructured into Q which is a constant, and
    // `aNeed` which is the action that's precondition is Q
    let { q, aNeed } = agenda[0];

    // 3. Action selection
    // TODO: Where do I get domain from? Haven't come across a place in Weld
    let { action, newBindingConstraints } = chooseAction(
      q,
      actions,
      domain,
      variableBindings
    );

    // TODO: This whole group should be a conditional;
    // if the action is from the domain/has variables to replace
    let actionPrime = updateAction(action);
    let domainPrime = replaceAction(domain, actionPrime);
    let actionsPrime = actions.concat(action);

    // Creating new inputs (iPrime) which will be called recursively in 6 below
    let linksPrime = updateCausalLinks(links, action, q, aNeed);
    let orderConstrPrime = updateOrderingConstraints(action, aNeed, actions, order);

    // We mutate the original variableBindings, unlike all the other parts of the plan
    updateBindingConstraints(variableBindings, newBindingConstraints);

    // 4. Update the goal set
    let agendaPrime = agenda.slice(1);

    // This can potentially mutate both agendaPrime and variableBindings
    updateAgendaAndContraints(action, actions, agendaPrime, variableBindings);

    // 5. causal link protection
    orderConstrPrime = checkForThreats(
      action,
      orderConstrPrime,
      linksPrime,
      variableBindings
    );

    // 6. recursive invocation
    POP(
      {
        actions: actionsPrime,
        order: orderConstrPrime,
        links: linksPrime,
        variableBindings: variableBindings,
      },
      agendaPrime,
      domainPrime
    );
  }
}

// TODO: The null plan of any given problem should be the following. I should
// represent that somewhere to initially call POP()
//    · two actions (a0 and aInf)
//    · one ordering constraint (a0 to aInf)
//    · zero causal links and variable bindings/binding constraints
