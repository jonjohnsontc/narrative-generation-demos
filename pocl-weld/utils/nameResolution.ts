import {
  Action,
  CausalLink,
  OrderingConstraint,
  NewBindingMap,
  Agenda,
} from "../types";
import { createActionName, updateLiteral } from ".";

/**
 * Updates the actions, ordering constraints, and causal links in the plan,
 * once an action can be bound to additional domain parameters.
 * */
const resActionNameInPlan = function resolveActionNameInPlan(
  action: Action,
  bindings: NewBindingMap,
  actions: Action[],
  order: OrderingConstraint[],
  links: CausalLink[]
  // agenda: Agenda
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
};

export const resolvePlan = function resolveAllActionNamesInPlan(plan: {
  actions: Action[];
  order: OrderingConstraint[];
  links: CausalLink[];
  variableBindings: NewBindingMap;
}) {
  plan.actions.forEach((a) => {
    if (a.name === "init" || a.name === "goal") {
    } else {
      resActionNameInPlan(
        a,
        plan.variableBindings,
        plan.actions,
        plan.order,
        plan.links
      );
    }
  });
};

export default resolvePlan;
