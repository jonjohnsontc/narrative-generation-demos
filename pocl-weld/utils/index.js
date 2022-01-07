"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.updateLiteral = exports.genReplaceMap = exports.createActionName = void 0;
var createActionName = function createActionNameBasedOnParams(action, variableBindings) {
    var replaceMap = (0, exports.genReplaceMap)(action, variableBindings, false);
    var params = action.parameters;
    var boundParams = params.map(function (x) { return replaceMap.get(x.parameter); });
    var newName;
    // TODO: This is not generic, and will need to be outfit custom with each
    // domain/problem pair. There's probably a way to make this configurable with
    // domain/problem set (i.e., a domain could include a name template with each unbound action)
    if (action.name.includes("move")) {
        newName = "move " + boundParams[0] + " from " + boundParams[1] + " to " + boundParams[2];
    }
    else {
        newName = "undefined behavior found!";
    }
    return newName;
};
exports.createActionName = createActionName;
var genReplaceMap = function replaceParameters(action, variableBindings, domainKeys) {
    var replaceMap = new Map();
    var trueBindings = Array.from(variableBindings, function (_a) {
        var name = _a[0], value = _a[1];
        for (var _i = 0, value_1 = value; _i < value_1.length; _i++) {
            var binding = value_1[_i];
            if (binding.equal === true) {
                return binding;
            }
        }
    });
    var justTrueBindings = trueBindings.filter(Boolean);
    for (var _i = 0, _a = action.parameters; _i < _a.length; _i++) {
        var param = _a[_i];
        for (var index = 0; index < justTrueBindings.length; index++) {
            if (justTrueBindings[index].assignor === param.parameter) {
                if (domainKeys) {
                    replaceMap.set(justTrueBindings[index].assignee, param.parameter);
                }
                else {
                    replaceMap.set(param.parameter, justTrueBindings[index].assignee);
                }
                break;
            }
            else if (justTrueBindings[index].assignee === param.parameter) {
                if (domainKeys) {
                    replaceMap.set(justTrueBindings[index].assignor, param.parameter);
                }
                else {
                    replaceMap.set(param.parameter, justTrueBindings[index].assignor);
                }
                break;
            }
        }
    }
    return replaceMap;
};
exports.genReplaceMap = genReplaceMap;
var updateLiteral = function (lit, action, varBindings) {
    var replaceMap = (0, exports.genReplaceMap)(action, varBindings, false);
    var newParameters = [];
    for (var _i = 0, _a = lit.parameters; _i < _a.length; _i++) {
        var param = _a[_i];
        replaceMap.get(param) === undefined
            ? newParameters.push(param)
            : newParameters.push(replaceMap.get(param));
    }
    return __assign(__assign({}, lit), { parameters: newParameters });
};
exports.updateLiteral = updateLiteral;
