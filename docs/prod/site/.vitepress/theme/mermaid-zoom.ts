import Panzoom from "@panzoom/panzoom";

const MARK = "data-mermaid-zoom";

type PanzoomInstance = ReturnType<typeof Panzoom>;

const options = {
  maxScale: 6,
  minScale: 0.25,
  contain: "inside" as const,
  canvas: true,
  cursor: "grab",
};

const padSvgViewBox = (node: SVGSVGElement, pad: number): void => {
  const box = node.viewBox.baseVal;
  if (box.width === 0 || box.height === 0) {
    return;
  }
  node.setAttribute(
    "viewBox",
    `${box.x - pad} ${box.y - pad} ${box.width + pad * 2} ${box.height + pad * 2}`,
  );
};

const bind = (host: HTMLElement): void => {
  if (host.getAttribute(MARK) === "1") {
    return;
  }
  const firstSvg = host.querySelector("svg");
  if (firstSvg === null) {
    return;
  }

  host.setAttribute(MARK, "1");

  const shell = document.createElement("div");
  shell.className = "mermaid-zoom";
  const view = document.createElement("div");
  view.className = "mermaid-zoom__view";
  const parent = host.parentNode;
  if (parent === null) {
    return;
  }
  parent.insertBefore(shell, host);
  view.appendChild(host);
  shell.appendChild(view);

  let svg = firstSvg as unknown as HTMLElement;
  svg.style.maxWidth = "none";
  padSvgViewBox(firstSvg, 28);
  let panzoom: PanzoomInstance = Panzoom(svg, options);

  view.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      panzoom.zoomWithWheel(event);
    },
    { passive: false },
  );

  const bar = document.createElement("div");
  bar.className = "mermaid-zoom__bar";
  bar.append(
    button("Приблизить", plusIcon(), () => {
      panzoom.zoomIn();
    }),
    button("Отдалить", minusIcon(), () => {
      panzoom.zoomOut();
    }),
    button("Сбросить", resetIcon(), () => {
      panzoom.reset();
    }),
  );
  shell.appendChild(bar);

  const watch = new MutationObserver(() => {
    const next = host.querySelector("svg");
    if (next === null || next === svg) {
      return;
    }
    panzoom.destroy();
    svg = next as unknown as HTMLElement;
    svg.style.maxWidth = "none";
    padSvgViewBox(next, 28);
    panzoom = Panzoom(svg, options);
  });
  watch.observe(host, { childList: true, subtree: true });
};

const button = (
  label: string,
  icon: string,
  onClick: () => void,
): HTMLButtonElement => {
  const node = document.createElement("button");
  node.type = "button";
  node.className = "mermaid-zoom__btn";
  node.setAttribute("aria-label", label);
  node.title = label;
  node.innerHTML = icon;
  node.addEventListener("click", (event) => {
    event.preventDefault();
    onClick();
  });
  return node;
};

const plusIcon = (): string => {
  return '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8 2a.75.75 0 0 1 .75.75V7.25h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5V2.75A.75.75 0 0 1 8 2Z"/></svg>';
};

const minusIcon = (): string => {
  return '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M2.75 7.25a.75.75 0 0 0 0 1.5h10.5a.75.75 0 0 0 0-1.5H2.75Z"/></svg>';
};

const resetIcon = (): string => {
  return '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8.27 2.07a.75.75 0 0 1 .42 1.44 5.25 5.25 0 1 0 3.47 9.13.75.75 0 1 1 1.06 1.06A6.75 6.75 0 1 1 8.7 2.01a.75.75 0 0 1-.43.06Z"/></svg>';
};

let watching = false;

export const setupMermaidZoom = (): void => {
  const attach = (): void => {
    for (const node of document.querySelectorAll<HTMLElement>(
      ".vp-doc .mermaid",
    )) {
      bind(node);
    }
  };
  attach();
  if (watching) {
    return;
  }
  watching = true;
  const page = document.querySelector(".VPContent") ?? document.body;
  const observer = new MutationObserver(attach);
  observer.observe(page, { childList: true, subtree: true });
};
