"use strict";
exports.__esModule = true;
exports.newMGU = void 0;
var random_1 = require("../shared-libs/random");
var combinations_1 = require("../shared-libs/combinations");
var permutations_1 = require("../shared-libs/permutations");
// My attempt at a better MGU if I startepile from scratch
// Right now, this incorporates the idea of "objects", which I sourced from Kory Becker's strips.js
// In my study of Weld's POCL so far, there isn't a concept like this
var newMGU = function newFindMostGenerialUnifier(Q, R, variableBindings, objects) {
    var functionizeBindings = function (bindings) {
        var funcs = [];
        if (bindings) {
            var _loop_1 = function (binding) {
                // We test to see if the bindingConstraint is there, or if it's undefined
                // it will be undefined if there are no binding constraints for a param
                if (binding.equal) {
                    funcs.push(function (param) { return param === binding.assignee; });
                }
                else {
                    funcs.push(function (param) { return param !== binding.assignee; });
                }
            };
            for (var _i = 0, bindings_1 = bindings; _i < bindings_1.length; _i++) {
                var binding = bindings_1[_i];
                _loop_1(binding);
            }
        }
        else {
            // if the binding is undefined, we can return a fn that is always true
            funcs.push(function () { return true; });
        }
        return funcs;
    };
    var mapPermutationOnBindings = function (permutation, funcBindings) {
        var verdicts = [];
        var _loop_2 = function (i) {
            var results = funcBindings[i].map(function (x) { return x(permutation[i]); });
            var verdict = results.reduce(function (p, c) { return (c ? p : false); });
            verdicts.push(verdict);
        };
        for (var i = 0; i < permutation.length; i++) {
            _loop_2(i);
        }
        return verdicts.reduce(function (p, c) { return (c ? p : false); });
    };
    var createUnifiers = function (permutation, Q, R) {
        var unifiers = new Set();
        for (var i = 0; i < Q.parameters.length; i++) {
            unifiers.add(new Map([[Q.parameters[i], permutation[i]]]));
            unifiers.add(new Map([[R.parameters[i], permutation[i]]]));
        }
        return Array.from(unifiers);
    };
    //////////////////
    // Function begin
    //////////////////
    var boundQParams = [];
    var boundRParams = [];
    for (var i = 0; i < Q.parameters.length; i++) {
        boundQParams.push(variableBindings.get(Q.parameters[i]));
        boundRParams.push(variableBindings.get(R.parameters[i]));
    }
    var qFuncs = boundQParams.map(function (x) { return functionizeBindings(x); });
    var rFuncs = boundRParams.map(function (x) { return functionizeBindings(x); });
    var combinedFuncBindings = [];
    for (var i = 0; i < Q.parameters.length; i++) {
        combinedFuncBindings.push(qFuncs[i].concat(rFuncs[i]));
    }
    var justObjectVals = Array.from(objects, function (x) { return x.parameter; });
    var combinations = (0, combinations_1.kCombinations)(justObjectVals, combinedFuncBindings.length);
    var permutations = combinations.flatMap(function (x) { return (0, permutations_1.permute)(x); });
    var shuffledPermutations = (0, random_1.shuffleArray)(permutations);
    // we need to run permutations of objects through each "set" or index of bindings
    for (var _i = 0, shuffledPermutations_1 = shuffledPermutations; _i < shuffledPermutations_1.length; _i++) {
        var permutation = shuffledPermutations_1[_i];
        if (mapPermutationOnBindings(permutation, combinedFuncBindings)) {
            // add unifiers
            return createUnifiers(permutation, Q, R);
        }
    }
    throw Error("Unable to find parameter that satisfies constraints");
};
exports.newMGU = newMGU;
