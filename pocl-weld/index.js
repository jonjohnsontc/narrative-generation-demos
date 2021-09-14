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
    // shared by the creator and consumer
    preposition: creator.action.toString(),
  };
};
// The main function. This is built based off of me reading through `An Introduction to Least Commitment Planning`
// by Daniel Weld.
function POP(actionOrderCausalLinkArray, agenda) {
  // Here are all of the possible actions.
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


    let linksPrime = actionOrderCausalLinkArray.links.concat({});
    let orderConstrPrime =
      actionOrderCausalLinkArray.orderingConstraints.concat();
    let actionsPrime = actionOrderCausalLinkArray.actions.concat(aAdd);

    // 4. Update the goal set
    let agendaPrime = agenda.splice(0, 1);

    // If aAdd is newly instantiated, then for each conjunct Qi, of its precondition,
    // add <Qi, aAdd> to the agenda
    // In other words, if aAdd.name is not in actionOrderCausalLinkArray, we add it and
    // q to the agenda
    // TODO: I have no idea if I'm doing this right - in general it smells weird
    if (
      actionOrderCausalLinkArray.actions.find((x) => x.name === aAdd.name) ===
      null
    ) {
      agendaPrime.concat({ q, aAdd });
    }

    // 5. causal link protection
    // 6. recursive invocation
    POP({actions: actionsPrime, order: orderConstrPrime, links: linksPrime}, agendaPrime);
  }
}
