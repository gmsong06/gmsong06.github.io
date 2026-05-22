(function () {
  const stored = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = stored || 'dark';
  document.documentElement.setAttribute('data-theme', theme);

  function injectNav() {
    const nav = document.getElementById('site-nav');
    if (!nav) return;
    const depth = (location.pathname.match(/\//g) || []).length - 1;
    const root = depth > 0 ? '../'.repeat(depth) : '';
    nav.innerHTML = `
      <a href="${root}index.html" class="name">Ann Song</a>
      <a href="${root}projects.html">Projects</a>
      <a href="${root}collections.html">Collections</a>
      <a href="${root}thoughts.html">Thoughts</a>
      <button class="theme-toggle" id="theme-toggle" aria-label="Toggle dark mode">
        <svg class="icon-sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        <span class="toggle-track"><span class="toggle-thumb"></span></span>
        <svg class="icon-moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      </button>
    `;
  }

  document.addEventListener('DOMContentLoaded', function () {
    injectNav();

    // theme toggle
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', function () {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
      });
    }

    const yarnColors = ['#fd73a9', '#b39ddb', '#80cbc4', '#f48fb1', '#a5d6a7', '#ffcc80'];
    const crochetTitle = document.getElementById('crochet-title');
    if (crochetTitle) {
      crochetTitle.addEventListener('mouseenter', function (e) {
        const count = 10 + Math.floor(Math.random() * 5);
        for (let i = 0; i < count; i++) {
          const strand = document.createElement('div');
          strand.className = 'yarn-strand';
          const w = 2 + Math.random() * 3;
          const h = 8 + Math.random() * 14;
          strand.style.width = w + 'px';
          strand.style.height = h + 'px';
          strand.style.background = yarnColors[Math.floor(Math.random() * yarnColors.length)];
          strand.style.left = e.clientX + 'px';
          strand.style.top = e.clientY + 'px';
          document.body.appendChild(strand);

          const tx = (Math.random() - 0.5) * 70;
          const ty = -(25 + Math.random() * 55);
          const r0 = Math.random() * 360;
          const r1 = r0 + 180 + Math.random() * 360;

          strand.animate([
            { transform: `translate(-50%, -50%) rotate(${r0}deg) scale(1)`, opacity: 1 },
            { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) rotate(${r1}deg) scale(0.4)`, opacity: 0 }
          ], {
            duration: 900 + Math.random() * 500,
            easing: 'ease-out',
            fill: 'forwards'
          }).onfinish = () => strand.remove();
        }
      });
    }

    // collections data
    const collectionData = {
      crochet: {
        type: 'projects',
        title: 'Crochet',
        sortOptions: [
          { label: 'A–Z', col: 'name' },
          { label: 'Date', col: 'date' },
        ],
        items: [
          { name: 'Strawberry Cow',       assets: [], description: 'A little green frog made with DK weight yarn. My first amigurumi.', date: '2023-03-15' },
          { name: 'Mouse in a Teacup',    assets: [], description: 'WIP — using leftover yarn scraps in earthy tones.', date: '2023-07-20' },
          { name: 'Cheeseburger',         assets: [], description: 'Made in a weekend. Cream colored cotton yarn.', date: '2023-10-08' },
          { name: 'Pink Cupcake',         assets: [], description: 'Market bag in a wavy stitch pattern. Holds a surprising amount.', date: '2024-01-14' },
          { name: 'Elephant',             assets: [], description: 'Quick little gift. Uses seed beads for texture.', date: '2024-04-22' },
          { name: 'Bear with Bucket Hat', assets: [], description: 'About 3 inches tall. Lives on my desk.', date: '2024-08-05' },
          { name: 'Christmas Bunny',      assets: [], description: 'About 3 inches tall. Lives on my desk.', date: '2024-11-30' },
          { name: 'Strawberry Cat Plant', assets: [], description: 'About 3 inches tall. Lives on my desk.', date: '2025-02-10' },
          { name: 'Peppa Pig',            assets: [], description: 'About 3 inches tall. Lives on my desk.', date: '2025-04-28' },
        ]
      },
      apples: {
        type: 'table',
        title: 'Apples',
        sortOptions: [
          { label: 'A–Z', col: '0' },
          { label: 'Sweetness', col: '1' },
          { label: 'Tartness', col: '2' },
          { label: 'Intensity', col: '3' },
          { label: 'Crunch', col: '4' },
          { label: 'Rating', col: '5' },
        ],
        columns: ['Variety', 'Sweetness', 'Tartness', 'Intensity', 'Crunch', 'Rating'],
        rows: [
          { image: 'assets/apples/fuji.jpeg', cells: ['Fuji', 4.5, 2, 3.5, 4, '8/10'] },
          { image: 'assets/apples/gala.jpeg', cells: ['Gala', 3, 0, 2, 3, '7/10'] },
          { image: 'assets/apples/golden_delicious.jpeg', cells: ['Golden Delicious', 3.5, 3.5, 4, 2, '8/10'] },
          { image: 'assets/apples/cortland.jpeg', cells: ['Cortland', 2, 2, 2.5, 1, '7/10'] },
          { image: 'assets/apples/mcintosh.jpeg', cells: ['McIntosh', 2, 3.5, 3, 0, '5/10'] },
          { image: 'assets/apples/sugarbee.jpeg', cells: ['Sugarbee', 5, 0, 4, 5, '10/10'] },
          { image: 'assets/apples/pink_lady.jpeg', cells: ['Pink Lady', 4, 2, 4, 4.5, '8.5/10'] },
          { image: 'assets/apples/granny_smith.jpeg', cells: ['Granny Smith', 0, 5, 4, 3.5, '4/10'] },
          { image: 'assets/apples/cosmic_crisp.jpeg', cells: ['Cosmic Crisp', 3.5, 0, 1, 5, '8.3/10'] },
          { image: 'assets/apples/honeycrisp.jpeg', cells: ['Honeycrisp', 3, 1, 3, 3, '7/10'] },
          { image: 'assets/apples/envy.jpeg', cells: ['Envy', 4.5, 1, 4.5, 4, '9.5/10'] },
          { image: 'assets/apples/cherry_apple.jpeg', cells: ['Cherry Apple', 0, 4, 0, 0, '1/10'] },
          { image: 'assets/apples/opal.jpeg', cells: ['Opal', 4.5, 0, 4.5, 1, '8.5/10'] },
          { image: 'assets/apples/sweetango.jpeg', cells: ['SweeTango', 2.5, 3, 2.5, 4, '7/10'] },
          { image: 'assets/apples/juici.jpeg', cells: ['Juici', 2, 0, 1, 1, '5/10'] },
        ]
      }
    };

    const overlay      = document.getElementById('modal-overlay');
    const modalTitle   = document.getElementById('modal-title');
    const modalBody    = document.getElementById('modal-body');
    const modalClose   = document.getElementById('modal-close');
    const searchInput  = document.getElementById('modal-search');
    const sortControls = document.getElementById('modal-sort');
    const lightbox     = document.getElementById('lightbox');
    const lightboxImg  = document.getElementById('lightbox-img');

    let currentKey = null;
    let sortState  = { col: null, dir: -1 };

    function parseRating(str) { return parseFloat(str) || 0; }

    function formatDate(dateStr) {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    var STAR_COLS = [1, 2, 3, 4]; // Sweetness, Tartness, Intensity, Crunch

    function renderStars(val) {
      val = parseFloat(val) || 0;
      var html = '';
      for (var i = 1; i <= 5; i++) {
        if (val >= i) {
          html += '<span class="star-f">★</span>';
        } else if (val >= i - 0.5) {
          html += '<span class="star-hw"><span class="star-he">☆</span><span class="star-hf">★</span></span>';
        } else {
          html += '<span class="star-e">☆</span>';
        }
      }
      return html;
    }

    function openLightbox(src) {
      if (!lightbox || !lightboxImg || !src) return;
      lightboxImg.src = src;
      lightbox.classList.add('open');
    }

    function makeImgEl(src, className, alt) {
      if (src) {
        const img = document.createElement('img');
        img.src = src; img.className = className; img.alt = alt || '';
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', function (e) { e.stopPropagation(); openLightbox(src); });
        return img;
      }
      const div = document.createElement('div');
      div.className = className;
      return div;
    }

    function makeCarousel(assets, className, alt) {
      const valid = (assets || []).filter(Boolean);
      if (valid.length === 0) {
        const div = document.createElement('div');
        div.className = className;
        return div;
      }
      if (valid.length === 1) return makeImgEl(valid[0], className, alt);

      let idx = 0;
      const wrap = document.createElement('div');
      wrap.className = 'carousel-wrap';

      const img = document.createElement('img');
      img.src = valid[0]; img.className = className; img.alt = alt || '';
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', function (e) { e.stopPropagation(); openLightbox(valid[idx]); });
      wrap.appendChild(img);

      const prev = document.createElement('button');
      prev.className = 'carousel-btn carousel-prev'; prev.textContent = '‹';
      const next = document.createElement('button');
      next.className = 'carousel-btn carousel-next'; next.textContent = '›';

      const dotsEl = document.createElement('div');
      dotsEl.className = 'carousel-dots';
      valid.forEach(function (_, i) {
        const dot = document.createElement('span');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dotsEl.appendChild(dot);
      });

      function goTo(n) {
        idx = (n + valid.length) % valid.length;
        img.src = valid[idx];
        dotsEl.querySelectorAll('.carousel-dot').forEach(function (d, i) {
          d.classList.toggle('active', i === idx);
        });
      }

      prev.addEventListener('click', function (e) { e.stopPropagation(); goTo(idx - 1); });
      next.addEventListener('click', function (e) { e.stopPropagation(); goTo(idx + 1); });
      wrap.appendChild(prev); wrap.appendChild(next); wrap.appendChild(dotsEl);
      return wrap;
    }

    function renderContent() {
      const data = collectionData[currentKey];
      if (!data) return;
      const q = searchInput ? searchInput.value.toLowerCase() : '';
      modalBody.innerHTML = '';
      modalBody.classList.remove('modal-body--grid');

      if (data.type === 'projects') {
        modalBody.classList.add('modal-body--grid');
        let items = data.items.filter(function (item) {
          return !q || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
        });
        if (sortState.col !== null) {
          items = items.slice().sort(function (a, b) {
            if (sortState.col === 'name') return a.name.localeCompare(b.name) * sortState.dir;
            if (sortState.col === 'date') return (new Date(a.date) - new Date(b.date)) * sortState.dir;
            return 0;
          });
        }
        items.forEach(function (item) {
          const el = document.createElement('div');
          el.className = 'modal-project';
          el.appendChild(makeCarousel(item.assets, 'modal-project-img', item.name));
          const info = document.createElement('div');
          info.className = 'modal-project-info';
          const dateHtml = item.date ? `<div class="modal-project-date">${formatDate(item.date)}</div>` : '';
          info.innerHTML = `<div class="modal-project-name">${item.name}</div><div class="modal-project-desc">${item.description}</div>${dateHtml}`;
          el.appendChild(info);
          modalBody.appendChild(el);
        });

      } else if (data.type === 'table') {
        modalBody.classList.remove('modal-body--grid');
        let rows = data.rows.filter(function (row) {
          return !q || row.cells.some(function (c) { return String(c).toLowerCase().includes(q); });
        });
        if (sortState.col !== null) {
          const col = parseInt(sortState.col);
          rows = rows.slice().sort(function (a, b) {
            if (col === 0) return a.cells[0].localeCompare(b.cells[0]) * sortState.dir;
            const av = col === 5 ? parseRating(a.cells[col]) : parseFloat(a.cells[col]) || 0;
            const bv = col === 5 ? parseRating(b.cells[col]) : parseFloat(b.cells[col]) || 0;
            return (av - bv) * sortState.dir;
          });
        }
        const wrapper = document.createElement('div');
        wrapper.style.overflowX = 'auto';
        const table = document.createElement('table');
        table.className = 'collection-table';
        const thead = document.createElement('thead');
        const hr = document.createElement('tr');
        hr.appendChild(document.createElement('th'));
        data.columns.forEach(function (col) {
          const th = document.createElement('th');
          th.textContent = col;
          hr.appendChild(th);
        });
        thead.appendChild(hr);
        table.appendChild(thead);
        const tbody = document.createElement('tbody');
        rows.forEach(function (row) {
          const tr = document.createElement('tr');
          const imgTd = document.createElement('td');
          imgTd.appendChild(makeImgEl(row.image, 'apple-img', row.cells[0]));
          tr.appendChild(imgTd);
          row.cells.forEach(function (cell, ci) {
            const td = document.createElement('td');
            if (STAR_COLS.indexOf(ci) !== -1) {
              td.innerHTML = renderStars(cell);
            } else {
              td.textContent = cell;
            }
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        wrapper.appendChild(table);
        modalBody.appendChild(wrapper);
      }
    }

    function closeModal() {
      if (!overlay) return;
      overlay.classList.add('closing');
      setTimeout(function () { overlay.classList.remove('open', 'closing', 'modal--wide'); }, 210);
    }

    function handleSort(col) {
      sortState.dir = sortState.col === col ? sortState.dir * -1 : -1;
      sortState.col = col;
      sortControls.querySelectorAll('.sort-btn').forEach(function (b) {
        b.classList.remove('active');
        b.textContent = b.dataset.label;
      });
      const activeBtn = sortControls.querySelector('.sort-btn[data-col="' + col + '"]');
      if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.textContent = activeBtn.dataset.label + (sortState.dir === -1 ? ' ▼' : ' ▲');
      }
      renderContent();
    }

    function openModal(key) {
      const data = collectionData[key];
      if (!data || !overlay) return;
      currentKey = key;
      const opts = data.sortOptions || [];
      const firstCol = opts.length ? opts[0].col : null;
      sortState = { col: firstCol, dir: 1 };
      if (searchInput) searchInput.value = '';
      if (sortControls) {
        sortControls.innerHTML = '<span class="sort-label">Sort by</span>';
        opts.forEach(function (opt) {
          const btn = document.createElement('button');
          btn.className = 'sort-btn';
          btn.dataset.col = opt.col;
          btn.dataset.label = opt.label;
          btn.textContent = opt.label;
          btn.addEventListener('click', function () { handleSort(opt.col); });
          sortControls.appendChild(btn);
        });
        sortControls.style.display = opts.length ? 'flex' : 'none';
        const firstBtn = sortControls.querySelector('.sort-btn');
        if (firstBtn) { firstBtn.classList.add('active'); firstBtn.textContent = firstBtn.dataset.label + ' ▲'; }
      }
      modalTitle.textContent = data.title;
      overlay.classList.remove('closing');
      overlay.classList.add('modal--wide');
      renderContent();
      overlay.classList.add('open');
    }

    if (searchInput) searchInput.addEventListener('input', renderContent);

    document.querySelectorAll('[data-collection]').forEach(function (card) {
      card.addEventListener('click', function () { openModal(card.dataset.collection); });
    });

    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (overlay) overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (lightbox && lightbox.classList.contains('open')) lightbox.classList.remove('open');
        else closeModal();
      }
    });
    if (lightbox) lightbox.addEventListener('click', function () { lightbox.classList.remove('open'); });

    const mangotitle = document.querySelector('.listening-title');
    if (mangotitle) {
      mangotitle.addEventListener('mouseenter', function (e) {
        const count = 10 + Math.floor(Math.random() * 6);
        for (let i = 0; i < count; i++) {
          const dot = document.createElement('div');
          dot.className = 'splatter-dot';
          const size = 3 + Math.random() * 7;
          dot.style.width = size + 'px';
          dot.style.height = size + 'px';
          dot.style.left = e.clientX + 'px';
          dot.style.top = e.clientY + 'px';
          document.body.appendChild(dot);

          const angle = Math.random() * 2 * Math.PI;
          const dist = 20 + Math.random() * 60;
          const tx = Math.cos(angle) * dist;
          const ty = Math.sin(angle) * dist;

          dot.animate([
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
            { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`, opacity: 0 }
          ], {
            duration: 700 + Math.random() * 400,
            easing: 'ease-out',
            fill: 'forwards'
          }).onfinish = () => dot.remove();
        }
      });
    }
  });
})();
