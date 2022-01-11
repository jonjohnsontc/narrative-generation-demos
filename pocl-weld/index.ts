// TODO: Seeing if this will work for bringing in the parser module
import { newMGU } from "./newMGU";
import { NewBindingMap } from "./types";
// import { resActionNameInPlan } from "./utils/nameResolution";
import resolvePlan from "./utils/nameResolution";
import * as fs from "fs";

// Type Declarations
export type VariableBinding = {
  equal: boolean;
  assignor: string;
  assignee: string;
};

export type BindingMap = Map<PropertyKey, VariableBinding>;

export type OrderingConstraint = {
  name: string;
  tail: string;
};

export type Literal = {
  operation: string;
  action: string;
  parameters: readonly string[];
};

export type Action = {
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

// TODO: I think this should have a `version: number` kv pair
export type ActionParam = {
  parameter: string;
  type: string | null;
};

export type AgendaItem = {
  q: Literal;
  aAdd: string;
};

export type Agenda = AgendaItem[];

export type CausalLink = {
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

// TODO: this should be tied to bound/domain parameters
export const createActionName = function createActionNameBasedOnParams(
  action: Action,
  variableBindings: NewBindingMap
): string {
  const replaceMap = genReplaceMap(action, variableBindings, false);
  const params = action.parameters;
  const boundParams = params.map((x) => replaceMap.get(x.parameter));
  let newName: string;
  if (action.name.includes("move")) {
    newName = `${action.name} ${boundParams[0]} from ${boundParams[1]} to ${boundParams[2]}`;
  } else {
    newName = `undefined behavior found!`;
  }
  return newName;
};

// TODO: In order to use this, I need to have the new link before updating all of the causal links
// Right now, new links are created and updated to the causal link array in the same function, so it's
// never returned. I could also add this to the `updateCausalLinks` function, but that feels too hidden
export const checkForNewLinkThreats = function verifyNoThreatsAgainstNewLink(
  actions: Action[],
  newLink: CausalLink,
  orderingConstraints: OrderingConstraint[]
) {
  const opLiteral = getOppositeLiteral(newLink.preposition);

  for (let action of actions) {
    if (action.hasOwnProperty("effect")) {
      if (
        action.effect.filter((x) => isLiteralEqual(x, opLiteral)).length > 0
      ) {
        // Should we do anything with the potential threats?
        // TODO: We need to add a constraint here
        condAddConstraints(newLink, action, orderingConstraints);
      }
    }
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
      return `${par}-${parseInt(num) + 1}`;
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
export const pairMatch = function doVectorPairsMatch(
  a: Array<string>,
  b: Array<string>
) {
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
    // if (assignor.charCodeAt(0) < 96) {
    //   throw Error("Invalid assignor");
    // }

    return {
      bindingConstraint: {
        equal: equal,

        // This isn't a construct of POP from Weld, rather something I did to try and more easily
        // differentiate constants from Q vs params from an operator
        assignor: assignor,
        assignee: assignee,
      },
      key: assignor,
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
    aAdd: name,
  });
};
/**
 * Conditionally updates agenda and binding constraints if the action passed
 * through has not yet been added to the plan
 * */
export let updateAgendaAndConstraints = function condUpdateAgendaAndConstraints(
  action: Action,
  actions: Action[],
  agenda: AgendaItem[],
  bindingConstraints: NewBindingMap
) {
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
  let replaceMap = genReplaceMap(action, bindingConstraints, false);
  for (let constr of codeDesignationConstr) {
    // TODO: Add some step to get the domain literals mapped to the selected action
    let constrWithDomainParams = { ...constr };
    let newParameters = [];
    for (let param of constr.parameters) {
      replaceMap.get(param) === undefined
        ? newParameters.push(param)
        : newParameters.push(replaceMap.get(param));
    }
    constrWithDomainParams.parameters = newParameters;
    pushToAgenda(agenda, constrWithDomainParams, action.name);
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
/**
 * Pushes new bindings to the Binding Map
 * @param currentBindings
 * @param newBindings
 */
export let updateBindingConstraints = function condUpdateBindingConstraints(
  currentBindings: NewBindingMap,
  newBindings: Array<{ bindingConstraint: VariableBinding; key: string }>
) {
  for (let binding of newBindings) {
    let currentConstraints = currentBindings.get(binding.key);

    if (currentConstraints === undefined) {
      let newConstraintArray = [binding.bindingConstraint];
      currentBindings.set(binding.key, newConstraintArray);
    } else {
      if (
        // we're checking to see if the constraint is already in the current set
        currentConstraints.filter(
          (x) =>
            x.assignor === binding.bindingConstraint.assignor &&
            x.equal === binding.bindingConstraint.equal
        ).length === 0
      ) {
        currentConstraints.push(binding.bindingConstraint);
      }
    }
  }
};

export let isNew = function isActionNew(action) {
  return action.parameters[0].parameter.charCodeAt(0) > 96;
};

/**
 * Checks ordering consistency between action selected and the action sourced from the agenda
 */
export const checkOrdConsistency = function checkOrderingConsistency(
  selectedAction: Action,
  aNeed: string,
  orderingConstraints: OrderingConstraint[]
) {
  const constrToCheck = orderingConstraints.filter((x) => x.name === aNeed);
  if (constrToCheck.length === 0) {
    return;
  } else {
    constrToCheck.forEach((constr) => {
      if (constr.tail === selectedAction.name) {
        throw Error("selected action is already ordered after Q");
      }
    });
  }
};

/**
 * Given Q, selects an action from the set of AOLArray and actions.
 * @param Q
 * @param actions
 * @param domain
 * @param B
 * @param objects
 * @returns An object containing an action, along with an array of binding constraints
 */
export let chooseAction = function findActionThatSatisfiesQ(
  Q: Literal,
  prevActionName: string,
  actions: Action[],
  domain: Action[],
  B: NewBindingMap,
  objects: ActionParam[],
  orderingConstraints: OrderingConstraint[]
) {
  const allActions = actions.concat(domain);
  // Weld states that action can be chosen from either the array of actions
  // or the AOLArray, but does not give any guidance as to how the action
  // should be selected. I'm going for a super naive, actions array-first approach
  for (let aAdd of allActions) {
    if (aAdd.hasOwnProperty("effect")) {
      // The choice of aAdd must consider all new & existing actions, such that
      // one of aAdd's effects unifies with the goal given the plan's codesignation constraints
      for (let effect of aAdd.effect) {
        // If an effect matches the `action` Q, that means we have a match, and can perform
        // MGU to ensure we have a matching set of arguments/parameters
        if (Q.action === effect.action && Q.operation === effect.operation) {
          try {
            // TODO: If I'm going to always bind the variables before they hit the agenda,
            // then I'm going to need to test which variables have been bound before they
            // hit this function
            checkOrdConsistency(aAdd, prevActionName, orderingConstraints);
            let unifiers = newMGU(Q, effect, B, objects);
            let newBindingConstraints = unifiers.map((x) =>
              createBindConstrFromUnifier(x)
            );
            // is the action new??
            let isNew: boolean;
            // TODO: I can't filter through all actions, because it contains actions from the domain
            if (actions.filter((x) => x.name === aAdd.name).length === 0) {
              isNew = true;
            } else {
              isNew = false;
            }
            // the action needs to be returned to add to A
            // newConstraints need to be returned to be added to B
            return {
              action: aAdd,
              isNew: isNew,
              newBindingConstraints: newBindingConstraints,
            };
          } catch (error) {
            // TODO: Should I record failures, to optimize somehow?
            // If MGU doesn't work, we should break out of the action, and into the next one
            break;
          }
        }
      }
    } else {
      continue;
    }
  }
  // If there is no action that can satisfy Q in either array, we return a failure
  throw Error("no action matches Q, failure");
};

// If aAdd is already in A, then let Oprime be all O's with aAdd before aNeed
// if aAdd is new, then let Oprime be all O's with aAdd after the start step (a0)
// and before the goal step (aInf)
export let updateOrderingConstraints = (
  aAdd: Action,
  aNeed: string,
  isNew: boolean,
  orderingConstraints: OrderingConstraint[]
) => {
  let orderingConstraintPrime;
  if (isNew) {
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
// TODOJON: This should be in a utils folder/module
export let genReplaceMap = function replaceParameters(
  action: Action,
  variableBindings: NewBindingMap,
  domainKeys: boolean
): Map<string, string> {
  let replaceMap = new Map();
  let trueBindings = Array.from(variableBindings, ([name, value]) => {
    for (let binding of value) {
      if (binding.equal === true) {
        return binding;
      }
    }
  });
  let justTrueBindings = trueBindings.filter(Boolean);
  for (let param of action.parameters) {
    for (let index = 0; index < justTrueBindings.length; index++) {
      if (justTrueBindings[index].assignor === param.parameter) {
        if (domainKeys) {
          replaceMap.set(justTrueBindings[index].assignee, param.parameter);
        } else {
          replaceMap.set(param.parameter, justTrueBindings[index].assignee);
        }
        break;
      } else if (justTrueBindings[index].assignee === param.parameter) {
        if (domainKeys) {
          replaceMap.set(justTrueBindings[index].assignor, param.parameter);
        } else {
          replaceMap.set(param.parameter, justTrueBindings[index].assignor);
        }
        break;
      }
    }
  }
  return replaceMap;
};
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
// TODO: This shouldn't add constraints that contradict previously applied ones, right?
export let condAddConstraints = (
  link: CausalLink,
  action: Action,
  ordConstr: OrderingConstraint[]
) => {
  if (link.createdBy === "init") {
    // If the `init` step is the creator of the causalLink, then we know that the
    // threat needs to be ordered after it, because nothing can be ordered prior
    // to that step
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
/**
 * Checks for potential threats to the array of casual links based on the action chosen. If a threat exists,
 * a new ordering constraint should be created to mitigate.
 *
 * @param action
 * @param orderingConstraints
 * @param causalLinks
 * @param variableBindings
 * @param isNew
 * @returns
 */
export let checkForThreats = function checkForThreatsGivenConstraints(
  action: Action,
  orderingConstraints: OrderingConstraint[],
  causalLinks: CausalLink[],
  variableBindings: NewBindingMap,
  isNew: boolean
) {
  let boundAction: Action;
  if (isNew) {
    let replaceMap = genReplaceMap(action, variableBindings, false);
    // First, we need to bind the literal variable to the action's effect parameters
    // That way we can match a ca usal link with a threat just by comparing Literal objects
    // As far as I know, we only need to bind the effects to their variable counterpart
    let boundEffect = [];
    for (let effect of action.effect) {
      let newEffect = { ...effect, parameters: [] };
      for (let param of effect.parameters) {
        newEffect.parameters.push(replaceMap.get(param));
      }
      boundEffect.push(newEffect);
    }
    boundAction = { ...action, effect: boundEffect };
  } else {
    boundAction = { ...action };
  }

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
      if (isNew) {
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
  // TODO: This should return failure if the threat still exists., ie the threat
  // is not ordered after the `consumedBy` or prior to the `createdBy` link
  return newOrderingConstraints;
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
export let POP = function PartialOrderPlan(
  plan: {
    actions: Action[];
    order: OrderingConstraint[];
    links: CausalLink[];
    variableBindings: NewBindingMap;
  },
  agenda: Agenda,
  domain: Action[],
  objects: ActionParam[]
) {
  // We need to ensure that initial state contains no variable bindings, and all variables mentioned
  // in the effects of an operator be included in the preconditions of an operator.
  // - Turns out that this is baked into the sussman anamoly, and likely any other problem - It's a check that I could
  //   make when reading in a problem and domain/constructing the space

  // 1. If agenda is empty, and all preconditions and effects are covered, return <A, O, L>
  // TODO: Changed to help debug since the agenda doesn't appear to be getting smaller
  if (agenda.length === 0) {
    console.log("Plan complete");
    resolvePlan(plan);
    const bindingObj = Object.fromEntries(plan.variableBindings);
    plan.variableBindings = bindingObj;
    const serializedPlan = JSON.stringify(plan);
    fs.writeFileSync("./plan.json", serializedPlan);
    return plan;
  } else {
    // destructuring plan
    let { actions, order, links, variableBindings } = plan;

    // 2. Goal selection
    // we choose an item in the agenda. right now we're selecting the first item
    // but it doesn't need to be. It's destructured into Q which is a constant, and
    // `aNeed` which is the action that's precondition is Q
    let { q, aAdd } = agenda[0];

    // removing the action that sourced q
    // TODO: I don't know yet if this is necessary + checkOrdConsistency during
    // chooseAction should also guard against this
    const filterActions = actions.filter((x) => x.name !== aAdd);

    // 3. Action selection
    // TODO: Where do I get domain from? Haven't come across a place in Weld
    let { action, isNew, newBindingConstraints } = chooseAction(
      q,
      aAdd,
      filterActions,
      domain,
      variableBindings,
      objects,
      order
    );
    debugger;
    // We mutate the original variableBindings, unlike all the other parts of the plan
    updateBindingConstraints(variableBindings, newBindingConstraints);

    let newName, aAddNewName;
    if (isNew) {
      newName = createActionName(action, variableBindings);
      aAddNewName = { ...action, name: newName };
      let actionPrime = updateAction(action);
      domain = replaceAction(domain, actionPrime);
      actions = actions.concat(aAddNewName);
      let newLink = createCausalLink(aAddNewName.name, aAdd, q);
      checkForNewLinkThreats(actions, newLink, order);
      links = links.concat(newLink);
      order = updateOrderingConstraints(aAddNewName, aAdd, isNew, order);
    } else {
      // If the action name was prev partially undefined, we resolve the name throughout the plan
      // if (action.name.includes("undefined")) {
      //   resActionNameInPlan(action, variableBindings, actions, order, links);
      // }

      let newLink = createCausalLink(action.name, aAdd, q);
      checkForNewLinkThreats(actions, newLink, order);
      links = links.concat(newLink);
      order = updateOrderingConstraints(action, aAdd, isNew, order);
    }

    // If the action tied to q was prev partially undefined, we resolve its name as well
    // if (aAdd.includes("undefined")) {
    //   const qAction = actions.filter((x) => x.name === aAdd).pop();
    //   resActionNameInPlan(qAction, variableBindings, actions, order, links);
    // }

    // 4. Update the goal set
    agenda = agenda.slice(1);

    // This can potentially mutate both agendaPrime and variableBindings
    if (isNew && aAddNewName) {
      updateAgendaAndConstraints(
        aAddNewName,
        actions,
        agenda,
        variableBindings
      );
    }

    // 5. causal link protection
    order = checkForThreats(action, order, links, variableBindings, isNew);

    // 6. recursive invocation
    POP(
      {
        actions: actions,
        order: order,
        links: links,
        variableBindings: variableBindings,
      },
      agenda,
      domain,
      objects
    );
  }
};
