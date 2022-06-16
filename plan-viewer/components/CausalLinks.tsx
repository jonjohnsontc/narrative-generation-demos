import * as React from "react";

import type { CausalLink } from "../../pocl-weld/types";

type Props = {
  links: CausalLink[];
};

export function CausalLinks(props: Props) {
  if (props.links.length > 0) {
    return (
      <div className="panel">
        <div className="inner-panel">
          {props.links.map((link) => {
            const prep = link.preposition;
            const preposition = `${prep.action} ${prep.operation} ${prep.parameters}`;
            const causalLinkKey = `${link.createdBy} -> ${preposition} <- ${link.consumedBy}`;

            return (
              <div key={causalLinkKey} className="causal-link">
                {causalLinkKey}
              </div>
            );
          })}
        </div>
      </div>
    );
  } else {
    return (
      <div className="panel">
        <div className="inner-panel">None</div>
      </div>
    );
  }
}
