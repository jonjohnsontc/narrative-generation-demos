"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.POP = exports.updateCausalLinks = exports.createCausalLink = exports.checkForThreats = exports.getOppositeLiteral = exports.updateOrderingConstraints = exports.chooseAction = exports.isNew = exports.MGU = exports.updateBindingConstraints = exports.checkBindings = exports.updateAgendaAndContraints = exports.pushToAgenda = exports.createBindConstrFromUnifier = exports.createBindingConstraint = exports.pairMatch = exports.NoUnifierException = exports.replaceAction = exports.updateAction = exports.isLiteralEqual = exports.zip = void 0;
// I have this in cpopl/script.js as well
/**
 * Helper function meant to simulate a coin flip
 * @returns {Number} either 0 or 1
 */
var coinFlip = function () {
    return Math.floor(Math.random() * 2);
};
var zip = function (array1, array2) {
    var pairs = [];
    for (var i = 0; i < array1.length; i++) {
        pairs.push([array1[i], array2[i]]);
    }
    return pairs;
};
exports.zip = zip;
var isLiteralEqual = function (lit1, lit2) {
    if (lit1.operation === lit2.operation && lit1.action === lit2.action) {
        for (var i = 0; i < lit1.parameters.length; i++) {
            if (lit1.parameters[i] !== lit2.parameters[i]) {
                return false;
            }
        }
        return true;
    }
    else {
        return false;
    }
};
exports.isLiteralEqual = isLiteralEqual;
/**
 * Updates action with new parameters to correspond to Weld on binding constraints
 * @param action An action whos parameters need to be updated
 * @returns An updated version of the passed through action with parameters + 1
 */
var updateAction = function updateActionVariables(action) {
    var currentParams = action.parameters.map(function (x) { return x.parameter; });
    var updateParam = function (param) {
        var _a;
        if (param.includes("-")) {
            var par = (_a = param.split("-"), _a[0]), num = _a[1];
            return par + "-" + (num + 1);
        }
        else {
            return param + "-1";
        }
    };
    var updateParams = function (param) {
        return {
            parameter: updateParam(param.parameter),
            type: param.type
        };
    };
    var updateLiteral = function (lit, refParams) {
        var newParams = [];
        for (var _i = 0, _a = lit.parameters; _i < _a.length; _i++) {
            var param = _a[_i];
            if (refParams.includes(param)) {
                newParams.push(updateParam(param));
            }
            else {
                newParams.push(param);
            }
        }
        return __assign(__assign({}, lit), { parameters: newParams });
    };
    var newParameters = action.parameters.map(function (x) { return updateParams(x); });
    var newPreconditions = action.precondition.map(function (x) {
        return updateLiteral(x, currentParams);
    });
    var newEffects = action.effect.map(function (x) { return updateLiteral(x, currentParams); });
    var updatedAction = {
        name: action.name,
        parameters: newParameters,
        precondition: newPreconditions,
        effect: newEffects
    };
    return updatedAction;
};
exports.updateAction = updateAction;
var replaceAction = function replaceActionWithNewVersion(domain, action) {
    var newDomain = domain.slice(1);
    newDomain.unshift(action);
    return newDomain;
};
exports.replaceAction = replaceAction;
// I was thinking about putting together some custom exception types like this
// Not using the Error object, which I'm not sure is good or bad: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/Error
var NoUnifierException = function (literal) {
    return {
        name: "NoUnifierException",
        msg: "_|_, No unifier found for " + literal
    };
};
exports.NoUnifierException = NoUnifierException;
/**
 * Returns true if the vector pair a matches the vector pair b
 * @param {Array} a
 * @param {Array} b
 * @returns {Boolean}
 */
var pairMatch = function doVectorPairsMatch(a, b) {
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
    }
    else {
        return false;
    }
};
exports.pairMatch = pairMatch;
/**
 * Creates a binding constraint from the two params provided
 * @param assignor A parameter from an operator
 * @param assignee A parameter from an operator or param of Q
 * @param equal true if the params should be set to equal, false if not
 * @returns
 */
