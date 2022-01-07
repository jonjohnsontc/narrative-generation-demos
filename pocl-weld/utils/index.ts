import { Action, Literal, NewBindingMap } from "../types";

export const createActionName = function createActionNameBasedOnParams(
  action: Action,
  variableBindings: NewBindingMap
): string {
  const replaceMap = genReplaceMap(action, variableBindings, false);
  const params = action.parameters;
  const boundParams = params.map((x) => replaceMap.get(x.parameter));
  let newName: string;

  // TODO: This is not generic, and will need to be outfit custom with each
  // domain/problem pair. There's probably a way to make this configurable with
  // domain/problem set (i.e., a domain could include a name template with each unbound action)
  if (action.name.includes("move")) {
    newName = `move ${boundParams[0]} from ${boundParams[1]} to ${boundParams[2]}`;
  } else {
    newName = `undefined behavior found!`;
  }
  return newName;
};

export let genReplaceMap = function replaceParameters(
  action: Action,
  variableBindings: NewBindingMap,
  domainKeys: boolean
): Map<string, string> {
  let replaceMap = new Map();
  let trueBindings = Array.from(variableBindings, ([name, value]) => {
    for (let binding of value) {
      if (binding.equal === true) {
        return binding;
      }
    }
  });
  let justTrueBindings = trueBindings.filter(Boolean);
  for (let param of action.parameters) {
    for (let index = 0; index < justTrueBindings.length; index++) {
      if (justTrueBindings[index].assignor === param.parameter) {
        if (domainKeys) {
          replaceMap.set(justTrueBindings[index].assignee, param.parameter);
        } else {
          replaceMap.set(param.parameter, justTrueBindings[index].assignee);
        }
        break;
      } else if (justTrueBindings[index].assignee === param.parameter) {
        if (domainKeys) {
          replaceMap.set(justTrueBindings[index].assignor, param.parameter);
        } else {
          replaceMap.set(param.parameter, justTrueBindings[index].assignor);
        }
        break;
      }
    }
  }
  return replaceMap;
};

export const updateLiteral = function (
  lit: Literal,
  action: Action,
  varBindings: NewBindingMap
): Literal {
  const replaceMap = genReplaceMap(action, varBindings, false);
  const newParameters = [];

  for (const param of lit.parameters) {
    replaceMap.get(param) === undefined
      ? newParameters.push(param)
      : newParameters.push(replaceMap.get(param));
  }

  return { ...lit, parameters: newParameters };
};
