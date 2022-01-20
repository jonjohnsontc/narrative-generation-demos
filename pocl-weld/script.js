"use strict";
exports.__esModule = true;
exports.result = void 0;
var parser_cjs_1 = require("/Users/jonjohnson/dev/narrative-generation/shared-libs/parser/parser.cjs");
var pocl_weld_1 = require("../pocl-weld");
var p = parser_cjs_1;
var actions = p.weldProblem.states;
// init action needs to have effect property
actions[0].effect = actions[0].actions;
// goal action needs to have "precondition" property
actions[1].precondition = actions[1].actions;
var objects = p.weldProblem.objects;
var domain = p.weldDomain.actions;
var orderingConstraints = [{ name: "init", tail: "goal" }];
var causalLinks = [];
var agenda = [];
for (var _i = 0, _a = actions[1].precondition; _i < _a.length; _i++) {
    var precond = _a[_i];
    agenda.push({
        q: precond,
        aAdd: "goal"
    });
}
var variableBindings = new Map([
    ["A", [{ equal: true, assignor: "A", assignee: "A" }]],
    ["B", [{ equal: true, assignor: "B", assignee: "B" }]],
    ["C", [{ equal: true, assignor: "C", assignee: "C" }]],
    ["table", [{ equal: true, assignor: "table", assignee: "table" }]],
]);
debugger;
exports.result = (0, pocl_weld_1.POP)({
    actions: actions,
    order: orderingConstraints,
    links: causalLinks,
    variableBindings: variableBindings
}, agenda, domain, objects);