var createBindingConstraint = function createBindingConstraintFromLiterals(assignor, assignee, equal) {
    // Making sure the assignor is not capitalized
    if (assignor.charCodeAt(0) < 96) {
        throw Error("Invalid assignor");
    }
    var sign = equal ? "=" : "≠";
    var constraintString = "" + assignor + sign + assignee;
    return {
        bindingConstraint: {
            equal: equal,
            // This isn't a construct of POP from Weld, rather something I did to try and more easily
            // differentiate constants from Q vs params from an operator
            assignor: assignor,
            assignee: assignee
        },
        key: constraintString
    };
};
exports.createBindingConstraint = createBindingConstraint;
/**
 * Creates binding constraint from a unifier
 * @param {Map} unifier
 * @returns {any}
 */
var createBindConstrFromUnifier = function createBindingConstraintFromUnifiers(unifier) {
    var _a;
    // we can unpack the unifier by calling entries and next, since it should only be one k,v pair
    var assignor = (_a = unifier.entries().next().value, _a[0]), assignee = _a[1];
    // A binding contstraint from unifiers is always true, because unifiers are always equal
    return (0, exports.createBindingConstraint)(assignor, assignee, true);
};
exports.createBindConstrFromUnifier = createBindConstrFromUnifier;
/**
 * Pushes Literal and reference action (name) to the agenda passed through, mutating the agenda.
 * @param agenda
 * @param Q
 * @param name
 */
var pushToAgenda = function addItemToAgenda(agenda, q, name) {
    agenda.push({
        q: q,
        name: name
    });
};
exports.pushToAgenda = pushToAgenda;
/**
 * Conditionally updates agenda and binding constraints if the action passed
 * through has not yet been added to the plan
 * */
