const pocl = require("/Users/jonjohnson/dev/narrative-generation/pocl-weld/index");
const parsed = require("/Users/jonjohnson/dev/narrative-generation/shared-libs/parser/parser");

// Opening state actions
const actions = parsed.blocksProblem.states[0].actions;

// Tests getParamet
const expectedActors = new Set(["a", "b", "c", "x"]);
test("retrieves actors from actions space, expected to be all actors in sample problem", () => {
  expect(pocl.getParameters(actions)).toEqual(expectedActors);
});
