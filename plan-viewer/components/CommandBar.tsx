import * as React from "react";

export function CommandBar() {
  return (
    <footer className="footer">
      <button className="cmd-btn">
        <svg
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="refresh icon"
        >
          <use xlinkHref="./plan-viewer/public/bootstrap-icons.svg#arrow-clockwise" />
        </svg>
      </button>
      <button className="cmd-btn">
        <svg
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="play icon"
        >
          <use xlinkHref="./plan-viewer/public/bootstrap-icons.svg#play-fill" />
        </svg>
      </button>
      <button className="cmd-btn">
        <svg
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="skip-end icon"
        >
          <use xlinkHref="./plan-viewer/public/bootstrap-icons.svg#skip-end-fill" />
        </svg>
      </button>
    </footer>
  );
}