var updateAgendaAndContraints = function condUpdateAgendaAndConstraints(action, actions, agenda, bindingConstraints) {
    if (actions.find(function (x) { return x.name === action.name; }) !== undefined) {
        var nonCodeDesignationConstr = action.precondition.filter(function (lit) { return lit.action === "neq"; });
        var newConstraints = nonCodeDesignationConstr.map(function (x) {
            return (0, exports.createBindingConstraint)(x.parameters[0], x.parameters[1], false);
        });
        (0, exports.updateBindingConstraints)(bindingConstraints, newConstraints);
        // This is deterministic (as long as the order of preconditions doesn't change)
        // but this is another thing that could possibly be ordered explicitly
        var codeDesignationConstr = action.precondition.filter(function (lit) { return lit.action !== "neq"; });
        for (var _i = 0, codeDesignationConstr_1 = codeDesignationConstr; _i < codeDesignationConstr_1.length; _i++) {
            var constr = codeDesignationConstr_1[_i];
            (0, exports.pushToAgenda)(agenda, constr, action.name);
        }
    }
};
exports.updateAgendaAndContraints = updateAgendaAndContraints;
var checkBindings = function checkBindingsForConflict(binding, argumentPairs, argumentMaps) {
    // If it's an equals binding, we need to make sure that the value within the binding linked to the
    // operator's parameter is resolvable to our chosen parameters
    if (binding.equal) {
        // If the assignee is capitalized, then we want to make sure that the variable it's set
        // equal to is the same as the variable tied to it in qPairs
        if (binding.assignee.charCodeAt(0) < 96) {
            var qBinding = argumentPairs.filter(function (x) { return x[0] === binding.assignee || x[1] === binding.assignee; });
            // If the binding pair and the binding scenario are equal, then there is no coflict and we can return true
            // Otherwise we return false
            return (0, exports.pairMatch)([binding.assignor, binding.assignee], qBinding[0]);
        }
        else {
            // to my knowledge, there shouldn't be equal bindings between variable names
            // if there is, I should figure out the right way to handle them
            throw Error("Invalid Binding, " + binding);
        }
        // else binding is not equal (noncodesignation constraint)
    }
    else {
        if (binding.assignee.charCodeAt(0) < 96) {
            var qBinding = argumentPairs.filter(function (x) { return x[0] === binding.assignee || x[1] === binding.assignee; });
            return !(0, exports.pairMatch)([binding.assignor, binding.assignee], qBinding[0]);
            // If it's not a capital letter, then it must be some variable binding
            // (e.g., {equal: false,  assignor: 'p1',  assignee: 'p2'})
        }
        else {
            // If each of the binding variables is within argumentMaps, we'll look to see that the literals
            // they equal arent the same.
            // TODO: What do i do if it's a variable from something in A?
            // TODO: What if it's not in Q or R?
            var assignorKV = argumentMaps.filter(function (x) { return x.get(binding.assignor) !== undefined; })[0] ||
                new Map();
            var assigneeKV = argumentMaps.filter(function (x) { return x.get(binding.assignee) !== undefined; })[0] ||
                new Map();
            var assignorValue = assignorKV.get(binding.assignor);
            var assigneeValue = assigneeKV.get(binding.assignee);
            return assignorValue !== assigneeValue;
        }
    }
};
exports.checkBindings = checkBindings;
// TODO: Add doctsring
var updateBindingConstraints = function condUpdateBindingConstraints(currentBindings, newBindings) {
    for (var _i = 0, newBindings_1 = newBindings; _i < newBindings_1.length; _i++) {
        var binding = newBindings_1[_i];
        if (currentBindings.has(binding.key) === false) {
            currentBindings.set(binding.key, binding.bindingConstraint);
        }
    }
};
exports.updateBindingConstraints = updateBindingConstraints;
/**
 * A function that returns the most general unifier of literals Q & R with respect to the codedesignation constraints in B.
 * So if Q has parameters: ['b', 'c'], and R has parameters: ['p1', 'p2'], and variable bindings are: [],
 * we would return: ['b', 'c']
 * @param {Literal} Q Literal - first portion of an agenda that needs to be satisfied
 * @param {Literal} R Literal - likely an effect of an action
 * @param {any} B Vector of (non)codedesignation constraints
 * @returns {any} Most general unifier of literals
 */
var MGU = function findMostGenerialUnifier(Q, R, B) {
    // For the most general unifier, let's just assume Q's parameters
    /** @type {Array} */
    var QArgs = Q.parameters;
    // binding each parameter with each value
    var qPairs = (0, exports.zip)(R.parameters, Q.parameters);
    // These are variable bindings as maps e.g., {b1: 'C'}
    var qMaps = qPairs.map(function (x) { return new Map().set(x[0], x[1]); });
    // If we have any bindings, we can evaluate them against Q and R's parameters
    if (B.length > 0) {
        for (var _i = 0, B_1 = B; _i < B_1.length; _i++) {
            var binding = B_1[_i];
            // If any binding parameters are equal to any of Q's or the effects parameters, we will evaluate
            // via `checkBindings`
            if (binding.assignee === QArgs[0] ||
                binding.assignee === QArgs[1] ||
                binding.assignee === R.parameters[0] ||
                binding.assignee === R.parameters[1] ||
                binding.assignor === QArgs[0] ||
                binding.assignor === QArgs[1] ||
                binding.assignor === R.parameters[0] ||
                binding.assignor === R.parameters[1]) {
                if ((0, exports.checkBindings)(binding, qPairs, qMaps)) {
                    continue;
                }
                else {
                    throw (0, exports.NoUnifierException)(Q);
                }
            }
        }
    }
    return qMaps;
};
exports.MGU = MGU;
var isNew = function isActionNew(action) {
    return action.parameters[0].parameter.charCodeAt(0) > 96;
};
exports.isNew = isNew;
/**
 * Given Q, selects an action from the set of AOLArray and actions.
 * @param Q
 * @param actions
 * @param domain
 * @returns An object containing an action, along with an array of binding constraints
 */
