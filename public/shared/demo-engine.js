// AgentAegis Demo Replay Engine
// Reads a demo data.json (tools, log timeline, recorded results) and animates a "live scan" experience.

(function () {
  "use strict";

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  function el(tag, props = {}, children = []) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === "class") n.className = v;
      else if (k === "html") n.innerHTML = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    }
    for (const c of [].concat(children)) {
      if (c == null) continue;
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return n;
  }

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  function fmtTime(date = new Date()) {
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    const s = String(date.getSeconds()).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  // === REPLAY ENGINE ===
  class DemoEngine {
    constructor(rootSelector, dataUrl) {
      this.root = $(rootSelector);
      this.dataUrl = dataUrl;
      this.data = null;
      this.startTime = null;
    }

    async load() {
      const res = await fetch(this.dataUrl);
      if (!res.ok) throw new Error(`Failed to load demo data: ${res.status}`);
      this.data = await res.json();
      return this.data;
    }

    log(text, kind = "") {
      const logEl = $(".scan-log", this.root);
      if (!logEl) return;
      const line = el("div", { class: "log-line" }, [
        el("span", { class: "log-time" }, fmtTime()),
        el("span", { class: "log-text " + kind, html: text }),
      ]);
      logEl.appendChild(line);
      logEl.scrollTop = logEl.scrollHeight;
    }

    setStatus(text, running = false) {
      const statusEl = $(".scan-status", this.root);
      if (!statusEl) return;
      statusEl.classList.toggle("running", running);
      const textEl = $(".scan-status-text", statusEl);
      if (textEl) textEl.textContent = text;
    }

    setToolState(toolId, state, progress = 0) {
      const card = $(`.tool-card[data-tool="${toolId}"]`, this.root);
      if (!card) return;
      card.classList.remove("running", "done", "failed");
      if (state) card.classList.add(state);
      const bar = $(".tool-progress-bar", card);
      if (bar) bar.style.width = progress + "%";
    }

    revealResult(sectionId, html) {
      const target = $(`#${sectionId}`, this.root);
      if (!target) return;
      target.innerHTML = html;
      target.classList.remove("hidden");
      requestAnimationFrame(() => target.classList.add("visible"));
    }

    async run() {
      const startBtn = $(".btn-run", this.root);
      if (startBtn) startBtn.disabled = true;
      const restartBtn = $(".btn-restart", this.root);
      if (restartBtn) restartBtn.classList.add("hidden");

      // Reset state
      this.startTime = Date.now();
      $$(".result-section", this.root).forEach((s) => {
        s.classList.remove("visible");
        s.classList.add("hidden");
      });
      const logEl = $(".scan-log", this.root);
      if (logEl) logEl.innerHTML = "";

      // Run tools (sequential or parallel based on config)
      this.setStatus("Running scan...", true);

      const mode = this.data.mode || "parallel";
      if (mode === "parallel") {
        await Promise.all(this.data.tools.map((tool) => this.runTool(tool)));
      } else {
        for (const tool of this.data.tools) {
          await this.runTool(tool);
        }
      }

      this.setStatus("Scan complete", false);
      this.log("All tools completed. Generating report...", "ok");
      await sleep(400);

      // Reveal final report sections
      if (this.data.reveals) {
        for (const reveal of this.data.reveals) {
          await sleep(reveal.delay_ms || 300);
          this.revealResult(reveal.section, reveal.html);
        }
      }

      // Reveal CTA last
      const cta = $(".beta-cta", this.root);
      if (cta) {
        await sleep(400);
        cta.classList.remove("hidden");
        cta.classList.add("visible");
        cta.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }

      if (restartBtn) restartBtn.classList.remove("hidden");
      if (startBtn) {
        startBtn.disabled = false;
        startBtn.textContent = "Run Again";
      }
    }

    async runTool(tool) {
      this.setToolState(tool.id, "running", 5);
      this.log(`<span class="log-text tool">${tool.label}</span> starting...`, "tool");

      // Simulate progress with log lines
      const total = tool.duration_ms || 3000;
      const lines = tool.log_lines || [];
      const startedAt = Date.now();

      // Schedule log lines
      const linePromises = lines.map(async (line) => {
        await sleep(line.at);
        this.log(line.text, line.kind || "");
      });

      // Animate progress bar smoothly
      const tickInterval = 80;
      const ticks = Math.ceil(total / tickInterval);
      for (let i = 1; i <= ticks; i++) {
        await sleep(tickInterval);
        const elapsed = Date.now() - startedAt;
        const pct = Math.min(95, (elapsed / total) * 100);
        this.setToolState(tool.id, "running", pct);
      }

      await Promise.all(linePromises);
      this.setToolState(tool.id, "done", 100);
      this.log(`<span class="log-text tool">${tool.label}</span> complete.`, "ok");
    }
  }

  // === BETA SIGNUP MODAL ===
  function setupBetaModal() {
    if (document.getElementById("beta-modal")) return; // Already mounted

    const modal = el("div", { id: "beta-modal", class: "modal-backdrop" }, [
      el("div", { class: "modal" }, [
        el("button", { class: "modal-close", "aria-label": "Close", onclick: closeBetaModal }, "✕"),
        el("h3", {}, "Get Beta Access"),
        el("p", {}, "AgentAegis is in private beta. Drop your email and we'll let you know when public access opens — usually within 1–2 weeks."),
        el("form", { class: "modal-form", id: "beta-form" }, [
          el("input", { type: "email", name: "email", placeholder: "you@company.com", required: "true" }),
          el("input", { type: "text", name: "name", placeholder: "Your name (optional)" }),
          el("input", { type: "text", name: "company", placeholder: "Company (optional)" }),
          el("textarea", { name: "use_case", placeholder: "What are you building? (optional)", rows: "2" }),
          el("button", { type: "submit", class: "btn btn-primary btn-large" }, "Join Beta Waitlist"),
          el("div", { id: "beta-message", class: "modal-message" }),
        ]),
      ]),
    ]);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeBetaModal();
    });

    document.body.appendChild(modal);

    $("#beta-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const fd = new FormData(form);
      const data = Object.fromEntries(fd.entries());
      const msg = $("#beta-message");
      const btn = form.querySelector("button[type=submit]");

      msg.className = "modal-message";
      msg.textContent = "";
      btn.disabled = true;
      btn.textContent = "Submitting...";

      try {
        const res = await fetch("/api/beta-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Server error (${res.status})`);
        }

        msg.className = "modal-message success";
        msg.textContent = "You're on the list! We'll email you when public access opens.";
        form.reset();
        btn.textContent = "Join Beta Waitlist";

        setTimeout(() => closeBetaModal(), 2400);
      } catch (err) {
        msg.className = "modal-message error";
        msg.textContent = err.message || "Something went wrong. Please try again.";
        btn.disabled = false;
        btn.textContent = "Join Beta Waitlist";
      }
    });
  }

  function openBetaModal() {
    setupBetaModal();
    const modal = document.getElementById("beta-modal");
    if (modal) modal.classList.add("open");
  }

  function closeBetaModal() {
    const modal = document.getElementById("beta-modal");
    if (modal) modal.classList.remove("open");
  }

  // Wire up any element with data-beta-signup attribute
  document.addEventListener("click", (e) => {
    const target = e.target.closest("[data-beta-signup]");
    if (target) {
      e.preventDefault();
      openBetaModal();
    }
  });

  // Auto-mount modal on load (so it's ready when first clicked)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupBetaModal);
  } else {
    setupBetaModal();
  }

  // Expose globals
  window.AgentAegisDemo = {
    Engine: DemoEngine,
    openBetaModal,
    closeBetaModal,
  };
})();
