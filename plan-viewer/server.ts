import express = require("express");
import { POP } from "../pocl-weld";
import {
  objects,
  domain,
  orderingConstraints,
  agenda,
  variableBindings,
} from "../pocl-weld/script";

import type { POPParts } from "../pocl-weld/types";

const port = 8084;
const app = express();

app.use(express.json());

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
    orderingConstraints: orderingConstraints,
    agenda: agenda,
    variableBindings: Array.from(variableBindings),
  };
  res.append("Access-Control-Allow-Origin", "*");
  res.json(allObjects);
});

/**
 * Goes through one turn of POP()
 * */
app.post("/play", (req, res) => {
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
    false
  );
  res.append("Access-Control-Allow-Origin", "*");
  res.json(newState);
});

app.listen(port);
