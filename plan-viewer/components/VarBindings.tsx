import * as React from "react";

import type { VariableBinding } from "../../pocl-weld/types";

type Props = {
  bindings: [string, VariableBinding[]][];
  includeSame: boolean; // TODO: Make this do something
};

export function VarBindings(props: Props) {
  return (
    <div className="panel">
      <div className="inner-panel">
        {Array.from(props.bindings).map((binding) => {
          const [key, objs] = binding;
          const equalBinding = objs
            .filter((binding) => binding.equal === true)
            .pop();
          let varBindingKey: string;
          if (equalBinding) {
            varBindingKey = `${equalBinding.assignor} = ${equalBinding.assignee}`;
          }
          return (
            <div key={key} className="var-binding">
              {varBindingKey}
            </div>
          );
        })}
      </div>
    </div>
  );
}
