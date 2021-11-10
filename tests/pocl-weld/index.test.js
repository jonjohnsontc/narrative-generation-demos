const pocl = require("../../pocl-weld/index");
const parsed = require("../../shared-libs/parser/parser");
// Opening state actions
const actions = parsed.blocksProblem.states[0].actions;

//////////////////////////////////////
// Helper func's
//////////////////////////////////////
const testArr1 = ["a", "b"];
const testArr2 = ["b", "a"];
test("pairMatch returns true for flipped arrays", () => {
  expect(pocl.pairMatch(testArr1, testArr2)).toBe(true);
});

const array1 = ["a", "b", "c", "d", "e"];
const array2 = ["1", "2", "3", "4", "5"];
const expectedArray = [
  ["a", "1"],
  ["b", "2"],
  ["c", "3"],
  ["d", "4"],
  ["e", "5"],
];
test("zip properly zips together two arrays", () => {
  expect(pocl.zip(array1, array2)).toEqual(expectedArray);
});

//////////////////////////////////////
// Partial Order Planning (POP) func's
//////////////////////////////////////
const paramToBind = ["a", "b"];
const actionToEdit = { operation: "", action: "on", parameters: ["p1", "p2"] };
test("bindParams binds parameters to action", () => {
  expect(pocl.bindParams(actionToEdit, paramToBind)).toEqual({
    operation: "",
    action: "on",
    parameters: ["a", "b"],
  });
});

const exampleAction = { ...parsed.blocksDomain.actions[0] };
test("isNew returns true when action is new", () => {
  expect(pocl.isNew(exampleAction)).toBe(true);
});

const expectedBindingConstraint = { equal: true, assignor: "b", assignee: "C" };
test("createBindingConstraint returns expected binding constraint", () => {
  let result = pocl.createBindingConstraint("b", "C", true);
  expect(result).toHaveProperty("bindingConstraint", expectedBindingConstraint);
  expect(result).toHaveProperty("key", "b=C");
});

const expectedBindingConstraintFromUnifer = {
  equal: true,
  assignor: "a1",
  assignee: "C",
};
const unifier = new Map().set("a1", "C");
test("createBindConstrFromUnifier creates expected binding constraint from unifier", () => {
  expect(pocl.createBindConstrFromUnifier(unifier)).toHaveProperty(
    "bindingConstraint",
    expectedBindingConstraintFromUnifer
  );
});

const Q = { operation: "and", action: "on", parameters: ["C", "D"] };
const R = { operation: "and", action: "on", parameters: ["a1", "a2"] };
const bindings = [
  { equal: true, assignor: "a1", assignee: "C" },
  { equal: false, assignor: "a2", assignee: "C" },
  { equal: false, assignor: "a1", assignee: "a2" },
];
const expectedUnifiers = [new Map().set("a1", "C"), new Map().set("a2", "D")];
test("MGU returns most general unifier for move action successfully", () => {
  expect(pocl.MGU(Q, R, bindings)).toEqual(expectedUnifiers);
});

const badQ = { operation: "and", action: "on", parameters: ["C", "C"] };
test("MGU throws error that most general unifier can't be found because of binding constraints", () => {
  expect(() => pocl.MGU(badQ, R, bindings)).toThrow();
});

const qrPairs = pocl.zip(R, badQ);
const qrMaps = qrPairs.map((x) => new Map().set(x[0], x[1]));
test("checkBindings returns false when bindings conflict with Q", () => {
  expect(pocl.checkBindings(bindings[2], qrPairs, qrMaps)).toBe(false);
});

const actionArray = parsed.blocksDomain.actions;
const expectedAction = parsed.blocksDomain.actions[0];
test("chooseAction selects action which satisfies binding constraints", () => {
  expect(pocl.chooseAction(Q, [], actionArray, [])).toStrictEqual({
    action: { ...expectedAction, name: `${expectedAction.name} - b,t2` },
    newBindingConstraints: [
      {
        bindingConstraint: { assignee: "C", assignor: "b", equal: true },
        key: "b=C",
      },
      {
        bindingConstraint: { assignee: "D", assignor: "t2", equal: true },
        key: "t2=D",
      },
    ],
  });
});

const expectedUpdatedAction = {
  name: "move",
  parameters: [
    { parameter: "b-1", type: null },
    { parameter: "t1-1", type: null },
    { parameter: "t2-1", type: null },
  ],
  precondition: [
    { operation: "and", action: "block", parameters: ["b-1"] },
    { operation: "", action: "table", parameters: ["t1-1"] },
    { operation: "", action: "table", parameters: ["t2-1"] },
    { operation: "", action: "on", parameters: ["b-1", "t1-1"] },
    { operation: "not", action: "on", parameters: ["b-1", "t2-1"] },
    { operation: "", action: "clear", parameters: ["b-1"] },
  ],
  effect: [
    { operation: "and", action: "on", parameters: ["b-1", "t2-1"] },
    { operation: "not", action: "on", parameters: ["b-1", "t1-1"] },
  ],
};
test("updateAction correctly updates action with new parameters and returns it", () => {
  expect(pocl.updateAction(exampleAction)).toEqual(expectedUpdatedAction);
});

test("replaceAction replaces action in domain with supplied one of the same name", () => {
  expect(pocl.replaceAction(actionArray, expectedUpdatedAction)).toContainEqual(
    expectedUpdatedAction
  );
  expect(pocl.replaceAction(actionArray, expectedUpdatedAction)).toHaveLength(
    5
  );
});

// goal state of blocksProblem1 will be our agenda
const agenda = parsed.blocksProblem.states[1].actions;
const newAction = {
  ...expectedUpdatedAction,
  precondition: [
    { operation: "and", action: "block", parameters: ["b-1"] },
    { operation: "", action: "table", parameters: ["t1-1"] },
    { operation: "", action: "table", parameters: ["t2-1"] },
    { operation: "", action: "on", parameters: ["b-1", "t1-1"] },
    { operation: "not", action: "on", parameters: ["b-1", "t2-1"] },
    { operation: "", action: "clear", parameters: ["b-1"] },
    { operation: "", action: "neq", parameters: ["b-1", "t-1"] },
    { operation: "", action: "neq", parameters: ["b-1", "t-2"] },
  ],
};
const testActions = [...actionArray];
const bindConstraints = new Map();
test("updateAgendaAndContraints successfully updates agenda and constraints with properties of new action passed through", () => {
  pocl.updateAgendaAndContraints(
    newAction,
    testActions,
    agenda,
    bindConstraints
  );
  // There should be two binding constraints added, the two "neq" actions above.
  expect(bindConstraints.get("b-1≠t-1")).toEqual(expect.anything());
  expect(bindConstraints.get("b-1≠t-2")).toEqual(expect.anything());
  expect(agenda).toHaveLength(9);
});

const someActionsWithVars = [...parsed.blocksDomain.actions];
const someStates = [...parsed.blocksProblem.states];

// TODO: This will need to change when I define specs for a plan
const fakePlanWithCoveredVars = {
  actions: someActionsWithVars.concat(someStates),
  order: "hey dude",
  links: "good stuff",
};
test("findParamDiff returns the difference in params between all variable actions", () => {
  expect(pocl.findParamDiff(fakePlanWithCoveredVars)).toEqual(new Set());
});
