import * as React from "react";

export function CommandBar() {
  return (
    <footer className="footer">
      <button>
        <svg
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="refresh-button"
        >
          <use xlinkHref="./plan-viewer/public/bootstrap-icons.svg#arrow-clockwise" />{" "}
        </svg>
      </button>
      <button>
        <svg></svg>
      </button>
      <button>
        <svg></svg>
      </button>
    </footer>
  );
}
