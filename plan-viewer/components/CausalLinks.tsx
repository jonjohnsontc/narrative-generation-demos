import * as React from "react";

import type { CausalLink } from "../../pocl-weld/types";

type Props = {
  links: CausalLink[];
};

export function CausalLinks(props: Props) {
  return (
    <div className="panel">
      {props.links.map((link) => {
        const causalLinkKey = `${link.createdBy} -> ${link.preposition} <- ${link.consumedBy}`;
        return (
          <div key={causalLinkKey} className="causal-link">
            {causalLinkKey}
          </div>
        );
      })}
    </div>
  );
}
