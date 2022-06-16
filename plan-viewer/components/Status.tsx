import * as React from "react";

type Props = {
  msg: string;
};

export function Status(props: Props) {
  return (
    <div className="panel">
      <div className="inner-panel">
        <p>{props.msg}</p>
      </div>
    </div>
  );
}
