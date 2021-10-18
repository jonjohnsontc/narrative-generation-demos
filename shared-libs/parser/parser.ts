import {default as peg} from 'pegjs';
import * as fs from 'fs';
// All of the following code has been taken, and possibly modified
// from strips.js (https://github.com/primaryobjects/strips)
/*
AI Planning with STRIPS and PDDL.
Copyright (c) 2018 Kory Becker
http://primaryobjects.com/kory-becker
License MIT
*/
// __dirname errors out as undefined 
let _grammarDomain = "/Users/jonjohnson/dev/narrative-generation/shared-libs/parser/grammar/grammar-domain.txt";
let _grammarProblem = "/Users/jonjohnson/dev/narrative-generation/shared-libs/parser/grammar/grammar-problem.txt";

// When I use `readFile`, the parser is returned as undefined. Must be using it wrong
let loadProblem = (grammarFileName) => {
  let grammar = fs.readFileSync(_grammarProblem, 'utf-8');
  let parser = peg.generate(grammar);

  let problem = fs.readFileSync(grammarFileName, 'utf-8');
  return parser.parse(problem)
}

let loadDomain = (grammarFileName) => {
  let grammar = fs.readFileSync(_grammarDomain, 'utf-8');
  let parser = peg.generate(grammar);

  let domain = fs.readFileSync(grammarFileName, 'utf-8');
  return parser.parse(domain)
}

// Sussman Anomaly 
export const blocksDomain = loadDomain("strips/examples/blocksworld5/domain.txt");
export const blocksProblem = loadProblem("strips/examples/blocksworld5/problem.txt");
export const weldDomain = loadDomain("shared-libs/parser/problems/sussman-weld/domain.txt");
export const weldProblem = loadProblem("shared-libs/parser/problems/sussman-weld/problem.txt");