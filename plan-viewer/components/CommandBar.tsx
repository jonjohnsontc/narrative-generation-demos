import * as React from "react";

type Props = {
  refreshOnClick: Function;
  playOnClick: Function;
  skipEndOnClick: Function;
};

export function CommandBar(props: Props) {
  return (
    <footer className="footer">
      <button
        className="cmd-btn left"
        type="button"
        onClick={(e) => props.refreshOnClick(e)}
      >
        <svg
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="refresh icon"
        >
          <use xlinkHref="./plan-viewer/public/bootstrap-icons.svg#arrow-clockwise" />
        </svg>
      </button>
      <button
        className="cmd-btn"
        type="button"
        onClick={(e) => props.playOnClick(e)}
      >
        <svg
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="play icon"
        >
          <use xlinkHref="./plan-viewer/public/bootstrap-icons.svg#play-fill" />
        </svg>
      </button>
      <button className="cmd-btn right" type="button">
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
