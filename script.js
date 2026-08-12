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
})();
