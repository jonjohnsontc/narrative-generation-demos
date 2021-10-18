"use strict";
exports.__esModule = true;
exports.weldProblem = exports.weldDomain = exports.blocksProblem = exports.blocksDomain = void 0;
var pegjs_1 = require("pegjs");
var fs = require("fs");
// All of the following code has been taken, and possibly modified
// from strips.js (https://github.com/primaryobjects/strips)
/*
AI Planning with STRIPS and PDDL.
Copyright (c) 2018 Kory Becker
http://primaryobjects.com/kory-becker
License MIT
*/
// __dirname errors out as undefined 
var _grammarDomain = "/Users/jonjohnson/dev/narrative-generation/shared-libs/parser/grammar/grammar-domain.txt";
var _grammarProblem = "/Users/jonjohnson/dev/narrative-generation/shared-libs/parser/grammar/grammar-problem.txt";
// When I use `readFile`, the parser is returned as undefined. Must be using it wrong
var loadProblem = function (grammarFileName) {
    var grammar = fs.readFileSync(_grammarProblem, 'utf-8');
    var parser = pegjs_1.generate(grammar);
    var problem = fs.readFileSync(grammarFileName, 'utf-8');
    return parser.parse(problem);
};
var loadDomain = function (grammarFileName) {
    var grammar = fs.readFileSync(_grammarDomain, 'utf-8');
    var parser = pegjs_1.generate(grammar);
    var domain = fs.readFileSync(grammarFileName, 'utf-8');
    return parser.parse(domain);
};
// Sussman Anomaly 
exports.blocksDomain = loadDomain("strips/examples/blocksworld5/domain.txt");
exports.blocksProblem = loadProblem("strips/examples/blocksworld5/problem.txt");
exports.weldDomain = loadDomain("shared-libs/parser/problems/sussman-weld/domain.txt");
exports.weldProblem = loadProblem("shared-libs/parser/problems/sussman-weld/problem.txt");
