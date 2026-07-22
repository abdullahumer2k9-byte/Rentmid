(function(){
  "use strict";

  /* ---------- Theme toggle ---------- */
  var root = document.documentElement;
  var saved = null;
  try{ saved = localStorage.getItem('rentmid-theme'); }catch(e){}
  if(saved){ root.setAttribute('data-theme', saved); }
  else if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches){ root.setAttribute('data-theme','dark'); }

  function initThemeToggle(){
    var btns = document.querySelectorAll('.theme-toggle');
    btns.forEach(function(btn){
      btn.setAttribute('role','switch');
      btn.setAttribute('aria-label','Toggle dark mode');
      btn.addEventListener('click', function(){
        var cur = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        var next = cur === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try{ localStorage.setItem('rentmid-theme', next); }catch(e){}
      });
    });
  }

  /* ---------- Nav scroll state + mobile menu ---------- */
  function initNav(){
    var nav = document.querySelector('.site-nav');
    if(nav){
      var onScroll = function(){ nav.classList.toggle('scrolled', window.scrollY > 8); };
      onScroll();
      window.addEventListener('scroll', onScroll, {passive:true});
    }
    var toggle = document.querySelector('.mobile-toggle');
    var links = document.querySelector('.nav-links');
    if(toggle && links){
      toggle.addEventListener('click', function(){
        links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', links.classList.contains('open'));
      });
      links.querySelectorAll('a').forEach(function(a){
        a.addEventListener('click', function(){ links.classList.remove('open'); });
      });
    }
  }

  /* ---------- Scroll reveals ---------- */
  function initReveals(){
    var els = document.querySelectorAll('.reveal, .reveal-scale');
    if(!('IntersectionObserver' in window)){
      els.forEach(function(el){ el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    els.forEach(function(el){ io.observe(el); });
  }

  /* ---------- Parallax hero layers ---------- */
  function initParallax(){
    var layers = document.querySelectorAll('[data-parallax]');
    if(!layers.length) return;
    var ticking = false;
    function update(){
      var y = window.scrollY;
      layers.forEach(function(layer){
        var speed = parseFloat(layer.getAttribute('data-parallax')) || 0.2;
        var offset = y * speed;
        layer.style.transform = 'translate3d(0,' + offset + 'px,0)';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function(){
      if(!ticking){ window.requestAnimationFrame(update); ticking = true; }
    }, {passive:true});
    update();
  }

  /* ---------- 3D tilt on cards ---------- */
  function initTilt(){
    var tilts = document.querySelectorAll('.tilt');
    tilts.forEach(function(wrap){
      var inner = wrap.querySelector('.tilt-inner') || wrap;
      wrap.addEventListener('mousemove', function(e){
        var r = wrap.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        inner.style.transform = 'rotateY(' + (px*8) + 'deg) rotateX(' + (py*-8) + 'deg)';
      });
      wrap.addEventListener('mouseleave', function(){
        inner.style.transform = 'rotateY(0) rotateX(0)';
      });
    });
  }

  /* ---------- Horizontal scroll-linked section ---------- */
  function initHScroll(){
    var sections = document.querySelectorAll('.hscroll-section');
    sections.forEach(function(section){
      var track = section.querySelector('.hscroll-track');
      var dots = section.querySelectorAll('.hscroll-progress i');
      if(!track) return;
      function update(){
        var rect = section.getBoundingClientRect();
        var scrollable = section.offsetHeight - window.innerHeight;
        if(scrollable <= 0) return;
        var progress = Math.min(Math.max(-rect.top / scrollable, 0), 1);
        var maxTranslate = Math.max(track.scrollWidth - track.parentElement.offsetWidth, 0);
        track.style.transform = 'translate3d(' + (-progress * maxTranslate) + 'px,0,0)';
        var idx = Math.min(dots.length - 1, Math.floor(progress * dots.length));
        dots.forEach(function(d,i){ d.classList.toggle('active', i === idx); });
      }
      window.addEventListener('scroll', function(){ window.requestAnimationFrame(update); }, {passive:true});
      window.addEventListener('resize', update);
      update();
    });
  }

  /* ---------- FAQ accordion ---------- */
  function initFaq(){
    document.querySelectorAll('.faq-item').forEach(function(item){
      var q = item.querySelector('.faq-q');
      var a = item.querySelector('.faq-a');
      if(!q || !a) return;
      q.addEventListener('click', function(){
        var isOpen = item.classList.contains('open');
        item.parentElement.querySelectorAll('.faq-item').forEach(function(other){
          other.classList.remove('open');
          other.querySelector('.faq-a').style.maxHeight = null;
        });
        if(!isOpen){
          item.classList.add('open');
          a.style.maxHeight = a.scrollHeight + 'px';
        }
      });
    });
  }

  /* ---------- Pricing calculator ---------- */
  function initCalculator(){
    var slider = document.getElementById('unit-slider');
    if(!slider) return;
    var unitsOut = document.getElementById('calc-units');
    var priceOut = document.getElementById('calc-price');
    var tierOut = document.getElementById('calc-tier');
    var noteOut = document.getElementById('calc-note');

    function compute(units){
      var tier, rate, min, label;
      if(units <= 49){ tier='Starter'; rate=1.00; min=50; }
      else if(units <= 150){ tier='Growth'; rate=1.99; min=150; }
      else { tier='Pro'; rate=2.89; min=null; }
      var raw = units * rate;
      var total = min ? Math.max(raw, min) : raw;
      return { tier: tier, total: total, rate: rate, min: min };
    }

    function update(){
      var units = parseInt(slider.value, 10);
      var r = compute(units);
      unitsOut.textContent = units;
      tierOut.textContent = r.tier + ' tier';
      priceOut.innerHTML = '$' + r.total.toLocaleString(undefined,{maximumFractionDigits:0}) + '<span>/mo</span>';
      if(r.tier === 'Pro'){
        noteOut.textContent = '$' + r.rate.toFixed(2) + '/unit — custom minimum, contact sales for a quote.';
      } else {
        noteOut.textContent = '$' + r.rate.toFixed(2) + '/unit, $' + r.min + '/mo minimum.';
      }
    }
    slider.addEventListener('input', update);
    update();
  }

  /* ---------- Contact form validation (front-end only) ---------- */
  function initForm(){
    var form = document.getElementById('demo-form');
    if(!form) return;
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var valid = true;
      form.querySelectorAll('[required]').forEach(function(field){
        var value = (field.value || '').trim();
        var errorEl = field.parentElement.querySelector('.field-error');
        var bad = false;
        if(!value){ bad = true; }
        if(field.type === 'email' && value){
          var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if(!re.test(value)) bad = true;
        }
        field.style.borderColor = bad ? '#B5533E' : '';
        if(errorEl) errorEl.style.display = bad ? 'block' : 'none';
        if(bad) valid = false;
      });
      if(!valid){ form.querySelector('.form-status').textContent = 'Please fill in the required fields correctly.'; form.querySelector('.form-status').style.color = '#B5533E'; return; }
      var status = form.querySelector('.form-status');
      status.style.color = 'var(--accent-2)';
      status.textContent = 'Thanks — this is a front-end demo, so no data was sent. Wire this form up to your backend or a form service before launch.';
      form.reset();
    });
  }

  /* ---------- Unit grid generator (signature element) ---------- */
  function buildUnitGrid(container, cols, total, lit, ghostExtra){
    if(!container) return;
    container.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
    container.innerHTML = '';
    var full = total + (ghostExtra || 0);
    for(var i=0;i<full;i++){
      var cell = document.createElement('div');
      cell.className = 'unit-cell';
      if(i >= total){ cell.classList.add('ghost'); }
      else if(i < lit){ cell.classList.add(i % 5 === 0 ? 'lit-2' : 'lit'); }
      container.appendChild(cell);
    }
  }

  function initUnitGrids(){
    document.querySelectorAll('[data-unit-grid]').forEach(function(el){
      var cols = parseInt(el.getAttribute('data-cols'),10) || 10;
      var total = parseInt(el.getAttribute('data-total'),10) || 100;
      var lit = parseInt(el.getAttribute('data-lit'),10) || 0;
      var ghost = parseInt(el.getAttribute('data-ghost'),10) || 0;
      buildUnitGrid(el, cols, total, lit, ghost);
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    initThemeToggle();
    initNav();
    initUnitGrids();
    initReveals();
    initParallax();
    initTilt();
    initHScroll();
    initFaq();
    initCalculator();
    initForm();
  });
})();
