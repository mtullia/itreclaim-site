/* Preview password gate (owner request 2026-11-26: site not finalized; D-275, OWNER-REVIEW). Included only while
   facts.yaml preview_gate is true (production build). Launch: set preview_gate: false and rebuild; this file is then not published. */
(function () {
  var KEY = "itr-preview-ok";
  var HASH = "672ef4e7158dcd9a7b7defc91bedc216f6a6554302fd58f97d4a03622f96c4e9";
  try { if (localStorage.getItem(KEY) === HASH) return; } catch (e) {}
  var root = document.documentElement;
  root.style.visibility = "hidden";
  function hex(buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
  }
  function build() {
    var ov = document.createElement("div");
    var s = ov.style;
    s.position = "fixed"; s.inset = "0"; s.zIndex = "2147483647"; s.display = "flex";
    s.alignItems = "center"; s.justifyContent = "center"; s.background = "#0b1a33";
    s.visibility = "visible"; s.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    var f = document.createElement("form");
    f.style.cssText = "";
    f.style.background = "#ffffff"; f.style.padding = "32px 28px"; f.style.borderRadius = "12px";
    f.style.width = "min(360px, calc(100vw - 32px))"; f.style.boxSizing = "border-box"; f.style.textAlign = "center";
    var h = document.createElement("h1");
    h.textContent = "ITReclaim"; h.style.margin = "0 0 6px"; h.style.fontSize = "24px"; h.style.color = "#0b1a33";
    var p = document.createElement("p");
    p.textContent = "This site is in preview. Enter the password to continue.";
    p.style.margin = "0 0 18px"; p.style.color = "#44506a"; p.style.fontSize = "15px";
    var i = document.createElement("input");
    i.type = "password"; i.autocomplete = "current-password"; i.setAttribute("aria-label", "Password");
    i.style.width = "100%"; i.style.boxSizing = "border-box"; i.style.padding = "12px"; i.style.fontSize = "16px";
    i.style.border = "1px solid #b8c2d6"; i.style.borderRadius = "8px"; i.style.marginBottom = "12px";
    var b = document.createElement("button");
    b.type = "submit"; b.textContent = "Enter";
    b.style.width = "100%"; b.style.padding = "12px"; b.style.fontSize = "16px"; b.style.border = "0";
    b.style.borderRadius = "8px"; b.style.background = "#0f766e"; b.style.color = "#fff"; b.style.cursor = "pointer";
    var m = document.createElement("p");
    m.setAttribute("role", "alert"); m.style.color = "#b42318"; m.style.margin = "12px 0 0"; m.style.fontSize = "14px";
    f.appendChild(h); f.appendChild(p); f.appendChild(i); f.appendChild(b); f.appendChild(m);
    ov.appendChild(f);
    document.body.appendChild(ov);
    i.focus();
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      crypto.subtle.digest("SHA-256", new TextEncoder().encode(i.value.trim().toLowerCase())).then(function (d) {
        if (hex(d) === HASH) {
          try { localStorage.setItem(KEY, HASH); } catch (e) {}
          ov.parentNode.removeChild(ov);
          root.style.visibility = "";
        } else {
          m.textContent = "That password is not right.";
          i.value = ""; i.focus();
        }
      });
    });
  }
  if (document.body) build(); else document.addEventListener("DOMContentLoaded", build);
})();