var chooseAction = function findActionThatSatisfiesQ(Q, actions, domain, B) {
    if (B === void 0) { B = []; }
    // Weld states that action can be chosen from either the array of actions
    // or the AOLArray, but does not give any guidance as to how the action
    // should be selected. I'm going for a super naive, actions array-first approach
    var allActions = domain.concat(actions);
    for (var _i = 0, allActions_1 = allActions; _i < allActions_1.length; _i++) {
        var aAdd = allActions_1[_i];
        // The choice of aAdd must consider all new & existing actions, such that
        // one of aAdd's effects unifies with the goal given the plan's codesignation constraints
        for (var _a = 0, _b = aAdd.effect; _a < _b.length; _a++) {
            var effect = _b[_a];
            // If an effect matches the `action` Q, that means we have a match, and can perform
            // MGU to ensure we have a matching set of arguments/parameters
            if (Q.action === effect.action && Q.operation === effect.operation) {
                try {
                    var unifiers = (0, exports.MGU)(Q, effect, B);
                    var newBindingConstraints = unifiers.map(function (x) {
                        return (0, exports.createBindConstrFromUnifier)(x);
                    });
                    var newName = aAdd.name + " - " + effect.parameters;
                    var aAddNewName = __assign(__assign({}, aAdd), { name: newName });
                    // the action needs to be returned to add to A
                    // newConstraints need to be returned to be added to B
                    return {
                        action: aAddNewName,
                        newBindingConstraints: newBindingConstraints
                    };
                }
                catch (error) {
                    // If MGU doesn't work, we should break out of the action, and into the next one
                    // TODO: I don't know if this will work
                    console.log(error);
                    break;
                }
            }
            else {
                continue;
            }
        }
        // If there is no action that can satisfy Q in either array, we return a failure
        throw Error("no action matches Q, failure");
    }
};
exports.chooseAction = chooseAction;
// If aAdd is already in A, then let Oprime be all O's with aAdd before aNeed
// if aAdd is new, then let Oprime be all O's with aAdd after the start step (a0)
// and before the goal step (aInf)
var updateOrderingConstraints = function (aAdd, aNeed, actions, orderingConstraints) {
    var orderingConstraintPrime;
    if (actions.filter(function (x) { return (x.name === aAdd.name); }).length === 0) {
        // I don't *yet* know if ordering constraints are always 'lesser than' pairs (e.g, a < b)
        // but given that assumption we create another constraint with name as first step
        // and tail as the new action
        var newConstraints = [
            {
                name: "init",
                tail: aAdd.name
            },
            {
                name: aAdd.name,
                tail: "goal"
            },
        ];
        orderingConstraintPrime = orderingConstraints.concat(newConstraints);
    }
    else {
        // if the action isn't new to the plan (AOLArray)
        var newConstraint = {
            name: aAdd.name,
            tail: aNeed
        };
        orderingConstraintPrime = orderingConstraints.concat(newConstraint);
    }
    // I'm arbitrarily sorting by name here, so all the ordering constraints
    // will be grouped as such. I don't think this is important if my assumption
    // about ordering constraint construction with lesser than pairs (name < tail) is true
    return orderingConstraintPrime.sort(function (a, b) { return a.name - b.name; });
};
exports.updateOrderingConstraints = updateOrderingConstraints;
var createOrderingConstraint = function (name, tail) {
    return {
        name: name,
        tail: tail
    };
};
var getOppositeLiteral = function (lit) {
    var opposite = lit.operation === "not" ? "" : "not";
    return __assign(__assign({}, lit), { operation: opposite });
};
exports.getOppositeLiteral = getOppositeLiteral;
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
var checkForThreats = function checkForThreatsGivenConstraints(action, orderingConstraints, causalLinks, variableBindings) {
    var replaceMap = new Map();
    var justBindings = Array.from(variableBindings, function (_a) {
        var name = _a[0], value = _a[1];
        return value;
    });
    for (var _i = 0, _a = action.parameters; _i < _a.length; _i++) {
        var param = _a[_i];
        for (var index = 0; index < variableBindings.size; index++) {
            if (justBindings[index].assignor === param.parameter) {
                replaceMap.set(param.parameter, justBindings[index].assignee);
                break;
            }
            else if (justBindings[index].assignee === param.parameter) {
                replaceMap.set(param.parameter, justBindings[index].assignor);
                break;
            }
        }
    }
    // First, we need to bind the literal variable to the action's effect parameters
    // That way we can match a causal link with a threat just by comparing Literal objects
    // As far as I know, we only need to bind the effects to their variable counterpart
    var boundEffect = [];
    for (var _b = 0, _c = action.effect; _b < _c.length; _b++) {
        var effect = _c[_b];
        var newEffect = __assign(__assign({}, effect), { parameters: [] });
        for (var _d = 0, _e = effect.parameters; _d < _e.length; _d++) {
            var param = _e[_d];
            newEffect.parameters.push(replaceMap.get(param));
        }
        boundEffect.push(newEffect);
    }
    var boundAction = __assign(__assign({}, action), { effect: boundEffect });
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
    var condAddConstraints = function (link, action, ordConstr) {
        if (link.createdBy === "init") {
            ordConstr.push(createOrderingConstraint(link.consumedBy, action.name));
        }
        else if (link.consumedBy === "goal") {
            ordConstr.push(createOrderingConstraint(action.name, link.createdBy));
        }
        else {
            if (coinFlip() === 0) {
                ordConstr.push(createOrderingConstraint(action.name, link.createdBy));
            }
            else {
                ordConstr.push(createOrderingConstraint(link.consumedBy, action.name));
            }
        }
    };
    // Within each causal link, we need to check to see if it's 'Q' matches the opposite
    // of any effects within the action we just added.
    var newOrderingConstraints = orderingConstraints.slice();
    var _loop_1 = function (link) {
        // Because it's a single action, I don't know if it's possible to return more than
        // one result to potentialThreats
        var opEffect = (0, exports.getOppositeLiteral)(link.preposition);
        var potentiaThreats = boundAction.effect.filter(function (x) {
            return (0, exports.isLiteralEqual)(x, opEffect);
        });
        if (potentiaThreats.length !== 0) {
            // If there exists a threat from the action, we need to check the action to see if it's new
            if (orderingConstraints.filter(function (x) { return x.name === action.name; }).length === 0) {
                // If the `init` step is the creator of the causalLink, then we know that the
                // threat needs to be ordered after it, because nothing can be ordered prior
                // to that step
                condAddConstraints(link, action, newOrderingConstraints);
            }
            else {
                // If the action isn't new, we should check to see if
                // the action has already been ordered. If it has, we can
                // break out of the current loop, and go to the next potential threat
                var isAlreadyOrdered = newOrderingConstraints.filter(function (x) {
                    (x.name === action.name && x.tail === link.createdBy) ||
                        (x.name === link.consumedBy && x.tail === action.name);
                });
                if (isAlreadyOrdered.length > 0) {
                    return "break";
                }
                else {
                    condAddConstraints(link, action, newOrderingConstraints);
                }
            }
        }
    };
    for (var _f = 0, causalLinks_1 = causalLinks; _f < causalLinks_1.length; _f++) {
        var link = causalLinks_1[_f];
        var state_1 = _loop_1(link);
        if (state_1 === "break")
            break;
    }
    return newOrderingConstraints;
    // TODO: This should return failure if the threat still exists., ie the threat
    // is not ordered after the `consumedBy` or prior to the `createdBy` link
};
exports.checkForThreats = checkForThreats;
/**
 * Create a causal link
 * @param creator The Action that spawned
 * @param consumer
 * @returns
 */
