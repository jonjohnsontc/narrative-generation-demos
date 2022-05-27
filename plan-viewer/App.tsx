import * as React from "react";

import { Actions } from "./components/Actions";
import { CommandBar } from "./components/CommandBar";

const addy = "http://localhost:8084/";
/**
 * An app that tours the Plan being generated as it's made. Allows a user to
 * increment a 'turn' at a time, or even greater 'step' introspection if necessary.
 * */
export default function App() {
  const [plan, setPlan] = React.useState(null);
  const refreshPlan = () =>
    React.useEffect(() => {
      fetch(addy)
        .then((res) => res.json())
        .then((results) => setPlan(results));
    });

  const playPlan = () => {
    React.useEffect(() => {
      fetch(addy + "play")
        .then((res) => res.json())
        .then((results) => setPlan(results));
    });
  };

  const skipEndPlan = () => {
    React.useEffect(() => {
      fetch(addy + "skip-end")
        .then((res) => res.json())
        .then((results) => setPlan(results));
    });
  };

  const actionsToUse = ["Init", "Move A from Table to B", "Goal"];

  return (
    <>
      <header className="plan-header">Plan View</header>
      <div className="c1">
        <header className="header">
          <h1>Causal Links</h1>
        </header>
      </div>
      <div className="c2">
        <header className="header">
          <h1>Variable Bindings</h1>
        </header>
      </div>
      <div className="c3">
        <header className="header">
          <h1>Actions</h1>
        </header>
        <Actions actions={actionsToUse}></Actions>
      </div>
      <div className="c4">
        <header className="header">
          <h1>Status</h1>
        </header>
      </div>
      <CommandBar
        refreshOnClick={refreshPlan}
        playOnClick={"hi"}
        skipEndOnClick={"hello"}
      />
    </>
  );
}
