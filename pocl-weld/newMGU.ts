import { Literal, BindingMap, VariableBinding, ActionParam } from "./index";
import { shuffleArray } from "../shared-libs/random";
import { kCombinations } from "../shared-libs/combinations";
import { permute } from "../shared-libs/permutations";

// I think this new binding map will make it easier to quickly pull constraints for any
// consonant passed. Any given param, domain or action will be housed here. Domain params
// will just map to a binding equal to itself.
// TODO: I still need to figure out whether params will be cloned & reversed, so that there's
// a copy of the binding for each parameter involved
export type NewBindingMap = Map<string, VariableBinding[]>;

// My attempt at a better MGU if I startepile from scratch
// Right now, this incorporates the idea of "objects", which I sourced from Kory Becker's strips.js
// In my study of Weld's POCL so far, there isn't a concept like this
export const newMGU = function newFindMostGenerialUnifier(
  Q: Literal,
  R: Literal,
  variableBindings: NewBindingMap,
  objects: ActionParam[]
): Map<string, string>[] {
  
  const functionizeBindings = (
    bindings: Array<VariableBinding | undefined>,
    varBindings: NewBindingMap
  ): Function[] => {
    const funcs = [];
    // We test to see if the bindingConstraint is there, or if it's undefined
    // it will be undefined if there are no binding constraints for a param
    if (bindings) {
      for (const binding of bindings) {
        const assigneeResults = varBindings.get(binding.assignee)
        if (assigneeResults) {
          const trueBindings = assigneeResults.filter(x => x.equal === true);
          if (trueBindings.length > 0) {
            // There should only be one true binding
            const trueBinding = trueBindings.pop().assignee;
            if (binding.equal) {
              funcs.push((param) => param === trueBinding);
            } else {
              funcs.push((param) => param !== trueBinding);
            }            
          }
        }

        if (binding.equal) {
          funcs.push((param) => param === binding.assignee);
        } else {
          funcs.push((param) => param !== binding.assignee);
        }
      }
    } else {
      // if the binding is undefined, we can return a fn that is always true
      funcs.push(() => true);
    }
    return funcs;
  };

  const mapPermutationOnBindings = (
    permutation: string[],
    funcBindings: Function[][]
  ): boolean => {
    const verdicts = [];
    for (let i = 0; i < permutation.length; i++) {
      const results = funcBindings[i].map((x) => x(permutation[i]));
      const verdict = results.reduce((p, c) => (c ? p : false));
      verdicts.push(verdict);
    }
    return verdicts.reduce((p, c) => (c ? p : false));
  };

  const createUnifiers = (
    permutation: string[],
    Q: Literal,
    R: Literal
  ): Map<string, string>[] => {
    let unifiers: Set<Map<string, string>> = new Set();
    for (let i = 0; i < Q.parameters.length; i++) {
      unifiers.add(new Map([[Q.parameters[i], permutation[i]]]));
      unifiers.add(new Map([[R.parameters[i], permutation[i]]]));
    }
    return Array.from(unifiers);
  };
  //////////////////
  // Function begin
  //////////////////
  const boundQParams = [];
  const boundRParams = [];

  for (let i = 0; i < Q.parameters.length; i++) {
    boundQParams.push(variableBindings.get(Q.parameters[i]));
    boundRParams.push(variableBindings.get(R.parameters[i]));
  }

  const qFuncs = boundQParams.map((x) => functionizeBindings(x, variableBindings));
  const rFuncs = boundRParams.map((x) => functionizeBindings(x, variableBindings));

  const combinedFuncBindings = [];
  for (let i = 0; i < Q.parameters.length; i++) {
    combinedFuncBindings.push(qFuncs[i].concat(rFuncs[i]));
  }

  const justObjectVals = Array.from(objects, (x) => x.parameter);

  const combinations: string[][] = kCombinations(
    justObjectVals,
    combinedFuncBindings.length
  );
  const permutations = combinations.flatMap((x) => permute(x));
  const shuffledPermutations = shuffleArray(permutations);

  // we need to run permutations of objects through each "set" or index of bindings
  for (const permutation of shuffledPermutations) {
    if (mapPermutationOnBindings(permutation, combinedFuncBindings)) {
      // add unifiers
      return createUnifiers(permutation, Q, R);
    }
  }
  throw Error("Unable to find parameter that satisfies constraints");
};
