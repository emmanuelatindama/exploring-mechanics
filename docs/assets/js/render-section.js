// Renders a section page's tab bar + panels from window.SECTIONS data,
// keyed by the <body data-section="..."> attribute. Shared by every
// docs/<section>/index.html page so content edits happen in one place:
// assets/js/section-data.js.
(function () {
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (k === "class") node.className = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else node.setAttribute(k, attrs[k]);
      }
    }
    (children || []).forEach((c) => c && node.appendChild(c));
    return node;
  }

  function list(tag, items, ordered) {
    const node = document.createElement(ordered ? "ol" : "ul");
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      node.appendChild(li);
    });
    return node;
  }

  function renderPanel(sub) {
    const panel = el("div", { class: "panel", id: "panel-" + sub.id });
    panel.appendChild(el("h2", { html: sub.title }));
    if (sub.intro) panel.appendChild(el("p", { class: "intro", html: sub.intro }));

    if (sub.core) {
      panel.appendChild(el("div", { class: "callout core", html: sub.core }));
    }
    if (sub.surprise) {
      panel.appendChild(
        el("div", { class: "callout", html: "<strong>The surprise:</strong> " + sub.surprise })
      );
    }
    if (sub.misconception) {
      panel.appendChild(
        el("div", {
          class: "callout",
          html: "<strong>Common misconception:</strong> " + sub.misconception,
        })
      );
    }

    const grid = el("div", { class: "grid" });

    if (sub.stages && sub.stages.length) {
      const box = el("div", {}, [el("h3", { html: "Build in stages" })]);
      box.appendChild(list("ol", sub.stages, true));
      grid.appendChild(box);
    }

    if (sub.concepts && sub.concepts.length) {
      const box = el("div", {}, [el("h3", { html: "Concepts" })]);
      box.appendChild(list("ul", sub.concepts, false));
      grid.appendChild(box);
    }

    if (sub.applications && sub.applications.length) {
      const box = el("div", {}, [el("h3", { html: sub.applicationsLabel || "Problems & applications" })]);
      box.appendChild(list("ul", sub.applications, false));
      grid.appendChild(box);
    }

    if (sub.experiments && sub.experiments.length) {
      const box = el("div", {}, [el("h3", { html: "Experiments & simulations" })]);
      box.appendChild(list("ul", sub.experiments, false));
      grid.appendChild(box);
    }

    panel.appendChild(grid);

    panel.appendChild(
      el("p", {
        class: "status-note",
        html:
          "Status: outline — the question, prediction, diagram, derivation, worked example, and " +
          'interactive simulation for this page follow the <a href="../../guide.md#how-every-topic-page-should-work">standard topic template</a> and are coming soon.',
      })
    );

    return panel;
  }

  function init() {
    const sectionId = document.body.getAttribute("data-section");
    const data = window.SECTIONS && window.SECTIONS[sectionId];
    const tabbar = document.getElementById("tabbar");
    const panels = document.getElementById("panels");
    if (!data || !tabbar || !panels) return;

    data.subtopics.forEach((sub, i) => {
      const btn = el("button", { "data-target": sub.id }, []);
      btn.textContent = sub.title.replace(/\.md$/, "");
      if (i === 0) btn.classList.add("active");
      btn.addEventListener("click", () => activate(sub.id));
      tabbar.appendChild(btn);

      const panel = renderPanel(sub);
      if (i === 0) panel.classList.add("active");
      panels.appendChild(panel);
    });

    function activate(id) {
      tabbar.querySelectorAll("button").forEach((b) => {
        b.classList.toggle("active", b.getAttribute("data-target") === id);
      });
      panels.querySelectorAll(".panel").forEach((p) => {
        p.classList.toggle("active", p.id === "panel-" + id);
      });
      history.replaceState(null, "", "#" + id);
    }

    const initial = window.location.hash.replace("#", "");
    if (initial && data.subtopics.some((s) => s.id === initial)) activate(initial);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
