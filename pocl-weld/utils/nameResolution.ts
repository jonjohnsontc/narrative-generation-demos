import {
  Action,
  CausalLink,
  OrderingConstraint,
  NewBindingMap,
  Agenda,
} from "../types";
import { createActionName, updateLiteral } from ".";

// TODO: When resolving the action name after selecting it to satisfy q
// we should also be resolving q, or the name of the action who's precondition
// is being satisfied.
/**
 * Updates the actions, ordering constraints, and causal links in the plan,
 * once an action can be bound to additional domain parameters.
 * */
export const resActionNameInPlan = function resolveActionNameInPlan(
  action: Action,
  bindings: NewBindingMap,
  actions: Action[],
  order: OrderingConstraint[],
  links: CausalLink[],
  agenda: Agenda
) {
  const oldName = action.name;
  const newName = createActionName(action, bindings);

  // Replace action with clone of action that has new name
  const idx = actions.findIndex((action) => action.name === oldName);
  const newAction = { ...action, name: newName };
  actions.splice(idx, 1, newAction);

  // Replace any causalLinks that contain the old action name
  links.forEach((link) => {
    let change = false;
    if (link.createdBy === oldName) {
      link.createdBy = newName;
      change = true;
    } else if (link.consumedBy === oldName) {
      link.consumedBy = newName;
      change = true;
    }
    if (change) {
      link.preposition = updateLiteral(link.preposition, action, bindings);
    }
  });

  // Replace any ordering constraints that contain the old action name
  order.forEach((orderCstr) => {
    if (orderCstr.name === oldName) {
      orderCstr.name = newName;
    } else if (orderCstr.tail === oldName) {
      orderCstr.tail = newName;
    }
  });

  // Replace any agenda items that have old action name
  agenda.forEach((ai) => {
    if (ai.aAdd === oldName) {
      ai.aAdd = newName;

      // TODO: Should I replace the bindings here too?
    }
  });
};
