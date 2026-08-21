/* Takumi Ceremonial Matcha Soft Serve — landing page behaviour.
   Progressive enhancement only: the page is fully readable without this file. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- current year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- mobile nav ---------- */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');

  function closeNav() {
    if (!nav || !toggle) return;
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // Close after tapping a link, and on Escape.
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
    // Reset state when growing past the mobile breakpoint.
    window.matchMedia('(min-width: 901px)').addEventListener('change', closeNav);
  }

  /* ---------- header shadow once scrolled ---------- */
  var header = document.getElementById('siteHeader');
  if (header) {
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:1px';
    document.body.prepend(sentinel);

    new IntersectionObserver(function (entries) {
      header.classList.toggle('is-stuck', !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  /* ---------- scroll reveal ---------- */
  var reveals = document.querySelectorAll('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });

    reveals.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- active nav link ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav__list a[href^="#"]'));
  var sections = links
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var visible = new Set();

    var setCurrent = function () {
      // Highest section currently in the reading band wins.
      var best = null;
      sections.forEach(function (section) {
        if (!visible.has(section)) return;
        if (!best || section.offsetTop < best.offsetTop) best = section;
      });
      links.forEach(function (link) {
        var match = best && link.getAttribute('href') === '#' + best.id;
        if (match) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    };

    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      setCurrent();
    }, { rootMargin: '-25% 0px -55% 0px' });

    sections.forEach(function (section) { sectionObserver.observe(section); });
  }

  /* ---------- first-visit promo modal ---------- */
  var promo = document.getElementById('promoModal');

  if (promo && typeof promo.showModal === 'function') {
    var SEEN_KEY = 'takumi.promo.seen';

    // sessionStorage, not localStorage: dismissing it should last for the visit,
    // not forever, so a returning visitor sees the offer again on a new session.
    // Private-mode Safari throws on storage access, so a failed read just means
    // the modal shows again — never a broken page.
    var seen = function () {
      try { return window.sessionStorage.getItem(SEEN_KEY) === '1'; }
      catch (e) { return false; }
    };
    var markSeen = function () {
      try { window.sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) {}
    };

    var steps = promo.querySelectorAll('.promodal__step');
    var reasonField = document.getElementById('promoReason');

    var showStep = function (name) {
      steps.forEach(function (step) {
        step.hidden = step.getAttribute('data-step') !== name;
      });
      // The dialog's label must point at the heading that is actually showing.
      promo.setAttribute('aria-labelledby', name === 'claim' ? 'promoClaimTitle' : 'promoTitle');
    };

    var close = function () {
      markSeen();
      promo.close();
    };

    promo.querySelectorAll('.promodal__opt').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (reasonField) reasonField.value = btn.textContent.trim();
        showStep('claim');
        var email = document.getElementById('promoEmail');
        if (email) email.focus();
      });
    });

    promo.querySelectorAll('[data-promodal-close]').forEach(function (btn) {
      btn.addEventListener('click', close);
    });

    // Click on the backdrop, not on the panel.
    promo.addEventListener('click', function (e) {
      if (e.target === promo) close();
    });

    // Escape fires 'cancel' before the dialog closes itself.
    promo.addEventListener('cancel', markSeen);

    // Details are on their way out; do not nag on the next visit.
    var promoForm = promo.querySelector('.promodal__form');
    if (promoForm) promoForm.addEventListener('submit', markSeen);

    if (!seen()) {
      // Short delay so the panel lands after first paint rather than over it.
      window.setTimeout(function () { promo.showModal(); }, reduceMotion ? 0 : 600);
    }
  }

  /* ---------- lead forms -> Google Sheet ---------- */
  /* Paste the Apps Script web-app URL here (ends in /exec). While it is empty
     the forms fall back to their mailto action, so the page still works. */
  var LEAD_ENDPOINT = 'https://script.google.com/macros/s/AKfycbz5k2unpVHviStvH5XEisbAC50gCNpEjZwIPdF7hdTtCaekrUKufo_zcZE04GpJUtleUw/exec';
  var LEAD_TOKEN = 'takumi-2026';   // must match SHARED_TOKEN in the Apps Script

  var leadForms = document.querySelectorAll('[data-lead-form]');

  if (LEAD_ENDPOINT) {
    leadForms.forEach(function (form) {
      var status = form.querySelector('.form-status');
      var submit = form.querySelector('button[type="submit"]');

      var say = function (msg, state) {
        if (!status) return;
        status.textContent = msg;
        if (state) status.setAttribute('data-state', state);
        else status.removeAttribute('data-state');
      };

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!form.reportValidity()) return;
                                                                                                                                                                                 
        var data = {
          token: LEAD_TOKEN,
          source: form.getAttribute('data-source') || '',
          page: window.location.href
        };
        // Field names carry spaces (they were written for the mailto body), so
        // map them to plain keys the sheet can use as columns.
        var map = {
          'Full name': 'name',
          'Email address': 'email',
          'Phone number': 'phone',
          'Reason': 'reason',
          'bot_field': 'bot_field'
        };
        new FormData(form).forEach(function (value, key) {
          data[map[key] || key] = value;
        });
        data.consent = form.querySelector('input[name="consent"]').checked;

        form.classList.add('is-sending');
        if (submit) submit.disabled = true;
        say('Sending…');

        // text/plain keeps this a CORS-simple request: Apps Script web apps do
        // not answer preflight, so any JSON content-type here would fail.
        window.fetch(LEAD_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(data)
        })
          .then(function (res) { return res.json(); })
          .then(function (out) {
            if (!out || !out.ok) throw new Error((out && out.error) || 'rejected');
            form.reset();
            say('Thanks — we have your details and will be in touch shortly.');
            if (submit) submit.disabled = false;
            form.classList.remove('is-sending');
          })
          .catch(function () {
            say('Something went wrong. Please email info@majorsgroup.au or call 1800 625 677.', 'error');
            if (submit) submit.disabled = false;
            form.classList.remove('is-sending');
          });
      });
    });
  }
})();
