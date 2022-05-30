import * as React from "react";

import { Actions } from "./components/Actions";
import { CausalLinks } from "./components/CausalLinks";
import { VarBindings } from "./components/VarBindings";
import { CommandBar } from "./components/CommandBar";

const addy = "http://localhost:8084/";
/**
 * An app that tours the Plan being generated as it's made. Allows a user to
 * increment a 'turn' at a time, or even greater 'step' introspection if necessary.
 * */
export default function App() {
  const [plan, setPlan] = React.useState(null);
  const refreshPlan = (e: Event) => {
    e.preventDefault();
    fetch(addy)
      .then((res) => res.json())
      .then((results) => setPlan(results));
  };

  const playPlan = (e: Event) => {
    e.preventDefault();
    fetch(addy + "play", { method: "POST" })
      .then((res) => res.json())
      .then((results) => setPlan(results));
  };

  const skipEndPlan = (e: Event) => {
    e.preventDefault();
    fetch(addy + "skip-end", { method: "POST" })
      .then((res) => res.json())
      .then((results) => setPlan(results));
  };

  const [content, setContent] = React.useState(null);
  const emptyLink = [{ createdBy: "", consumedBy: "", preposition: "" }];
  const emptyAction = [{ name: "" }];
  const emptyBindings = [["", [{ equal: true, assignor: "", assignee: "" }]]];
  React.useEffect(() => {
    if (plan) {
      setContent({ links: emptyLink, ...plan });
    }
  }, [plan]);

  return (
    <>
      <header className="plan-header">Plan View</header>
      <div className="c1">
        <header className="header">
          <h1>Causal Links</h1>
        </header>
        <CausalLinks links={content ? content.links : emptyLink} />
      </div>
      <div className="c2">
        <header className="header">
          <h1>Variable Bindings</h1>
        </header>
        <VarBindings
          bindings={content ? content.variableBindings : emptyBindings}
        />
      </div>
      <div className="c3">
        <header className="header">
          <h1>Actions</h1>
        </header>
        <Actions actions={content ? content.actions : emptyAction}></Actions>
      </div>
      <div className="c4">
        <header className="header">
          <h1>Status</h1>
        </header>
      </div>
      <CommandBar
        refreshOnClick={refreshPlan}
        playOnClick={playPlan}
        skipEndOnClick={skipEndPlan}
      />
    </>
  );
}
