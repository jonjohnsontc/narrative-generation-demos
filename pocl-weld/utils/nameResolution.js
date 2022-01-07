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
exports.resActionNameInPlan = void 0;
var _1 = require(".");
// TODO: When resolving the action name after selecting it to satisfy q
// we should also be resolving q, or the name of the action who's precondition
// is being satisfied.
/**
 * Updates the actions, ordering constraints, and causal links in the plan,
 * once an action can be bound to additional domain parameters.
 * */
var resActionNameInPlan = function resolveActionNameInPlan(action, bindings, actions, order, links, agenda) {
    var oldName = action.name;
    var newName = (0, _1.createActionName)(action, bindings);
    // Replace action with clone of action that has new name
    var idx = actions.findIndex(function (action) { return action.name === oldName; });
    var newAction = __assign(__assign({}, action), { name: newName });
    actions.splice(idx, 1, newAction);
    // Replace any causalLinks that contain the old action name
    links.forEach(function (link) {
        var change = false;
        if (link.createdBy === oldName) {
            link.createdBy = newName;
            change = true;
        }
        else if (link.consumedBy === oldName) {
            link.consumedBy = newName;
            change = true;
        }
        if (change) {
            link.preposition = (0, _1.updateLiteral)(link.preposition, action, bindings);
        }
    });
    // Replace any ordering constraints that contain the old action name
    order.forEach(function (orderCstr) {
        if (orderCstr.name === oldName) {
            orderCstr.name = newName;
        }
        else if (orderCstr.tail === oldName) {
            orderCstr.tail = newName;
        }
    });
    // Replace any agenda items that have old action name
    agenda.forEach(function (ai) {
        if (ai.aAdd === oldName) {
            ai.aAdd = newName;
            // TODO: Should I replace the bindings here too?
        }
    });
};
exports.resActionNameInPlan = resActionNameInPlan;
