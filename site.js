// Robin Thomas Design & Gallery — preview site behaviour. No dependencies.
(function () {
  var POOL = (window.RTD_PHOTOS || []).slice();

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  // ---- Lightbox (event-delegated so dynamically added photos work) ----
  var lb = document.createElement('div');
  lb.className = 'lb';
  lb.innerHTML = '<button class="lb-close" aria-label="Close">×</button><button class="lb-prev" aria-label="Previous">‹</button><img alt=""><button class="lb-next" aria-label="Next">›</button>';
  document.body.appendChild(lb);
  var lbImg = lb.querySelector('img'), items = [], idx = 0;
  function links() { return Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]')); }
  function show(i) { items = links(); if (!items.length) return; idx = (i + items.length) % items.length; lbImg.src = items[idx].href; lbImg.alt = items[idx].querySelector('img').alt || ''; lb.classList.add('open'); }
  function close() { lb.classList.remove('open'); }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-lightbox]');
    if (!a) return;
    e.preventDefault(); show(links().indexOf(a));
  });
  lb.querySelector('.lb-close').addEventListener('click', close);
  lb.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
  lb.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });

  // ---- Home: fresh random sample of project photos on every load ----
  var home = document.getElementById('home-photos');
  if (home && POOL.length) {
    var n = parseInt(home.getAttribute('data-count'), 10) || 8;
    var pick = shuffle(POOL.slice()).slice(0, n);
    home.innerHTML = pick.map(function (p) {
      return '<a class="photo-cell" href="' + p.s + '" data-lightbox><img src="' + p.s + '" alt="Robin Thomas Design project" loading="lazy"></a>';
    }).join('');
  }

  // ---- Projects page: endless aisle, random order, masonry with true aspect ratios ----
  var aisle = document.getElementById('aisle');
  if (aisle && POOL.length) {
    var order = shuffle(POOL.slice());
    var initial = parseInt(aisle.getAttribute('data-initial'), 10) || 15;
    var step = parseInt(aisle.getAttribute('data-step'), 10) || 12;
    var cursor = 0;
    var ROW = 8;
    var LABEL = 26;   // px reserved under each photo for its identifier label

    function gap() { return parseFloat(getComputedStyle(aisle).gap) || 16; }
    function colWidth() {
      var cols = getComputedStyle(aisle).gridTemplateColumns.split(' ').length;
      return (aisle.clientWidth - gap() * (cols - 1)) / cols;
    }
    function sizeItem(el) {
      var w = +el.getAttribute('data-w'), h = +el.getAttribute('data-h');
      var px = colWidth() * h / w + LABEL;
      el.style.gridRowEnd = 'span ' + Math.max(1, Math.ceil((px + gap()) / (ROW + gap())));
    }
    function sizeAll() { Array.prototype.forEach.call(aisle.children, sizeItem); }

    function addBatch(count) {
      var slice = order.slice(cursor, cursor + count);
      cursor += slice.length;
      slice.forEach(function (p) {
        var a = document.createElement('a');
        a.className = 'aisle-item'; a.href = p.s; a.setAttribute('data-lightbox', '');
        a.setAttribute('data-w', p.w); a.setAttribute('data-h', p.h);
        var label = p.t || p.s.split('/').pop().replace(/\.jpg$/i, '');
        a.innerHTML = '<img src="' + p.s + '" alt="Robin Thomas Design project" loading="lazy" style="aspect-ratio:' + p.w + '/' + p.h + '"><span class="aisle-label">' + label + '</span>';
        aisle.appendChild(a);
        sizeItem(a);
        var img = a.querySelector('img');
        var reveal = function () { a.classList.add('in'); };
        if (img.complete) reveal(); else { img.onload = reveal; img.onerror = reveal; }
      });
      if (cursor >= order.length && sentinel) { obs && obs.disconnect(); sentinel.remove(); }
    }

    var sentinel = document.getElementById('aisle-sentinel');
    var obs = null;
    addBatch(initial);
    if ('IntersectionObserver' in window && sentinel) {
      obs = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) addBatch(step);
      }, { rootMargin: '600px 0px' });
      obs.observe(sentinel);
    } else {
      addBatch(order.length);  // no observer support: show everything
    }
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(sizeAll, 120); });
  }
})();
