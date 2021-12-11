const pocl = require("../../pocl-weld/index");
const parsed = require("../../shared-libs/parser/parser.cjs");
// Opening state actions
const actions = parsed.blocksProblem.states[0].actions;
const weldDomain = parsed.weldDomain;
const weldProblem = parsed.weldProblem;

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
const exampleAction = { ...parsed.blocksDomain.actions[0] };
test("isNew returns true when action is new", () => {
  expect(pocl.isNew(exampleAction)).toBe(true);
});

const expectedBindingConstraint = { equal: true, assignor: "b", assignee: "C" };
test("createBindingConstraint returns expected binding constraint", () => {
  let result = pocl.createBindingConstraint("b", "C", true);
  expect(result).toHaveProperty("bindingConstraint", expectedBindingConstraint);
  expect(result).toHaveProperty("key", "b");
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

const Q = { operation: "", action: "on", parameters: ["C", "D"] };
const R = { operation: "", action: "on", parameters: ["a1", "a2"] };
const bindings = [
  { equal: true, assignor: "a1", assignee: "C" },
  { equal: false, assignor: "a2", assignee: "C" },
  { equal: false, assignor: "a1", assignee: "a2" },
];

// TODO: checkBindings might still be necessary to keep around, but
// I'll probably need to adjust it
// const qrPairs = pocl.zip(R, badQ);
// const qrMaps = qrPairs.map((x) => new Map().set(x[0], x[1]));
// test("checkBindings returns false when bindings conflict with Q", () => {
//   expect(pocl.checkBindings(bindings[2], qrPairs, qrMaps)).toBe(false);
// });

const actionArray = parsed.blocksDomain.actions;
const expectedAction = parsed.blocksDomain.actions[0];
// TODO: chooseAction needs to be updated with newMGU before this will work
// test("chooseAction selects action which satisfies binding constraints", () => {
//   expect(pocl.chooseAction(Q, [], actionArray, [])).toStrictEqual({
//     action: { ...expectedAction, name: `${expectedAction.name} - b,t2` },
//     newBindingConstraints: [
//       {
//         bindingConstraint: { assignee: "C", assignor: "b", equal: true },
//         key: "b=C",
//       },
//       {
//         bindingConstraint: { assignee: "D", assignor: "t2", equal: true },
//         key: "t2=D",
//       },
//     ],
//   });
// });

const expectedUpdatedAction = {
  name: "move",
  parameters: [
    { parameter: "b-1", type: null },
    { parameter: "t1-1", type: null },
    { parameter: "t2-1", type: null },
  ],
  precondition: [
    { operation: "", action: "block", parameters: ["b-1"] },
    { operation: "", action: "table", parameters: ["t1-1"] },
    { operation: "", action: "table", parameters: ["t2-1"] },
    { operation: "", action: "on", parameters: ["b-1", "t1-1"] },
    { operation: "not", action: "on", parameters: ["b-1", "t2-1"] },
    { operation: "", action: "clear", parameters: ["b-1"] },
  ],
  effect: [
    { operation: "", action: "on", parameters: ["b-1", "t2-1"] },
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
    { operation: "", action: "block", parameters: ["b-1"] },
    { operation: "", action: "table", parameters: ["t1-1"] },
    { operation: "", action: "table", parameters: ["t2-1"] },
    { operation: "", action: "on", parameters: ["b-1", "t1-1"] },
    { operation: "not", action: "on", parameters: ["b-1", "t2-1"] },
    { operation: "", action: "clear", parameters: ["b-1"] },
    { operation: "", action: "neq", parameters: ["b-1", "t1-1"] },
    { operation: "", action: "neq", parameters: ["b-1", "t2-1"] },
  ],
};
const testActions = [...actionArray];
const bindConstraints = new Map([
  ["b-1", [{ equal: true, assignor: "b-1", assignee: "C" }]],
  ["t1-1", [{ equal: true, assignor: "t1-1", assignee: "B" }]],
  ["t2-1", [{ equal: true, assignor: "t2-1", assignee: "A" }]],
  ["A", [{ equal: true, assignor: "A", assignee: "A" }]],
  ["C", [{ equal: true, assignor: "C", assignee: "C" }]],
  ["D", [{ equal: true, assignor: "D", assignee: "D" }]],
]);
test("updateAgendaAndConstraints successfully updates agenda and constraints with properties of new action passed through", () => {
  pocl.updateAgendaAndConstraints(
    newAction,
    testActions,
    agenda,
    bindConstraints
  );
  // There should be two binding constraints added, the two "neq" actions above.
  let constr = bindConstraints.get("b-1");
  expect(constr).toEqual(expect.anything());
  expect(agenda).toHaveLength(9);
});

const testLit = { operation: "", action: "on", parameters: ["A", "B"] };
test("getOppositeLiteral correctly outputs opposite literal", () => {
  expect(pocl.getOppositeLiteral(testLit)).toEqual({
    operation: "not",
    action: "on",
    parameters: ["A", "B"],
  });
});

const testLit2 = { action: "on", operation: "", parameters: ["A", "B"] };
test("isLiteralEqual returns true when literals are equal", () => {
  expect(pocl.isLiteralEqual(testLit, testLit2)).toBe(true);
});

const initialOrdConstraints = [
  { name: "init", tail: "goal" },
  { name: "init", tail: "move - a,table" },
  { name: "move - a,table", tail: "goal" },
];
const threateningAction = {
  name: "move - b, c",
  parameters: [
    { parameter: "b-1", type: null },
    { parameter: "t1-1", type: null },
    { parameter: "t2-1", type: null },
  ],
  precondition: [
    { operation: "", action: "block", parameters: ["b-1"] },
    { operation: "", action: "table", parameters: ["t1-1"] },
    { operation: "", action: "table", parameters: ["t2-1"] },
    { operation: "", action: "on", parameters: ["b-1", "t1-1"] },
    { operation: "not", action: "on", parameters: ["b-1", "t2-1"] },
    { operation: "", action: "clear", parameters: ["b-1"] },
  ],
  effect: [
    { operation: "", action: "on", parameters: ["b-1", "t2-1"] },
    { operation: "not", action: "on", parameters: ["b-1", "t1-1"] },
  ],
};
const testBindings = new Map([
  ["b-1", [{ equal: true, assignor: "b-1", assignee: "A" }]],
  ["t2-1", [{ equal: true, assignor: "t2-1", assignee: "B" }]],
  ["t1-1", [{ equal: true, assignor: "t1-1", assignee: "C" }]],
]);
// TODO: There should be the following links:
//        - any actions already placed and their "aNeed"
//        - I think one should suffice for this first test
const initialLinks = [
  {
    createdBy: "move - a,table",
    consumedBy: "goal",
    preposition: { operation: "not", action: "on", parameters: ["A", "B"] },
  },
];
test("checkForThreats locates a potential threat given action passed, and creates ordering constraint to deal", () => {
  let result = pocl.checkForThreats(
    threateningAction,
    initialOrdConstraints,
    initialLinks,
    testBindings
  );
  expect(result).toHaveLength(4);
  expect(result.pop()).toEqual({ name: "move - b, c", tail: "move - a,table" });
});

test("updateBindingConstraints adds new constraints from 'chosen' action", () => {
  const exampleConstraints = testBindings;
  const newBindings = [
    {
      bindingConstraint: { equal: true, assignor: "b-2", assignee: "A" },
      key: "b2",
    },
    {
      bindingConstraint: { equal: true, assignor: "t2-2", assignee: "B" },
      key: "t2-2",
    },
    {
      bindingConstraint: { equal: true, assignor: "t1-2", assignee: "C" },
      key: "t1-2",
    },
  ];
  pocl.updateBindingConstraints(exampleConstraints, newBindings);

  // Resulting map should have size 6
  expect(exampleConstraints).toHaveProperty("size", 6);
});

test("updateCausalLinks concats a new CausalLink into the CausalLink array", () => {
  const exampleCausalLinks = [
    {
      createdBy: "move - b, c",
      consumedBy: "goal",
      preposition: { operation: "", action: "on", parameters: ["B", "C"] },
    },
  ];
  // We're just cloning the another action from above and givint it a new name
  // since updateCausalLinks doesn't touch any other part of the action
  const addedAction = { ...threateningAction, name: "move - a, b" };
  const addedQ = { operation: "", action: "on", parameters: ["A", "B"] };
  expect(
    pocl.updateCausalLinks(exampleCausalLinks, addedAction, addedQ, "goal")
  ).toHaveLength(2);
});

test("updateOrderingConstraints adds appropriate ordering constraints given action selected", () => {
  // I wanna test how it adds constraints given a new action, and given an action already taken

  // move - a,table already taken
  const ordConstraints = [...initialOrdConstraints];

  // updateOrderingConstraints only considers the name of an action
  const oldAction = { name: "move - a,table" };
  const newAction = { name: "move - b,c" };
  const actions = [
    { name: "move - a,table" },
    { name: "move - g,b" },
    { name: "init" },
    { name: "goal" },
  ];
  // TODO: Not sure if either of these scenarios are close to reality
  const newResult = pocl.updateOrderingConstraints(
    newAction,
    "goal",
    actions,
    ordConstraints
  );
  expect(newResult).toHaveLength(5);

  const oldResult = pocl.updateOrderingConstraints(
    oldAction,
    "move - g,b",
    actions,
    ordConstraints
  );
  expect(oldResult).toHaveLength(4);
});

// test("genReplaceMap returns a map with the parameter-domainParameter k,v pairs in the order specified", () => {
//   const action = weldDomain.actions[0];
//   const variableBindings = new Map([
//   ["b=A", { equal: true, assignor: "b", assignee: "A" }],
//   ["y=C", { equal: true, assignor: "y", assignee: "C" }],
//   ["b≠x", { equal: false, assignor: "b", assignee: "x" }]
//   ]);

//   const domainParameterResult = pocl.genReplaceMap(action, variableBindings, true);
//   const actionParameterResult = pocl.genReplaceMap(action, variableBindings, false);

//   // TODO: change expected results
//   expect(domainParameterResult).toEqual(new Map([["A", "b"], ["B", "x"],["C", "y"]]))
//   expect(actionParameterResult).toEqual(new Map([["b", "A"], ["x", "B"],["y", "C"]]));
// })

// test("POP successfully plans through partially ordered plan", () => {
//   const domain = parsed.weldDomain.actions;
//   const causalLinks = [];
//   const orderingConstraints = [{ name: "init", tail: "goal" }];

//   const actions = parsed.weldProblem.states;
//   // init action needs to have "effect" property
//   actions[0].effect = actions[0].actions;
//   // goal action needs to have "precondition" property
//   actions[1].precondition = actions[1].actions;

//   const variableBindings = new Map();
//   const agenda = [];
//   for (let precond of actions[1].precondition) {
//     agenda.push({
//       q: precond,
//       name: "goal",
//     });
//   }
//   const result = pocl.POP(
//     {
//       actions: actions,
//       order: orderingConstraints,
//       links: causalLinks,
//       variableBindings: variableBindings,
//     },
//     agenda,
//     domain
//   );

//   expect(result).toHaveLength();
// });
