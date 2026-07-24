(function () {
  "use strict";

  /* ---------- Active nav link ---------- */
  var here = (location.pathname.split("/").pop() || "index.html").replace(/^$/, "index.html");
  document.querySelectorAll(".nav-links a, .mobile-menu a").forEach(function (a) {
    var href = a.getAttribute("href");
    if (href === here || (here === "index.html" && href === "./")) {
      a.setAttribute("aria-current", "page");
    }
  });

  /* ---------- Mobile menu ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var mobileMenu = document.querySelector(".mobile-menu");
  if (navToggle && mobileMenu) {
    navToggle.addEventListener("click", function () {
      var open = mobileMenu.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- Theme toggle ----------
     In-memory only for this page view (no localStorage/sessionStorage),
     defaults to the visitor's system preference via the [data-theme]
     attribute + prefers-color-scheme media query in tokens.css.
     When you deploy this site on your own domain, swap the two lines
     marked below for localStorage calls to persist the choice across
     page loads and navigations. */
  var root = document.documentElement;
  var toggle = document.querySelector(".theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var current = root.getAttribute("data-theme");
      var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      var isDark = current ? current === "dark" : prefersDark;
      root.setAttribute("data-theme", isDark ? "light" : "dark"); // <- swap for localStorage.setItem when self-hosting
      toggle.setAttribute("aria-pressed", (!isDark).toString());
    });
  }

  /* ---------- Scroll reveals ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Pricing calculator ---------- */
  var slider = document.getElementById("unit-slider");
  if (slider) {
    var out = document.getElementById("unit-count-out");
    var tierName = document.getElementById("calc-tier-name");
    var amount = document.getElementById("calc-amount");
    var perUnit = document.getElementById("calc-per-unit");
    var note = document.getElementById("calc-note");

    var tiers = [
      { max: 49, name: "Starter", rate: 1.00, min: 50 },
      { max: 150, name: "Growth", rate: 1.99, min: 150 },
      { max: 200, name: "Pro", rate: 2.89, min: 0 },
      { max: Infinity, name: "Enterprise", rate: null, min: 0 }
    ];

    function fmt(n) {
      return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
    }

    function update() {
      var units = parseInt(slider.value, 10);
      out.textContent = fmt(units);

      var tier = tiers.find(function (t) { return units <= t.max; }) || tiers[tiers.length - 1];

      if (tier.name === "Enterprise") {
        tierName.textContent = "Enterprise";
        amount.innerHTML = "Custom <span>— talk to us</span>";
        perUnit.textContent = "200–500+ units · volume pricing";
        note.textContent = "You're in enterprise territory. We'll scope a flat, portfolio-wide rate — book a call to get a quote.";
        return;
      }

      var raw = units * tier.rate;
      var monthly = Math.max(raw, tier.min);
      tierName.textContent = tier.name;
      amount.innerHTML = "$" + fmt(monthly) + "<span>/month</span>";
      perUnit.textContent = "$" + tier.rate.toFixed(2) + "/unit · " + fmt(units) + " units";
      note.textContent = monthly === tier.min && raw < tier.min
        ? "Billed at the " + fmt(tier.min) + "/month plan minimum for this tier."
        : "Scales linearly — add or remove units anytime, no re-contracting.";
    }

    slider.addEventListener("input", update);
    update();
  }

  /* ---------- Contact form (static — no backend wired up) ---------- */
  var form = document.getElementById("demo-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = document.getElementById("form-status");
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      form.hidden = true;
      if (status) {
        status.hidden = false;
        status.focus();
      }
    });
  }
})();
