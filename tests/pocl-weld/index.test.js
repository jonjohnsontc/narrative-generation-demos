const pocl = require("/Users/jonjohnson/dev/narrative-generation/pocl-weld/index");
const parsed = require("/Users/jonjohnson/dev/narrative-generation/shared-libs/parser/parser");

// Opening state actions
const actions = parsed.blocksProblem.states[0].actions;

const expectedActors = ["a", "b", "c", "x"];
test("getParameters returns correct parameters", () => {
  expect(pocl.getParameters(actions)).toEqual(expectedActors);
});

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
  expect(pocl.createBindingConstraint("b", "C", true)).toEqual(
    expectedBindingConstraint
  );
});

const Q = { operation: "and", action: "on", parameters: ["C", "D"] };
const R = { operation: "and", action: "on", parameters: ["a1", "a2"] };
const bindings = [
  { equal: true, assignor: "a1", assignee: "C" },
  { equal: false, assignor: "a2", assignee: "C" },
  { equal: false, assignor: "a1", assignee: "a2"}
];
test("MGU returns most general unifier for move action successfully", () => {
  expect(pocl.MGU(Q, R, bindings)).toEqual(["C", "D"]);
});

const badQ = { operation: "and", action: "on", parameters: ["C", "C"] }
test("MGU throws error that most general unifier can't be found because of binding constraints", () => {
  expect(() => pocl.MGU(badQ, R, bindings)).toThrow();
})

const qrPairs = pocl.zip(R,badQ)
const qrMaps = qrPairs.map((x) => new Map().set(x[0], x[1]));
test("checkBindings returns false when bindings conflict with Q", () => {
  expect(pocl.checkBindings(bindings[2], qrPairs, qrMaps)).toBe(false);
})