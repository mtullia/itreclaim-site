/* ITReclaim site script: mobile menu, Services menu, industries carousel, request form. First-party only: no tracking, no third-party code.
   The site works without this file: the menu is shown expanded and the form posts natively. */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    initNav();
    initForm();
    initLeadForm();
    initOptout();
    Array.prototype.forEach.call(document.querySelectorAll("[data-carousel]"), initCarousel);
  });

  // Printed pages show every FAQ answer.
  window.addEventListener("beforeprint", function () {
    Array.prototype.forEach.call(document.querySelectorAll("details:not([open])"), function (d) {
      d.setAttribute("open", "");
      d.setAttribute("data-print-opened", "");
    });
  });
  window.addEventListener("afterprint", function () {
    Array.prototype.forEach.call(document.querySelectorAll("details[data-print-opened]"), function (d) {
      d.removeAttribute("open");
      d.removeAttribute("data-print-opened");
    });
  });

  /* ---------- carousel (industries) ----------
     Server HTML is a plain list with every item visible. This turns it into a scroll-snap carousel with labelled
     Previous/Next buttons, arrow keys on the track, and optional auto-advance that has a visible pause button, stops on
     hover and focus, and is off when the visitor prefers reduced motion. The status line is a live region only while
     the carousel is not rotating by itself. */
  function initCarousel(box) {
    var list = box.querySelector(".carousel-track");
    if (!list) return;
    var items = Array.prototype.slice.call(list.children);
    var total = items.length;
    if (total < 2) return;
    var label = box.getAttribute("data-label") || "Carousel";
    var delay = parseInt(box.getAttribute("data-autoplay"), 10) || 0;
    var mql = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };

    // Rebuild the list as slides, so the group and slide roles are not set on list items.
    var track = document.createElement("div");
    track.className = "carousel-track";
    track.setAttribute("role", "group");
    track.setAttribute("aria-label", label + ", slides");
    track.tabIndex = 0;
    var slides = items.map(function (li, i) {
      var slide = document.createElement("div");
      slide.className = li.className;
      slide.setAttribute("role", "group");
      slide.setAttribute("aria-roledescription", "slide");
      slide.setAttribute("aria-label", (i + 1) + " of " + total);
      while (li.firstChild) slide.appendChild(li.firstChild);
      track.appendChild(slide);
      return slide;
    });
    list.parentNode.replaceChild(track, list);
    box.setAttribute("role", "group");
    box.setAttribute("aria-roledescription", "carousel");
    box.setAttribute("aria-label", label);
    box.classList.add("is-ready");

    function button(cls, text) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn carousel-btn " + cls;
      b.textContent = text;
      return b;
    }
    var controls = document.createElement("div");
    controls.className = "carousel-controls";
    var prev = button("carousel-prev", "Previous");
    prev.setAttribute("aria-label", "Previous slides");
    var next = button("carousel-next", "Next");
    next.setAttribute("aria-label", "Next slides");
    var toggle = button("carousel-toggle", "Pause auto-advance");
    var status = document.createElement("p");
    status.className = "carousel-status";
    controls.appendChild(prev);
    controls.appendChild(next);
    controls.appendChild(toggle);
    controls.appendChild(status);
    box.appendChild(controls);

    var userPaused = false, hover = false, focused = false, timer = null;
    function motionOk() { return !mql.matches; }
    function canAuto() { return delay > 0 && motionOk(); }
    function running() { return canAuto() && !userPaused; }

    function range() {
      var left = track.scrollLeft, right = left + track.clientWidth, first = -1, last = -1;
      slides.forEach(function (sl, i) {
        var x = sl.offsetLeft - track.offsetLeft;
        if (x >= left - 2 && x + sl.offsetWidth <= right + 2) { if (first < 0) first = i; last = i; }
      });
      if (first < 0) { first = 0; last = 0; }
      return [first + 1, last + 1];
    }
    function update() {
      var r = range();
      status.textContent = r[0] === r[1] ? "Showing " + r[0] + " of " + total : "Showing " + r[0] + " to " + r[1] + " of " + total;
    }
    function syncControls() {
      toggle.hidden = !canAuto();
      toggle.textContent = userPaused ? "Start auto-advance" : "Pause auto-advance";
      toggle.setAttribute("aria-pressed", userPaused ? "true" : "false");
      // A live region only when nothing rotates on its own, so screen readers are not interrupted.
      status.setAttribute("aria-live", running() ? "off" : "polite");
      if (running() && !hover && !focused) start(); else stop();
    }
    function page(dir) {
      var max = track.scrollWidth - track.clientWidth;
      var target = track.scrollLeft + dir * track.clientWidth;
      if (dir > 0 && track.scrollLeft >= max - 2) target = 0;
      else if (dir < 0 && track.scrollLeft <= 2) target = max;
      track.scrollTo({ left: target, behavior: motionOk() ? "smooth" : "auto" });
    }
    function stop() { if (timer) { window.clearInterval(timer); timer = null; } }
    function start() { if (!timer && running()) timer = window.setInterval(function () { page(1); }, delay); }

    function manual(dir) { userPaused = true; syncControls(); page(dir); }
    prev.addEventListener("click", function () { manual(-1); });
    next.addEventListener("click", function () { manual(1); });
    toggle.addEventListener("click", function () { userPaused = !userPaused; syncControls(); });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); manual(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); manual(-1); }
    });
    var raf = 0;
    track.addEventListener("scroll", function () {
      if (raf) return;
      raf = window.requestAnimationFrame(function () { raf = 0; update(); });
    }, { passive: true });
    box.addEventListener("mouseenter", function () { hover = true; syncControls(); });
    box.addEventListener("mouseleave", function () { hover = false; syncControls(); });
    box.addEventListener("focusin", function () { focused = true; syncControls(); });
    box.addEventListener("focusout", function (e) { if (!box.contains(e.relatedTarget)) { focused = false; syncControls(); } });
    window.addEventListener("resize", update);
    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else syncControls(); });
    var onMotion = function () { syncControls(); };
    if (mql.addEventListener) mql.addEventListener("change", onMotion);
    update();
    syncControls();
  }

  /* ---------- navigation ---------- */
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("site-nav");
    var subToggle = document.querySelector(".sub-toggle");
    var sub = document.getElementById("nav-services");
    if (toggle && nav) {
      toggle.hidden = false;
      toggle.addEventListener("click", function () {
        var open = toggle.getAttribute("aria-expanded") !== "true";
        setMenu(open);
        if (open) {
          var first = nav.querySelector("a, button");
          if (first) first.focus();
        }
      });
    }
    function setMenu(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.querySelector(".nav-toggle-label").textContent = open ? "Close" : "Menu";
      root.classList.toggle("menu-open", open);
    }
    function setSub(open) {
      if (!subToggle) return;
      subToggle.setAttribute("aria-expanded", open ? "true" : "false");
    }
    if (subToggle && sub) {
      subToggle.addEventListener("click", function (e) {
        e.stopPropagation();
        setSub(subToggle.getAttribute("aria-expanded") !== "true");
      });
      document.addEventListener("click", function (e) {
        if (!subToggle.parentNode.contains(e.target)) setSub(false);
      });
      subToggle.parentNode.addEventListener("focusout", function (e) {
        if (e.relatedTarget && !subToggle.parentNode.contains(e.relatedTarget) && window.matchMedia("(min-width: 72em)").matches) setSub(false);
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (subToggle && subToggle.getAttribute("aria-expanded") === "true") {
        setSub(false);
        subToggle.focus();
      } else if (toggle && toggle.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        toggle.focus();
      }
    });
    window.matchMedia("(min-width: 72em)").addEventListener("change", function (mq) {
      if (mq.matches && toggle) setMenu(false);
    });
  }

  /* ---------- email opt-out form (D-245) ---------- */
  function initOptout() {
    var form = document.getElementById("optout-form");
    if (!form) return;
    // The link carries only an opaque code (?t=...), never the address. Keep it in the form, then drop it from the
    // address bar so it is not kept in history or shared by copying the address.
    var m = /[?&]t=([0-9a-f]{48})(?:&|$)/.exec(window.location.search);
    if (m) {
      form.elements.opt_out_code.value = m[1];
      form.elements.email.required = false;
      document.getElementById("optout-email-hint").textContent = "Optional: your link already tells us which address to remove.";
      if (window.history && window.history.replaceState) window.history.replaceState(null, "", window.location.pathname);
    }
    form.addEventListener("submit", function (e) {
      if (form.getAttribute("data-mode") !== "preview") return;   // live: a plain post to the form endpoint
      e.preventDefault();
      document.getElementById("optout-status").textContent = "Preview site: your request was checked in the browser, but this preview does not send it anywhere.";
    });
  }

  /* ---------- shared FormSubmit post ----------
     The endpoint is the form action (plain address or hashed alias); the AJAX variant adds /ajax/. The only network call. */
  function postForm(form, onOk, onFail) {
    var endpoint = form.getAttribute("action") || "";
    var target = endpoint.replace(/^(https:\/\/formsubmit\.co\/)(?!ajax\/)/, "$1ajax/");
    var payload = {};
    new FormData(form).forEach(function (value, key) {
      if (key === "_next" || key === "_honey") return;
      payload[key] = Object.prototype.hasOwnProperty.call(payload, key) ? payload[key] + ", " + value : value;
    });
    fetch(target, { method: "POST", headers: { "Accept": "application/json", "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    .then(function (r) {
      if (!r.ok) throw new Error("status " + r.status);
      return r.json();
    }).then(function (data) {
      if (data && (data.success === false || data.success === "false")) throw new Error("rejected");
      onOk();
    }).catch(onFail);
  }

  /* ---------- checklist lead form (home) ----------
     Without JS the form posts natively and FormSubmit returns to the checklist page. With JS the post is sent in the
     background and the visitor goes straight to the checklist page. Bots (filled honeypot, instant submit) get the page, nothing is sent. */
  function initLeadForm() {
    var form = document.getElementById("checklist-form");
    if (!form) return;
    var started = Date.now();
    var status = document.getElementById("lead-status");
    form.addEventListener("submit", function (e) {
      if (!form.checkValidity()) return;   // the browser shows its own message for a missing or malformed email
      e.preventDefault();
      var next = form.getAttribute("data-next");
      var minMs = (parseInt(form.getAttribute("data-min-seconds"), 10) || 3) * 1000;
      if (form.elements._honey.value || Date.now() - started < minMs) { window.location.href = next; return; }
      if (form.getAttribute("data-mode") === "preview") {
        status.textContent = "Preview site: nothing was sent. The checklist page opens next.";
        window.setTimeout(function () { window.location.href = next; }, 900);
        return;
      }
      var button = form.querySelector("button[type=submit]");
      button.disabled = true;
      status.textContent = "Sending...";
      postForm(form, function () { window.location.href = next; }, function () {
        button.disabled = false;
        status.textContent = "Sorry, that could not be sent. Please try again in a moment.";
      });
    });
  }

  /* ---------- request form ---------- */
  function initForm() {
    var form = document.getElementById("assessment-form");
    if (!form) return;
    var started = Date.now();
    var summary = document.getElementById("error-summary");
    var list = document.getElementById("error-list");
    var status = document.getElementById("form-status");
    var success = document.getElementById("form-success");
    var formError = document.getElementById("form-error");
    var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    form.noValidate = true;

    var checks = [
      { id: "company_name", test: function (v) { return v.trim() ? "" : "Enter your organization's name."; } },
      { id: "contact_name", test: function (v) { return v.trim() ? "" : "Enter your name."; } },
      { id: "email", test: function (v) {
          if (v.trim() && !EMAIL.test(v.trim())) return "Enter an email address like name@company.com.";
          if (!v.trim() && !form.elements.phone.value.trim()) return "Enter an email address or a phone number.";
          return "";
        } },
      { id: "phone", test: function (v) {
          if (v.trim() && v.replace(/\D/g, "").length < 7) return "Enter a phone number with at least 7 digits.";
          return "";
        } },
      { id: "consent", test: function () { return form.elements.consent.checked ? "" : "Check the box so we can use these details to reply."; } }
    ];

    function setError(id, msg) {
      var input = document.getElementById(id);
      var err = document.getElementById(id + "-error");
      if (msg) {
        input.setAttribute("aria-invalid", "true");
        err.textContent = msg;
        err.hidden = false;
      } else {
        input.removeAttribute("aria-invalid");
        err.textContent = "";
        err.hidden = true;
      }
    }

    function validate() {
      var problems = [];
      checks.forEach(function (c) {
        var el = document.getElementById(c.id);
        var msg = c.test(el.value);
        setError(c.id, msg);
        if (msg) problems.push({ id: c.id, msg: msg });
      });
      return problems;
    }

    checks.forEach(function (c) {
      var el = document.getElementById(c.id);
      el.addEventListener(el.type === "checkbox" ? "change" : "blur", function () {
        if (el.getAttribute("aria-invalid") === "true" || (el.type !== "checkbox" && el.value)) setError(c.id, c.test(el.value));
      });
    });

    function showSummary(problems) {
      list.textContent = "";
      problems.forEach(function (p) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = "#" + p.id;
        a.textContent = p.msg;
        a.addEventListener("click", function (e) {
          e.preventDefault();
          document.getElementById(p.id).focus();
        });
        li.appendChild(a);
        list.appendChild(li);
      });
      summary.hidden = false;
      summary.focus();
    }

    function done(preview) {
      form.hidden = true;
      document.getElementById("form-success-preview").hidden = !preview;
      success.hidden = false;
      success.focus();
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.textContent = "";
      formError.hidden = true;
      var problems = validate();
      if (problems.length) {
        showSummary(problems);
        return;
      }
      summary.hidden = true;
      var elapsed = Date.now() - started;
      form.elements.elapsed_ms.value = String(elapsed);
      var minMs = (parseInt(form.getAttribute("data-min-seconds"), 10) || 3) * 1000;
      // Bots: a filled honeypot or an instant submit gets the same thank-you screen, and nothing is sent.
      if (form.elements._honey.value || elapsed < minMs) {
        done(false);
        return;
      }
      var preview = form.getAttribute("data-mode") === "preview";
      // Preview build: no endpoint exists, so the submission is simulated in the browser. Nothing is sent.
      if (preview) {
        done(true);
        return;
      }
      var button = form.querySelector("button[type=submit]");
      button.disabled = true;
      status.textContent = "Sending your request...";
      postForm(form, function () { done(false); }, function () {
        button.disabled = false;
        status.textContent = "";
        formError.hidden = false;
        formError.focus();
      });
    });
  }
})();