var createCausalLink = function (creator, consumer, prep) {
    return {
        createdBy: creator,
        consumedBy: consumer,
        // The preposition (or Q) needs to be a string representation of the effect/precondition
        // shared by the creator and consumer.
        preposition: prep
    };
};
exports.createCausalLink = createCausalLink;
var updateCausalLinks = function (causalLinks, action, Q, aNeed) {
    var newCausalLink = (0, exports.createCausalLink)(action.name, aNeed, Q);
    return causalLinks.concat(newCausalLink);
};
exports.updateCausalLinks = updateCausalLinks;
/**
 * The main function. This is built based off of me reading through `An Introduction to Least Commitment Planning`by Daniel Weld.
 * @param plan An object consisting of a number of vectors for each portion of a partially ordered plan. Includes actions, orderingConstraints, causalLinks, and variableBindings
 * @param agenda
 * @returns  A complete ordered plan
 */
var POP = function PartialOrderPlan(plan, agenda, domain) {
    // We need to ensure that initial state contains no variable bindings, and all variables mentioned
    // in the effects of an operator be included in the preconditions of an operator.
    // - Turns out that this is baked into the sussman anamoly, and likely any other problem - It's a check that I could
    //   make when reading in a problem and domain/constructing the space
    var _a, _b;
    // 1. If agenda is empty, and all preconditions and effects are covered, return <A, O, L>
    if (agenda.length === 0) {
        return plan;
    }
    else {
        // destructuring plan
        var actions = plan.actions, order = plan.order, links = plan.links, variableBindings = plan.variableBindings;
        // 2. Goal selection
        // we choose an item in the agenda. right now we're selecting the first item
        // but it doesn't need to be. It's destructured into Q which is a constant, and
        // `aNeed` which is the action that's precondition is Q
        var q = (_a = agenda[0], _a.q), aNeed = _a.aNeed;
        // 3. Action selection
        // TODO: Where do I get domain from? Haven't come across a place in Weld
        var action = (_b = (0, exports.chooseAction)(q, actions, domain, variableBindings), _b.action), newBindingConstraints = _b.newBindingConstraints;
        // TODO: This whole group should be a conditional;
        // if the action is from the domain/has variables to replace
        var actionPrime = (0, exports.updateAction)(action);
        var domainPrime = (0, exports.replaceAction)(domain, actionPrime);
        var actionsPrime = actions.concat(action);
        // Creating new inputs (iPrime) which will be called recursively in 6 below
        var linksPrime = (0, exports.updateCausalLinks)(links, action, q, aNeed);
        var orderConstrPrime = (0, exports.updateOrderingConstraints)(action, aNeed, actions, order);
        // We mutate the original variableBindings, unlike all the other parts of the plan
        (0, exports.updateBindingConstraints)(variableBindings, newBindingConstraints);
        // 4. Update the goal set
        var agendaPrime = agenda.slice(1);
        // This can potentially mutate both agendaPrime and variableBindings
        (0, exports.updateAgendaAndContraints)(action, actions, agendaPrime, variableBindings);
        // 5. causal link protection
        orderConstrPrime = (0, exports.checkForThreats)(action, orderConstrPrime, linksPrime, variableBindings);
        // 6. recursive invocation
        (0, exports.POP)({
            actions: actionsPrime,
            order: orderConstrPrime,
            links: linksPrime,
            variableBindings: variableBindings
        }, agendaPrime, domainPrime);
    }
};
exports.POP = POP;
// TODO: The null plan of any given problem should be the following. I should
// represent that somewhere to initially call POP()
//    · two actions (a0 and aInf)
//    · one ordering constraint (a0 to aInf)
//    · zero causal links and variable bindings/binding constraints
