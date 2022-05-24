import * as React from "react";

import { Actions } from "./components/Actions";

/**
 * An app that tours the Plan being generated as it's made. Allows a user to
 * increment a 'turn' at a time, or even greater 'step' introspection if necessary.
 * */
export default function App() {
  const actionsToUse = ["Init", "Move A from Table to B", "Goal"];
  return (
    <>
      <header className="plan-header">Plan View</header>
      <div className="content">
        <div className="sub-content">
          <header className="header">
            <h1>Causal Links</h1>
          </header>
        </div>
        <div className="sub-content">
          <header className="header">
            <h1>Actions</h1>
          </header>
          <Actions actions={actionsToUse}></Actions>
        </div>
        <div className="sub-content">
          <header className="header">
            <h1>Variable Bindings</h1>
          </header>
        </div>
      </div>
    </>
  );
}
