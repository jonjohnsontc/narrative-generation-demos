import express = require("express");
import cors = require("cors");
import { POP } from "../pocl-weld";
import {
  objects,
  domain,
  orderingConstraints,
  agenda,
  variableBindings,
  actions,
} from "../pocl-weld/script";

import type { POPParts } from "../pocl-weld/types";

const port = 8084;
const app = express();

app.use(express.json(), cors());

/**
 * Routes
 * */

/**
 * Refreshes default state & returns it to user
 * */
app.get("/", (req, res) => {
  const allObjects = {
    objects: objects,
    domain: domain,
    order: orderingConstraints,
    agenda: agenda,
    actions: actions,
    variableBindings: Array.from(variableBindings),
    links: [],
  };
  res.json(allObjects);
});

/**
 * Goes through one turn of POP()
 * */
app.post("/play", (req, res) => {
  const curState: POPParts = req.body;
  const varBindings = new Map(curState.variableBindings);

  let newState;
  let newObjects;

  console.log("Actions", curState.actions);
  console.log("Order", curState.order);
  console.log("Links", curState.links);
  console.log("VBs", curState.variableBindings);

  try {
    newState = POP(
      {
        actions: curState.actions,
        order: curState.order,
        links: curState.links,
        variableBindings: varBindings,
      },
      curState.agenda,
      curState.domain,
      curState.objects,
      false
    );
  } catch (e) {
    newState = e;
    newObjects = {
      domain: curState.domain,
      order: curState.order,
      agenda: curState.agenda,
      variableBindings: Array.from(curState.variableBindings),
      actions: curState.actions,
      links: curState.links,
      error: e.message + "\n" + e.stack,
    };
  }

  // @ts-ignore for 'Object.hasOwn()'
  if (Object.hasOwn(newState, "actions")) {
    newObjects = {
      domain: newState.domain,
      order: newState.order,
      agenda: newState.agenda,
      actions: newState.actions,
      variableBindings: Array.from(newState.variableBindings),
      links: newState.links,
    };
  }

  res.json(newObjects);
});

/**
 * Runs all turns of POP()
 * */
app.post("/skip-end", (req, res) => {
  const curState: POPParts = req.body();
  const newState = POP(
    {
      actions: curState.actions,
      order: curState.order,
      links: curState.links,
      variableBindings: curState.variableBindings,
    },
    curState.agenda,
    curState.domain,
    curState.objects,
    true
  );
  res.json(newState);
});

app.listen(port);
