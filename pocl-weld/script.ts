import parsed from "/Users/jonjohnson/dev/narrative-generation/shared-libs/parser/parser.cjs";
import { POP, Agenda } from "../pocl-weld";

const p = parsed;

const actions = p.weldProblem.states;
// init action needs to have effect property
actions[0].effect = actions[0].actions;
// goal action needs to have "precondition" property
actions[1].precondition = actions[1].actions;

const objects = p.weldProblem.objects;
const domain = p.weldDomain.actions;
const orderingConstraints = [{ name: "init", tail: "goal" }];
const causalLinks = [];
const agenda: Agenda = [];
for (let precond of actions[1].precondition) {
  agenda.push({
    q: precond,
    aAdd: "goal",
  });
}
const variableBindings = new Map([
  ["A", [{ equal: true, assignor: "A", assignee: "A" }]],
  ["B", [{ equal: true, assignor: "B", assignee: "B" }]],
  ["C", [{ equal: true, assignor: "C", assignee: "C" }]],
  ["table", [{ equal: true, assignor: "table", assignee: "table" }]],
]);
debugger;
export const result = POP(
  {
    actions: actions,
    order: orderingConstraints,
    links: causalLinks,
    variableBindings: variableBindings,
  },
  agenda,
  domain,
  objects,
  false
);

export { objects, domain, orderingConstraints, agenda, variableBindings };
