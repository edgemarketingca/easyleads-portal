/* Easyleads website snippet
   Sends two things to the client's Easyleads dashboard: form submissions and taps on a phone number.
   No cookies, no tracking across sites, no passwords or payment fields. The last way the visitor
   arrived (Google, an ad, social, another site, direct) is remembered on this site only, so each
   lead shows where it came from.

   <script src="https://edgemarketingca.github.io/easyleads-portal/t.js" data-site="example.com" data-key="..." async></script> */
(function () {
  'use strict';
  var me = document.currentScript || document.querySelector('script[data-key][src*="easyleads-portal/t.js"]');
  if (!me || window.__easyleadsSnippet) return;
  window.__easyleadsSnippet = 1;
  var SITE = me.getAttribute('data-site'), KEY = me.getAttribute('data-key');
  var API = me.getAttribute('data-api') || 'https://script.google.com/macros/s/AKfycbwa_jvv1NsUezJ3NA03wy8eAk7S72IZO4x_x_g4hn9LgIlzsTdh17Wi7yF1en849p1_Nw/exec';
  if (!SITE || !KEY) return;

  /* Where the visitor came from: kept until a new, non-direct visit replaces it. */
  function arrival() {
    var q = {}, ref = '', host = '';
    try { location.search.replace(/^\?/, '').split('&').forEach(function (p) { var kv = p.split('='); if (kv[0]) q[decodeURIComponent(kv[0]).toLowerCase()] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' ')); }); } catch (e) {}
    try { ref = document.referrer; host = ref ? new URL(ref).hostname.replace(/^www\./, '') : ''; } catch (e) {}
    if (host && host === location.hostname.replace(/^www\./, '')) host = '';
    var m = (q.utm_medium || '').toLowerCase(), so = (q.utm_source || '').toLowerCase(), ch;
    var AI = /chatgpt|openai|perplexity|gemini\.google|bard\.google|copilot\.microsoft|claude\.ai|meta\.ai|deepseek|grok\.com|mistral\.ai|you\.com|phind/;
    if (q.gclid || q.gbraid || q.wbraid || q.msclkid || /cpc|ppc|paid/.test(m)) ch = 'Paid search';
    else if (q.fbclid || /social/.test(m)) ch = 'Social';
    else if (/e-?mail|newsletter/.test(m)) ch = 'Email';
    else if (AI.test(host) || AI.test(so)) ch = 'AI assistant';     /* ChatGPT, Perplexity, Gemini, Copilot, Claude... */
    else if (so) ch = 'Campaign';
    else if (/(^|\.)(google|bing|yahoo|duckduckgo|ecosia|baidu|yandex)\./.test(host)) ch = 'Organic search';
    else if (/facebook|instagram|linkedin|twitter|^t\.co$|tiktok|pinterest|youtube|reddit/.test(host)) ch = 'Social';
    else if (host) ch = 'Referral';
    else ch = 'Direct';
    var med = m || (ch === 'Organic search' ? 'organic' : ch === 'Paid search' ? 'cpc' : host ? 'referral' : '(none)');
    return { ch: ch, s: (so || host || (q.gclid ? 'google' : '(direct)')) + ' / ' + med };
  }
  var came = null;
  try { came = JSON.parse(localStorage.getItem('el_came') || 'null'); } catch (e) {}
  var now = arrival();
  if (!came || now.ch !== 'Direct') { came = now; try { localStorage.setItem('el_came', JSON.stringify(came)); } catch (e) {} }

  function send(o) {
    o.action = 'siteHit'; o.d = SITE; o.k = KEY; o.p = location.pathname.slice(0, 250); o.ch = came.ch; o.s = came.s;
    o.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    var body = JSON.stringify(o);
    try { if (navigator.sendBeacon && navigator.sendBeacon(API, new Blob([body], { type: 'text/plain;charset=UTF-8' }))) return; } catch (e) {}
    try { fetch(API, { method: 'POST', body: body, mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain;charset=UTF-8' } }); } catch (e) {}
  }

  /* A heartbeat at most every 12 hours per visitor, so the console can show the snippet is installed
     and reporting even before the first lead. It carries no visitor details. */
  try { var lp = Number(localStorage.getItem('el_ping') || 0); if (Date.now() - lp > 432e5) { localStorage.setItem('el_ping', String(Date.now())); setTimeout(function () { send({ t: 'ping' }); }, 1500); } } catch (e) {}

  /* ---------- forms ---------- */
  var SKIP = /pass|card|cc-?num|cvv|cvc|expir|ssn|social.?ins|sin\b|iban|routing|account.?num|security|captcha|recaptcha|token|nonce|honeypot|_wp|g-recaptcha/i;
  function labelOf(el) {
    var t = '';
    try { if (el.id) { var l = document.querySelector('label[for="' + (window.CSS && CSS.escape ? CSS.escape(el.id) : el.id) + '"]'); if (l) t = l.textContent; } } catch (e) {}
    if (!t && el.closest) { var w = el.closest('label'); if (w) t = w.textContent; }
    t = t || el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.name || el.id || '';
    return String(t).replace(/\s+/g, ' ').replace(/[*:\s]+$/, '').trim().slice(0, 60);
  }
  function grab(form) {
    var f = {}, n = 0, trap = false;
    Array.prototype.forEach.call(form.elements || [], function (el) {
      var type = (el.type || '').toLowerCase(), name = el.name || el.id || '';
      if (!name || el.disabled) return;
      if (/^(submit|button|reset|file|image|password|hidden)$/.test(type)) return;
      if ((type === 'checkbox' || type === 'radio') && !el.checked) return;
      var label = labelOf(el);
      if (SKIP.test(name) || SKIP.test(label) || /cc-/.test(el.getAttribute('autocomplete') || '')) return;
      var v = String(el.value || '').trim();
      if (!v) return;
      /* a hidden trap field a person can't see or fill in: a bot filled it */
      if (el.offsetParent === null && type !== 'checkbox' && type !== 'radio' && !/select/.test(el.tagName.toLowerCase())) { if (/hp|honey|website|url|trap/i.test(name)) trap = true; return; }
      var k = label || name;
      f[k] = f[k] ? f[k] + ', ' + v.slice(0, 1000) : v.slice(0, 1000);
      n++;
    });
    return trap || !n ? null : f;
  }
  function onForm(form) {
    var f = grab(form);
    if (!f) return;
    var email = '', phone = '', name = '', first = '', lastName = '';
    Object.keys(f).forEach(function (k) {
      var v = f[k];
      if (!email && (/e-?mail/i.test(k) || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v))) email = v;
      else if (!phone && /phone|tel|mobile|cell/i.test(k)) phone = v;
      else if (!first && /first|given/i.test(k) && /name/i.test(k)) first = v;
      else if (!lastName && /last|sur|family/i.test(k) && /name/i.test(k)) lastName = v;
      else if (!name && /name/i.test(k) && !/company|business|organi/i.test(k)) name = v;
    });
    if (first || lastName) name = (first + ' ' + lastName).trim();
    if (!email && !phone) return;                 /* searches and logins aren't leads */
    /* the same person sending the same form again within 30 minutes is one lead */
    var dk = 'el_sent_' + (email + '|' + phone).toLowerCase().replace(/[^a-z0-9@|.+-]/g, '').slice(0, 80);
    try { if (Date.now() - Number(sessionStorage.getItem(dk) || 0) < 18e5) return; } catch (e) {}
    var title = formName(form);
    var hit = { t: 'form', form: String(title).slice(0, 100), f: f, email: email, phone: phone, name: name };
    /* Wait a moment and look at the form again: if the site's own check rejected it (a required field,
       a bad email, a failed captcha), it isn't a lead yet. If the page is leaving, send straight away. */
    var done = false;
    function go() { if (done) return; done = true; window.removeEventListener('pagehide', go); try { sessionStorage.setItem(dk, String(Date.now())); } catch (e) {} send(hit); }
    window.addEventListener('pagehide', go);
    setTimeout(function () { if (done) return; if (rejected(form)) { done = true; window.removeEventListener('pagehide', go); return; } go(); }, 1800);
  }
  /* The form's name as the website shows it: the form builder's own title, a label on the form, a
     heading in or just above it, and only then the page's title. */
  var GENERIC = /^(form|forms?\s*\d*|contact|contact\s*form\s*\d*|new form|untitled( form)?|wpforms-form-\d+|gform_\d+|elementor-form|et_pb_contact_form.*|\d+)$/i;
  function txt(el) { return el ? String(el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100) : ''; }
  function okName(t) { return t && t.length > 1 && t.length <= 90 && !GENERIC.test(t) ? t : ''; }
  function formName(form) {
    var t = '', box, i, el, s, h;
    var builders = [['.et_pb_contact_form_container', '.et_pb_contact_main_title'], ['.gform_wrapper', '.gform_title'], ['.wpforms-container', '.wpforms-title'],
      ['.nf-form-cont', '.nf-form-title'], ['.frm_forms', '.frm_form_title'], ['.fluentform', '.ff-form-title'], ['.elementor-widget-form', '.elementor-heading-title']];
    for (i = 0; i < builders.length && !t; i++) { box = form.closest ? form.closest(builders[i][0]) : null; if (box) t = okName(txt(box.querySelector(builders[i][1]))); }
    if (!t) { var lb = form.getAttribute('aria-labelledby'); if (lb) t = okName(txt(document.getElementById(lb.split(' ')[0]))); }
    if (!t) t = okName(form.getAttribute('aria-label') || '') || okName(form.getAttribute('data-name') || '') || okName(form.getAttribute('data-form-name') || '') || okName(form.getAttribute('title') || '') || okName(form.getAttribute('name') || '');
    if (!t) t = okName(txt(form.querySelector('legend, h1, h2, h3, h4')));
    /* the closest heading above the form, a few levels up */
    var stop = false;
    for (el = form, i = 0; !t && !stop && el && el !== document.body && i < 5; i++, el = el.parentElement) {
      for (s = el.previousElementSibling; s && !t; s = s.previousElementSibling) {
        if (s.tagName === 'FORM' || (s.querySelector && s.querySelector('form'))) { stop = true; break; }   /* another form's heading */
        h = /^H[1-4]$/.test(s.tagName) ? s : (s.querySelectorAll ? s.querySelectorAll('h1, h2, h3, h4') : []);
        if (h && h.length !== undefined) h = h[h.length - 1];
        t = okName(txt(h));
      }
    }
    if (!t) t = okName(String(document.title || '').split(/\s+[|\u2013\u2014-]\s+/)[0].trim()) || 'Website form';
    return t;
  }
  function rejected(form) {
    if (!form.isConnected) return false;
    if (form.querySelector('[aria-invalid="true"], .et_contact_error, .wpcf7-not-valid, .gfield_error, .wpforms-error, .error, .invalid, .is-invalid, .has-error')) return true;
    var box = form.parentNode && form.parentNode.parentNode, msg = box && box.querySelector ? box.querySelector('.et-pb-contact-message, .wpcf7-response-output, .gform_validation_errors') : null;
    return !!(msg && /error|please|required|invalid|incorrect|failed|try again/i.test(msg.textContent || '') && !/thank|success|sent|received/i.test(msg.textContent || ''));
  }
  document.addEventListener('submit', function (e) { var t = e.target; if (t && t.tagName === 'FORM') { try { onForm(t); } catch (err) {} } }, true);

  /* ---------- phone taps ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href^="tel:"]') : null;
    if (!a) return;
    var num = ''; try { num = decodeURIComponent(a.getAttribute('href').slice(4)); } catch (err) { num = a.getAttribute('href').slice(4); }
    send({ t: 'tap', phone: num.replace(/[^\d+()\-.\s]/g, '').slice(0, 40) });
  }, true);
})();
