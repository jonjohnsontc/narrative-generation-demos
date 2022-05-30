import * as React from "react";

import type { VariableBinding } from "../../pocl-weld/types";

type Props = {
  bindings: [string, VariableBinding[]][];
};

export function VarBindings(props: Props) {
  return (
    <div className="panel">
      {props.bindings.map((binding) => {
        const [key, objs] = binding;
        const equalBinding = objs
          .filter((binding) => binding.equal === true)
          .pop();

        const varBindingKey = `${equalBinding.assignor} = ${equalBinding.assignee}`;
        return (
          <div key={key} className="var-binding">
            {varBindingKey}
          </div>
        );
      })}
    </div>
  );
}
