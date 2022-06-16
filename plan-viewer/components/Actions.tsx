import * as React from "react";

import type { Action } from "../../pocl-weld/types";

type Props = {
  // each action's name, should be pre-sorted
  actions: Action[];
};

/**
 * A listing of all actions that have been executed in a plan thus far.
 * */
export function Actions({ actions }: Props) {
  return (
    <div className="panel">
      <div className="inner-panel">
        <ul>
          {actions.map((action) => {
            return (
              <li key={action.name} className="action-listing">
                {action.name}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
