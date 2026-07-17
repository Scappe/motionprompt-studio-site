const tabs = [...document.querySelectorAll(".demo-tab")];
const panels = [...document.querySelectorAll(".demo-panel")];

for (const tab of tabs) {
  tab.addEventListener("click", () => {
    const targetId = tab.dataset.target;

    for (const candidate of tabs) {
      const active = candidate === tab;
      candidate.classList.toggle("is-active", active);
      candidate.setAttribute("aria-selected", String(active));
    }

    for (const panel of panels) {
      panel.hidden = panel.id !== targetId;
    }
  });
}

for (const link of document.querySelectorAll(".tracked-link")) {
  link.addEventListener("click", () => {
    try {
      sessionStorage.setItem("motionprompt_last_cta", link.dataset.placement || "unknown");
    } catch (_) {
      // The purchase link must keep working even when storage is unavailable.
    }
  });
}
