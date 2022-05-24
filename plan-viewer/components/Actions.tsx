import * as React from "react";

type Props = {
  // each action's name, should be pre-sorted
  actions: string[];
};

/**
 * A listing of all actions that have been executed in a plan thus far.
 * */
export function Actions({ actions }: Props) {
  return (
    <div className="actions-panel">
      <ul>
        {actions.map((name) => {
          return (
            <li key={name} className="action-listing">
              {name}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
