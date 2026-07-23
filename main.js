/* RentMid — shared front-end behavior
   No external dependencies. Respects prefers-reduced-motion.
   Note: theme preference is kept in memory + defaults to the
   OS preference on each load (no localStorage/sessionStorage
   is used, by design, for sandboxed-preview compatibility). */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Footer year ---------------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------------- Theme toggle ---------------- */
  var root = document.documentElement;
  var themeToggle = document.getElementById("themeToggle");
  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  root.setAttribute("data-theme", prefersDark ? "dark" : "light");

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var current = root.getAttribute("data-theme");
      root.setAttribute("data-theme", current === "dark" ? "light" : "dark");
    });
  }

  /* ---------------- Mobile nav ---------------- */
  var navToggle = document.getElementById("navToggle");
  var siteNav = document.getElementById("siteNav");
  if (navToggle && siteNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = siteNav.classList.toggle("is-open");
      navToggle.classList.toggle("is-active", isOpen);
      document.body.classList.toggle("nav-open", isOpen);
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
    siteNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        siteNav.classList.remove("is-open");
        navToggle.classList.remove("is-active");
        document.body.classList.remove("nav-open");
      });
    });
  }

  /* ---------------- Scroll reveal ---------------- */
  var revealEls = document.querySelectorAll(".reveal, .reveal-stagger");
  if (reduceMotion) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------------- Hero 3D tilt (mouse) + scroll parallax ---------------- */
  var building = document.querySelector(".building");
  var heroVisual = document.querySelector(".hero-visual");
  if (building && heroVisual && !reduceMotion) {
    heroVisual.addEventListener("mousemove", function (e) {
      var rect = heroVisual.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      building.style.setProperty("--tiltY", (x * 22).toFixed(2) + "deg");
      building.style.setProperty("--tiltX", (8 - y * 18).toFixed(2) + "deg");
    });
    heroVisual.addEventListener("mouseleave", function () {
      building.style.setProperty("--tiltY", "-10deg");
      building.style.setProperty("--tiltX", "8deg");
    });
  }

  var parallaxEls = document.querySelectorAll("[data-parallax]");
  if (parallaxEls.length && !reduceMotion) {
    var ticking = false;
    function updateParallax() {
      var vh = window.innerHeight;
      parallaxEls.forEach(function (el) {
        var speed = parseFloat(el.getAttribute("data-parallax")) || 0.15;
        var rect = el.getBoundingClientRect();
        var offset = (rect.top - vh / 2) * speed;
        el.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0)";
      });
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { window.requestAnimationFrame(updateParallax); ticking = true; }
    }, { passive: true });
    updateParallax();
  }

  /* ---------------- Horizontal scroll showcase ---------------- */
  var hscroll = document.querySelector(".hscroll-section");
  if (hscroll) {
    var sticky = hscroll.querySelector(".hscroll-sticky");
    var track = hscroll.querySelector(".hscroll-track");
    var progressBar = hscroll.querySelector(".hscroll-progress-bar");

    function layoutHscroll() {
      if (window.innerWidth <= 780) {
        hscroll.style.height = "auto";
        track.style.transform = "none";
        return;
      }
      var trackWidth = track.scrollWidth;
      var viewportW = window.innerWidth;
      var scrollDistance = Math.max(trackWidth - viewportW + 56, 0);
      hscroll.style.height = (window.innerHeight + scrollDistance) + "px";
      hscroll.dataset.scrollDistance = scrollDistance;
    }

    function onScrollHscroll() {
      if (window.innerWidth <= 780) return;
      var scrollDistance = parseFloat(hscroll.dataset.scrollDistance || "0");
      var rect = hscroll.getBoundingClientRect();
      var progress = (-rect.top) / (scrollDistance || 1);
      progress = Math.min(Math.max(progress, 0), 1);
      track.style.transform = "translate3d(" + (-progress * scrollDistance).toFixed(1) + "px,0,0)";
      if (progressBar) progressBar.style.width = (progress * 100).toFixed(1) + "%";
    }

    window.addEventListener("resize", layoutHscroll);
    window.addEventListener("scroll", function () {
      window.requestAnimationFrame(onScrollHscroll);
    }, { passive: true });
    layoutHscroll();
    onScrollHscroll();
  }

  /* ---------------- Pricing calculator ---------------- */
  var unitsInput = document.getElementById("unitsInput");
  var unitsRange = document.getElementById("unitsRange");
  var calcPrice = document.getElementById("calcPrice");
  var calcSub = document.getElementById("calcSub");
  var tierBadge = document.getElementById("tierBadge");
  var gridPreview = document.getElementById("calcGridPreview");

  function buildGridPreview(cellCount) {
    if (!gridPreview) return;
    gridPreview.innerHTML = "";
    for (var i = 0; i < cellCount; i++) {
      var cell = document.createElement("div");
      cell.className = "cell";
      gridPreview.appendChild(cell);
    }
  }

  function updateGridFill(units, max) {
    if (!gridPreview) return;
    var cells = gridPreview.children;
    var filled = Math.round((units / max) * cells.length);
    for (var i = 0; i < cells.length; i++) {
      cells[i].classList.toggle("filled", i < filled);
    }
  }

  function computeTier(units) {
    if (units <= 49) {
      return { name: "Starter", rate: 1.00, min: 50 };
    } else if (units <= 150) {
      return { name: "Growth", rate: 1.99, min: 150 };
    } else {
      return { name: "Pro", rate: 2.89, min: null };
    }
  }

  function runCalculator(units) {
    units = Math.min(Math.max(parseInt(units, 10) || 0, 1), 250);
    var tier = computeTier(units);
    var cost = units * tier.rate;
    var minApplied = false;
    if (tier.min && cost < tier.min) { cost = tier.min; minApplied = true; }

    if (calcPrice) {
      calcPrice.innerHTML = "$" + cost.toFixed(0) + "<span>/mo</span>";
    }
    if (tierBadge) {
      tierBadge.textContent = tier.name + " tier";
    }
    if (calcSub) {
      if (tier.name === "Pro") {
        calcSub.textContent = "Estimate at $2.89/unit — Pro is custom-quoted, contact us for an exact price.";
      } else if (minApplied) {
        calcSub.textContent = "$" + tier.rate.toFixed(2) + "/unit/mo, " + tier.min + "/mo minimum applied.";
      } else {
        calcSub.textContent = "$" + tier.rate.toFixed(2) + " per unit, per month.";
      }
    }
    updateGridFill(units, 250);
    return units;
  }

  if (unitsInput && unitsRange) {
    buildGridPreview(50);
    unitsInput.addEventListener("input", function () {
      var v = runCalculator(this.value);
      unitsRange.value = v;
    });
    unitsRange.addEventListener("input", function () {
      unitsInput.value = this.value;
      runCalculator(this.value);
    });
    runCalculator(unitsInput.value || 65);
  }

  /* ---------------- Contact form (front-end only) ---------------- */
  var contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }
      var success = document.getElementById("formSuccess");
      if (success) {
        success.classList.add("is-visible");
        success.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      }
      contactForm.reset();
    });
  }
})();
