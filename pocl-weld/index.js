// Helper fn's are at the top, before POP. These are fn's that I haven't figured out if/how
// they're used in partial order planning (POP), but I find helpful to illustrate in code
/**
 * Create a causal link
 * @param {any} creator The Action that spawned
 * @param {any} consumer
 * @returns {any}
 */
let createCausalLink = (creator, consumer) => {
  return {
    createdBy: creator,
    consumedBy: consumer,
    // The preposition (or Q) needs to be a string representation of the effect/precondition
    // shared by the creator and consumer. With this, I'd like to pull the name of the action
    // objects in `lambduhActions`
    preposition: creator.action.name,
  };
};
// The main function. This is built based off of me reading through `An Introduction to Least Commitment Planning`
// by Daniel Weld.
function POP(actionOrderCausalLinkArray, agenda) {
  // Here are all of the possible actions.
  // TODO: Ideally, this is part of input from a user
  let lamduhActions = [
    {
      name: "doThing1",
      action: () => console.log("did thing 1"),
      preconditions: [],
      effect: () => console.log("that effect"),
    },
    {
      name: "doThing2",
      action: () => console.log("did thing 2"),
      preconditions: [],
      effect: () => console.log("this effect"),
    },
  ];

  let chooseAction = (Q, AOLArray, actions) => {
    // Weld states that action can be chosen from either the array of actions
    // or the AOLArray, but does not give any guidance as to how the action
    // should be selected. I'm going for a super naive, actions array-first approach
    for (let action of actions) {
      if (Q.value === action.effect()) {
        return action;
      }
    }
    for (let AOL of AOLArray) {
      if (Q.value === AOL.action.effect()) {
        return AOL.action;
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
    if (AOLArray.actions.find((x) => (x.name === aAdd.name) == null)) {
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
      let orderingConstraintPrime = AOLArray.order.concat(newConstraint);
    } else {
      // if the action isn't new to the plan (AOLArray)
      let newConstraint = {
        name: aAdd.name,
        tail: aNeed.name,
      };
      let orderingConstraintPrime = AOLArray.order.concat(newConstraint);
    }
    // I'm arbitrarily sorting by name here, so all the ordering constraints
    // will be grouped as such. I don't think this is important if my assumption
    // about ordering constraint construction with lesser than pairs (name < tail) is true
    return orderingConstraintPrime.sort((a, b) => a.name - b.name);
  };

  // 1. If agenda is empty return <A, O, L>
  if (agenda.length === 0) {
    return actionOrderCausalLinkArray;
  } else {
    // 2. Goal selection
    // we choose an item in the agenda. right now we're selecting the first item
    // but it doesn't need to be
    let { q, aNeed } = agenda[0];

    // 3. Action selection
    let aAdd = chooseAction(q, actionOrderCausalLinkArray, lamduhActions);

    // Creating new inputs (iPrime) which will be called recursively in 6 below
    let linksPrime = actionOrderCausalLinkArray.links.concat({});
    let orderConstrPrime = updateOrderingConstraints(
      aAdd,
      aNeed,
      actionOrderCausalLinkArray
    );
    let actionsPrime = actionOrderCausalLinkArray.actions.concat(aAdd);

    // 4. Update the goal set
    let agendaPrime = agenda.splice(0, 1);

    // If aAdd is newly instantiated, then for each conjunct Qi, of its precondition,
    // add <Qi, aAdd> to the agenda
    // In other words, if aAdd.name is not in actionOrderCausalLinkArray, we add each of
    // its preconditions to the agenda
    if (
      actionOrderCausalLinkArray.actions.find((x) => x.name === aAdd.name) ==
      null
    ) {
      // This is deterministic (as long as the order of .preconditions doesn't change)
      // but this is another thing that could possibly be ordered explicitly
      agendaPrime.push(aAdd.preconditions);
    }

    // 5. causal link protection

    // 6. recursive invocation
    POP(
      { actions: actionsPrime, order: orderConstrPrime, links: linksPrime },
      agendaPrime
    );
  }
}
