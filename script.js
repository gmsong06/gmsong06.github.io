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
      <button class="theme-toggle" id="theme-toggle" aria-label="Toggle dark mode">
        <svg class="icon-sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        <span class="toggle-track"><span class="toggle-thumb"></span></span>
        <svg class="icon-moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      </button>
    `;
  }

  function generateLogNav(options) {
    const force = options && options.force;
    const nav = document.querySelector('.log-nav');
    if (!nav) return;
    if (!force && nav.dataset.generated === 'true') return;
    const activePanel = document.querySelector('.tab-panel.active');
    const root = activePanel && activePanel.contains(nav) ? activePanel : document;
    const entries = Array.from(root.querySelectorAll('.log-entry[id]')).sort(function (a, b) {
      const aDate = a.querySelector('.log-date');
      const bDate = b.querySelector('.log-date');
      const aText = aDate ? stripMilestoneIcon(aDate.textContent) : '';
      const bText = bDate ? stripMilestoneIcon(bDate.textContent) : '';
      const aTime = parseLogDate(aText);
      const bTime = parseLogDate(bText);
      if (aTime !== null && bTime !== null) return aTime - bTime;
      if (aTime !== null) return -1;
      if (bTime !== null) return 1;
      return 0;
    });
    if (!entries.length) return;
    nav.innerHTML = '';
    entries.forEach(function (entry) {
      const dateEl = entry.querySelector('.log-date');
      const dateText = dateEl ? stripMilestoneIcon(dateEl.textContent) : entry.id;
      const label = dateText.replace(/,?\s*\d{4}$/, '').trim();
      const isMilestone = entry.classList.contains('is-milestone');
      const a = document.createElement('a');
      a.className = 'log-nav-item' + (isMilestone ? ' is-milestone' : '');
      a.href = '#' + entry.id;
      if (isMilestone) {
        const icon = document.createElement('span');
        icon.className = 'log-nav-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = MILESTONE_ICON;
        a.appendChild(icon);
        a.appendChild(document.createTextNode(' ' + label));
      } else {
        a.textContent = label;
      }
      a.addEventListener('click', function () {
        window.setTimeout(function () {
          updateActiveLogNav({ force: true });
        }, 0);
        window.setTimeout(function () {
          updateActiveLogNav({ force: true });
        }, 360);
      });
      nav.appendChild(a);
    });
    nav.dataset.generated = 'true';
    nav.scrollLeft = nav.scrollWidth;
    updateActiveLogNav({ force: true });
  }

  function logNavRoot(nav) {
    const activePanel = document.querySelector('.tab-panel.active');
    return activePanel && activePanel.contains(nav) ? activePanel : document;
  }

  function keepActiveLogNavItemVisible(nav, item) {
    const itemLeft = item.offsetLeft;
    const itemRight = itemLeft + item.offsetWidth;
    const viewLeft = nav.scrollLeft;
    const viewRight = viewLeft + nav.clientWidth;
    if (itemLeft >= viewLeft && itemRight <= viewRight) return;
    nav.scrollTo({
      left: itemLeft - (nav.clientWidth - item.offsetWidth) / 2,
      behavior: 'auto'
    });
  }

  function updateActiveLogNav(options) {
    const force = options && options.force;
    const nav = document.querySelector('.log-nav');
    if (!nav || nav.closest('[hidden]')) return;
    const root = logNavRoot(nav);
    const entries = Array.from(root.querySelectorAll('.log-entry[id]'));
    if (!entries.length) return;
    const timeline = root.querySelector('.log-timeline');
    const threshold = timeline ? timeline.getBoundingClientRect().bottom + 72 : 160;
    let activeEntry = entries[0];
    entries.forEach(function (entry) {
      if (entry.getBoundingClientRect().top <= threshold) activeEntry = entry;
    });
    if (!force && nav.dataset.activeId === activeEntry.id) return;
    nav.dataset.activeId = activeEntry.id;
    const activeHref = '#' + activeEntry.id;
    let activeItem = null;
    nav.querySelectorAll('.log-nav-item').forEach(function (item) {
      const isActive = item.getAttribute('href') === activeHref;
      item.classList.toggle('is-active', isActive);
      if (isActive) {
        item.setAttribute('aria-current', 'date');
        activeItem = item;
      } else {
        item.removeAttribute('aria-current');
      }
    });
    if (activeItem) keepActiveLogNavItemVisible(nav, activeItem);
  }

  let activeLogNavFrame = null;

  function scheduleActiveLogNav() {
    if (activeLogNavFrame !== null) return;
    activeLogNavFrame = window.requestAnimationFrame(function () {
      activeLogNavFrame = null;
      updateActiveLogNav();
    });
  }

  function initProjectTabs() {
    const tabs = document.querySelectorAll('.project-tab[data-tab]');
    if (!tabs.length) return;
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        const target = document.getElementById(tab.dataset.tab);
        if (!target) return;
        if (tab.classList.contains('active')) return;
        const previousScrollX = window.scrollX;
        const previousScrollY = window.scrollY;
        tabs.forEach(function (btn) {
          btn.classList.toggle('active', btn === tab);
          btn.setAttribute('aria-selected', btn === tab ? 'true' : 'false');
        });
        document.querySelectorAll('.tab-panel').forEach(function (panel) {
          const active = panel === target;
          panel.classList.toggle('active', active);
          panel.hidden = !active;
        });
        if (target.querySelector('.log-nav')) {
          window.requestAnimationFrame(function () {
            generateLogNav();
            updateActiveLogNav({ force: true });
            window.scrollTo(previousScrollX, previousScrollY);
            window.setTimeout(function () {
              window.scrollTo(previousScrollX, previousScrollY);
              updateActiveLogNav({ force: true });
            }, 0);
          });
        }
      });
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function slugify(str) {
    return String(str)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'entry';
  }

  function formatInlineMarkdown(str) {
    function formatLinks(text) {
      return escapeHtml(text).replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_, label, href) {
        return '<a href="' + escapeHtml(href) + '">' + escapeHtml(label) + '</a>';
      });
    }

    const parts = [];
    const re = /(`{1,3})([^`\n]+?)\1/g;
    let last = 0;
    let match;
    while ((match = re.exec(str)) !== null) {
      if (match.index > last) parts.push(formatLinks(str.slice(last, match.index)));
      parts.push('<code class="log-inline-code">' + escapeHtml(match[2]) + '</code>');
      last = re.lastIndex;
    }
    if (last < str.length) parts.push(formatLinks(str.slice(last)));
    return parts.join('');
  }

  function initLogVideos(root) {
    root.querySelectorAll('.log-media video').forEach(function (video) {
      function updateOrientation() {
        video.classList.toggle('is-portrait', video.videoHeight > video.videoWidth);
      }
      if (video.readyState >= 1) updateOrientation();
      video.addEventListener('loadedmetadata', updateOrientation, { once: true });
    });
  }

  function typesetMath(root) {
    if (!root || !window.MathJax) return;
    const run = function () {
      if (window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([root]).catch(function () {});
      }
    };
    if (window.MathJax.startup && window.MathJax.startup.promise) {
      window.MathJax.startup.promise.then(run);
    } else {
      run();
    }
  }

  function parseLogDate(str) {
    const time = Date.parse(str);
    return Number.isNaN(time) ? null : time;
  }

  const DEFAULT_MILESTONE_ICON = String.fromCodePoint(0x1F345);
  // A log can override the icon with data-milestone-icon on its .markdown-log element.
  let MILESTONE_ICON = DEFAULT_MILESTONE_ICON;
  const MILESTONE_ICON_RE = /^\s*(?:[\u2605\u2606]|\p{Extended_Pictographic}\uFE0F?)\s*/u;

  function stripMilestoneIcon(str) {
    return String(str).replace(MILESTONE_ICON_RE, '');
  }

  function milestoneKey(date) {
    const time = parseLogDate(date);
    return time === null ? 'text:' + slugify(date) : 'time:' + time;
  }

  function parseMilestoneLine(line) {
    const item = line.trim().match(/^[-*]\s+(?:[\u2605\u2606]|\p{Extended_Pictographic}\uFE0F?)?\s*(.+)$/u);
    if (!item) return null;
    const months = '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
    const dateMatch = item[1].trim().match(new RegExp('^(' + months + '\\s+\\d{1,2},\\s+\\d{4})(?:\\s*(?:\\u2014|\\u2013|--|-|:)\\s*(.*))?$', 'i'));
    if (!dateMatch) return null;
    const date = dateMatch[1];
    return {
      date: date,
      note: (dateMatch[2] || '').trim(),
      key: milestoneKey(date)
    };
  }

  function renderMilestoneSection(milestones, entryByKey) {
    if (!milestones.length) return '';
    const items = milestones.map(function (milestone) {
      const targetId = entryByKey[milestone.key];
      const dateHtml = targetId
        ? '<a href="#' + targetId + '">' + escapeHtml(milestone.date) + '</a>'
        : escapeHtml(milestone.date);
      const noteHtml = milestone.note
        ? '<span class="log-milestone-note">' + formatInlineMarkdown(milestone.note) + '</span>'
        : '';
      return '<li><span class="log-milestone-icon" aria-hidden="true">' + MILESTONE_ICON + '</span><span><span class="log-milestone-date">' + dateHtml + '</span>' + noteHtml + '</span></li>';
    }).join('');
    return '<section class="log-milestones" aria-label="Milestones"><div class="log-milestones-label">Milestones</div><ul class="log-milestone-list">' + items + '</ul></section>';
  }

  function renderMarkdownLog(markdown) {
    const withoutComments = markdown.replace(/<!--[\s\S]*?-->/g, '').trim();
    if (!withoutComments) return '<p class="log-empty">No log entries yet.</p>';
    const milestones = [];
    const sections = withoutComments.split(/^##\s+/m).filter(Boolean).reduce(function (items, section, index) {
      const lines = section.trim().split(/\r?\n/);
      const date = lines.shift().trim();
      if (/^milestones$/i.test(date)) {
        lines.forEach(function (line) {
          const milestone = parseMilestoneLine(line);
          if (milestone) milestones.push(milestone);
        });
        return items;
      }
      items.push({ date: date, time: parseLogDate(date), lines: lines, index: index });
      return items;
    }, []).sort(function (a, b) {
      if (a.time !== null && b.time !== null) return b.time - a.time;
      if (a.time !== null) return -1;
      if (b.time !== null) return 1;
      return a.index - b.index;
    });
    const seen = {};
    const entryByKey = {};
    sections.forEach(function (section) {
      const idBase = 'log-' + slugify(section.date);
      seen[idBase] = (seen[idBase] || 0) + 1;
      section.id = seen[idBase] > 1 ? idBase + '-' + seen[idBase] : idBase;
      if (section.time !== null && !entryByKey[milestoneKey(section.date)]) {
        entryByKey[milestoneKey(section.date)] = section.id;
      }
    });
    const milestoneByKey = {};
    milestones.forEach(function (milestone) {
      milestoneByKey[milestone.key] = milestone;
    });
    return renderMilestoneSection(milestones, entryByKey) + sections.map(function (section) {
      const lines = section.lines;
      const date = section.date;
      const id = section.id;
      const milestone = milestoneByKey[milestoneKey(date)];
      const blocks = [];
      let paragraph = [];
      let mediaItems = [];
      let listItems = [];
      let listType = null;
      let listStart = null;
      let codeLines = [];
      let inCode = false;
      let tableRows = [];

      function flushParagraph() {
        if (!paragraph.length) return;
        flushMedia();
        flushList();
        flushTable();
        blocks.push('<p>' + formatInlineMarkdown(paragraph.join(' ')) + '</p>');
        paragraph = [];
      }

      function flushMedia() {
        if (!mediaItems.length) return;
        flushList();
        flushTable();
        blocks.push('<div class="log-media">' + mediaItems.join('') + '</div>');
        mediaItems = [];
      }

      function flushList() {
        if (!listItems.length) return;
        const tag = listType === 'ol' ? 'ol' : 'ul';
        const startAttr = tag === 'ol' && listStart ? ' start="' + listStart + '"' : '';
        blocks.push('<' + tag + startAttr + '>' + listItems.join('') + '</' + tag + '>');
        listItems = [];
        listType = null;
        listStart = null;
      }

      function parseTableRow(str) {
        return str.replace(/^\|/, '').replace(/\|$/, '').split('|').map(function (cell) {
          return cell.trim();
        });
      }

      function isTableSeparator(str) {
        return parseTableRow(str).every(function (cell) {
          return /^:?-{3,}:?$/.test(cell);
        });
      }

      function flushTable() {
        if (!tableRows.length) return;
        const parsedRows = tableRows.map(parseTableRow);
        const header = parsedRows[0];
        const bodyRows = parsedRows.slice(isTableSeparator(tableRows[1] || '') ? 2 : 1);
        const headHtml = header.map(function (cell) {
          return '<th>' + formatInlineMarkdown(cell) + '</th>';
        }).join('');
        const bodyHtml = bodyRows.map(function (row) {
          return '<tr>' + row.map(function (cell) {
            return '<td>' + formatInlineMarkdown(cell) + '</td>';
          }).join('') + '</tr>';
        }).join('');
        blocks.push('<div class="log-table-wrap"><table class="log-table"><thead><tr>' + headHtml + '</tr></thead><tbody>' + bodyHtml + '</tbody></table></div>');
        tableRows = [];
      }

      function flushCode() {
        blocks.push('<pre class="log-code"><code>' + escapeHtml(codeLines.join('\n')) + '</code></pre>');
        codeLines = [];
      }

      lines.forEach(function (line) {
        const trimmed = line.trim();
        const media = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        const ordered = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
        const unordered = trimmed.match(/^[-*]\s+(.+)$/);
        const subheading = trimmed.match(/^(#{3,4})\s+(.+)$/);
        const table = trimmed.includes('|');
        if (/^```[A-Za-z0-9_-]*$/.test(trimmed)) {
          if (inCode) {
            flushCode();
            inCode = false;
          } else {
            flushParagraph();
            flushMedia();
            flushList();
            inCode = true;
            codeLines = [];
          }
        } else if (inCode) {
          codeLines.push(line);
        } else if (subheading) {
          flushParagraph();
          flushMedia();
          flushList();
          flushTable();
          const level = subheading[1].length;
          blocks.push('<h' + level + ' class="log-subheading log-subheading--h' + level + '">' + formatInlineMarkdown(subheading[2]) + '</h' + level + '>');
        } else if (!trimmed) {
          flushParagraph();
          flushMedia();
          flushTable();
        } else if (media) {
          flushParagraph();
          const alt = escapeHtml(media[1]);
          const src = escapeHtml(media[2]);
          if (/\.html?$/i.test(src)) {
            const label = alt || 'Interactive demo';
            mediaItems.push('<div class="log-embed"><iframe src="' + src + '" title="' + label + '" loading="lazy"></iframe><figcaption>' + label + ' &middot; <a href="' + src + '" target="_blank" rel="noopener">open in a new tab</a></figcaption></div>');
          } else if (/\.pdf$/i.test(src)) {
            const label = alt || 'Open PDF';
            mediaItems.push('<div class="log-pdf"><iframe src="' + src + '" title="' + label + '" loading="lazy"></iframe><a href="' + src + '">Open ' + label + '</a></div>');
          } else if (/\.(mp4|webm|mov)$/i.test(src)) {
            mediaItems.push('<video src="' + src + '#t=0.001" controls playsinline preload="metadata"></video>');
          } else {
            mediaItems.push('<a class="log-media-link" href="' + src + '"><img src="' + src + '" alt="' + alt + '" loading="lazy" decoding="async" /></a>');
          }
        } else if (ordered || unordered) {
          flushParagraph();
          flushMedia();
          const nextType = ordered ? 'ol' : 'ul';
          if (listType && listType !== nextType) flushList();
          listType = nextType;
          if (ordered && listStart === null) listStart = ordered[1];
          listItems.push('<li>' + formatInlineMarkdown(ordered ? ordered[2] : unordered[1]) + '</li>');
        } else if (table) {
          flushParagraph();
          flushMedia();
          flushList();
          tableRows.push(trimmed);
        } else {
          flushMedia();
          flushList();
          flushTable();
          paragraph.push(trimmed);
        }
      });
      flushParagraph();
      flushMedia();
      flushList();
      flushTable();
      if (inCode) flushCode();

      const entryClass = 'log-entry' + (milestone ? ' is-milestone' : '');
      const dateClass = 'log-date' + (milestone ? ' log-date--milestone' : '');
      const dateLabel = (milestone ? '<span class="log-date-icon" aria-hidden="true">' + MILESTONE_ICON + '</span>' : '') + escapeHtml(date);
      return '<div class="' + entryClass + '" id="' + id + '"><div class="' + dateClass + '">' + dateLabel + '</div><div class="log-body">' + blocks.join('') + '</div></div>';
    }).join('');
  }

  function initMarkdownLogs() {
    document.querySelectorAll('[data-log-src]').forEach(function (el) {
      fetch(el.dataset.logSrc)
        .then(function (response) {
          if (!response.ok) throw new Error('Could not load log');
          return response.text();
        })
        .then(function (markdown) {
          MILESTONE_ICON = el.dataset.milestoneIcon || DEFAULT_MILESTONE_ICON;
          el.innerHTML = renderMarkdownLog(markdown);
          initLogVideos(el);
          typesetMath(el);
          generateLogNav({ force: true });
          updateActiveLogNav({ force: true });
        })
        .catch(function () {
          el.innerHTML = '<p class="log-empty">Could not load the Markdown log.</p>';
        });
    });
  }

  function initLogLightbox() {
    if (!document.querySelector('.markdown-log')) return;
    const box = document.createElement('div');
    box.className = 'lightbox';
    const img = document.createElement('img');
    img.className = 'lightbox-img';
    img.alt = '';
    box.appendChild(img);
    document.body.appendChild(box);

    function close() {
      box.classList.remove('open');
      img.src = '';
    }

    document.addEventListener('click', function (e) {
      const link = e.target.closest ? e.target.closest('.log-media-link') : null;
      if (!link) return;
      e.preventDefault();
      const full = link.querySelector('img');
      img.src = link.getAttribute('href');
      img.alt = full ? full.alt : '';
      box.classList.add('open');
    });

    // Clicking the backdrop closes; clicking the image itself does not.
    box.addEventListener('click', function (e) {
      if (e.target !== img) close();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && box.classList.contains('open')) close();
    });
  }

  function initLogTimelineScroll() {
    document.querySelectorAll('.log-timeline').forEach(function (timeline) {
      const nav = timeline.querySelector('.log-nav');
      const prev = timeline.querySelector('.log-scroll-prev');
      const next = timeline.querySelector('.log-scroll-next');
      if (!nav) return;
      if (prev) {
        prev.addEventListener('click', function () {
          nav.scrollBy({ left: -260, behavior: 'smooth' });
        });
      }
      if (!next) return;
      next.addEventListener('click', function () {
        nav.scrollBy({ left: 260, behavior: 'smooth' });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    injectNav();
    initProjectTabs();
    initMarkdownLogs();
    initLogTimelineScroll();
    initLogLightbox();
    generateLogNav();
    updateActiveLogNav({ force: true });

    // back to top button
    const topBtn = document.createElement('button');
    topBtn.className = 'back-to-top';
    topBtn.setAttribute('aria-label', 'Back to top');
    topBtn.textContent = '↑';
    document.body.appendChild(topBtn);
    window.addEventListener('scroll', function () {
      topBtn.classList.toggle('visible', window.scrollY > 300);
      scheduleActiveLogNav();
    });
    window.addEventListener('resize', scheduleActiveLogNav);
    window.addEventListener('hashchange', function () {
      window.setTimeout(function () {
        updateActiveLogNav({ force: true });
      }, 360);
    });
    topBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // theme toggle
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', function () {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        document.querySelectorAll('.log-embed iframe').forEach(function (frame) {
          if (frame.contentWindow) {
            frame.contentWindow.postMessage({ type: 'theme', theme: next }, '*');
          }
        });
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
        defaultSort: { col: 'date', dir: -1 },
        sortOptions: [
          { label: 'A–Z', col: 'name' },
          { label: 'Date', col: 'date' },
        ],
        items: [
          { name: 'Two Starter Ducks',       assets: ['assets/crochet/first_ducks.png'], description: 'My first ever crochet projects! I started crocheting around this time because I was very stressed junior year of high school and over winter break I randomly decided to buy a crochet kit. I gifted the one on the right went to my dad and the left to my mom.', date: '2024-01-14' },
          { name: 'Bunny',       assets: ['assets/crochet/small_bunny.png'], description: 'One of my earliest projects with chunky yarn. A little messy, but I was starting to get the hang of crochet I think lol', date: '2024-03-06' },
          { name: 'Strawberry Cow',       assets: ['assets/crochet/strawberry_cow.jpg'], description: 'My first amigurumi with proper limbs. My mom said it looks like a pig, but it is definitely a cow trust.', date: '2024-03-15' },
          { name: 'Popping Teacup Mouse',    assets: ['assets/crochet/mouse_teacup.jpg'], description: 'I saw the most clever concept of a popping mouse out of a teacup and had to make it', date: '2025-02-24' },
          { name: 'Purple Snoopy',    assets: ['assets/crochet/purple_snoopy.png'], description: 'A birthday gift for my friend who loves everything purple and Snoopy', date: '2026-01-17' },
          { name: 'Cheeseburger',         assets: ['assets/crochet/cheeseburger.jpg'], description: 'I had a food crochet phase for a bit. This cheeseburger actually took quite a bit of layering.', date: '2024-07-08' },
          { name: 'Pink Cupcake',         assets: ['assets/crochet/pink_cupcake.jpg'], description: 'I think I literally made this in a couple hours randomly at 12am because after I finished the cheeseburger I wanted to make more food.', date: '2024-07-08' },
          { name: 'Elephant',             assets: ['assets/crochet/elephant.jpg'], description: 'Quick little gift. Uses seed beads for texture.', date: '2024-04-22' },
          { name: 'Bear with Bucket Hat', assets: ['assets/crochet/bear_bucket_hat.png'], description: "A father's day gift for my dad! It was supposed to be a bear with a coffee cup, but the yarn was too flimsy to keep the cup shape, so I turned it into a bucket hat lol", date: '2025-06-15' },
          { name: 'Christmas Bunny',      assets: ['assets/crochet/christmas_bunny.png'], description: 'I was in the Christmas spirit after getting into college', date: '2024-12-20' },
          { name: 'Strawberry Cat Plant', assets: ['assets/crochet/cat_strawberry.png', 'assets/crochet/cat_strawberry2.png', 'assets/crochet/cat_strawberry3.png'], description: 'One of my more involved crochet pieces in a while. The individual seeds and little strawberries, were tough, but it has become one of my favorite projects.', date: '2026-03-16' },
          { name: 'Fat Pig',            assets: ['assets/crochet/fat_pig.png', 'assets/crochet/fat_pig2.png'], description: "Idk why I made this lol I just wanted to make a chubby pig, but when I went back to college after spring break, my mom places it on my bed because my zodiac's a pig.", date: '2026-03-21' },
          { name: 'Broccoli',            assets: ['assets/crochet/broccoli.png', 'assets/crochet/broccoli2.png'], description: "A birthday gift for my friend who loves eating a broccoli head raw", date: '2026-04-22' },
          { name: 'Garfield',            assets: ['assets/crochet/garfield.jpg'], description: "Halfway through I got confused if I was making Garfield or the Lorax", date: '2026-05-25' },
          { name: 'Boots',            assets: ['assets/crochet/boots.JPG'], description: "My bsf and I used to be Dora and Boots avatars on Roblox", date: '2026-05-29' },
          { name: 'Duck on Floaty',            assets: ['assets/crochet/duck_on_floaty.png'], description: "How you'd catch me in the water if I could swim", date: '2026-07-04' },
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
          { label: 'Juiciness', col: '5' },
          { label: 'Rating', col: '6' },
        ],
        columns: ['Variety', 'Sweetness', 'Tartness', 'Intensity', 'Crunch', 'Juiciness', 'Rating'],
        rows: [
          { image: 'assets/apples/fuji.jpeg', cells: ['Fuji', 4.5, 2, 3.5, 4, 2.5, '8/10'] },
          { image: 'assets/apples/gala.jpeg', cells: ['Gala', 3, 0, 2, 3, 3.5, '7/10'] },
          { image: 'assets/apples/golden_delicious.jpeg', cells: ['Golden Delicious', 3.5, 3.5, 4, 2, 3, '8/10'] },
          { image: 'assets/apples/cortland.jpeg', cells: ['Cortland', 2, 2, 2.5, 1, 2, '7/10'] },
          { image: 'assets/apples/mcintosh.jpeg', cells: ['McIntosh', 2, 3.5, 3, 0, 1.5, '5/10'] },
          { image: 'assets/apples/sugarbee.jpeg', cells: ['Sugarbee', 5, 0, 4, 5, 5, '10/10'] },
          { image: 'assets/apples/pink_lady.jpeg', cells: ['Pink Lady', 4, 2, 4, 4.5, 4.5, '8.5/10'] },
          { image: 'assets/apples/granny_smith.jpeg', cells: ['Granny Smith', 0, 5, 4, 3.5, 3.5, '4/10'] },
          { image: 'assets/apples/cosmic_crisp.jpeg', cells: ['Cosmic Crisp', 3.5, 0, 1, 5, 4.5, '8.3/10'] },
          { image: 'assets/apples/honeycrisp.jpeg', cells: ['Honeycrisp', 3, 1, 3, 3, 3, '7/10'] },
          { image: 'assets/apples/envy.jpeg', cells: ['Envy', 4.5, 1, 4.5, 4, 4, '9.5/10'] },
          { image: 'assets/apples/cherry_apple.jpeg', cells: ['Cherry Apple', 0, 4, 0, 0, 1, '1/10'] },
          { image: 'assets/apples/opal.jpeg', cells: ['Opal', 4.5, 0, 4.5, 1, 3, '8.5/10'] },
          { image: 'assets/apples/sweetango.jpeg', cells: ['SweeTango', 2.5, 3, 2.5, 4, 2.5, '7/10'] },
          { image: 'assets/apples/juici.jpeg', cells: ['Juici', 2, 0, 1, 1, 2, '5/10'] },
          { image: 'assets/apples/royal_gala.png', cells: ['Royal Gala', 3, 0, 2, 3, 2.5, '7/10'] },
          { image: 'assets/apples/kanzi.png', cells: ['Kanzi', 1.5, 4, 4.5, 3, 5, '7/10'] },
          { image: 'assets/apples/wild_twist.png', cells: ['Wild Twist', 4.5, 0, 3, 5, 4.5, '9.5/10'] },
          { image: 'assets/apples/jazz.png', cells: ['Soluna', 4, 0, 2.5, 3, 3, '7.5/10'] },
          { image: 'assets/apples/soluna.png', cells: ['Soluna', 3.5, 1.5, 2.5, 2.5, 4, '7.5/10'] },
          { image: 'assets/apples/red_delicious.png', cells: ['Red Delicious', 3, 0.5, 1.5, 2, 4, '6.5/10'] },
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

    var STAR_COLS = [1, 2, 3, 4, 5]; // Sweetness, Tartness, Intensity, Crunch, Juiciness

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
            const av = col === 6 ? parseRating(a.cells[col]) : parseFloat(a.cells[col]) || 0;
            const bv = col === 6 ? parseRating(b.cells[col]) : parseFloat(b.cells[col]) || 0;
            const primary = (av - bv) * sortState.dir;
            if (primary !== 0) return primary;
            if (col === 1) return parseFloat(a.cells[2]) - parseFloat(b.cells[2]); // sweetness tie: least tart first
            if (col === 2) return parseFloat(b.cells[1]) - parseFloat(a.cells[1]); // tartness tie: most sweet first
            return primary;
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
      const def = data.defaultSort || (opts.length ? { col: opts[0].col, dir: 1 } : { col: null, dir: 1 });
      sortState = { col: def.col, dir: def.dir };
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
        const activeBtn = sortControls.querySelector('.sort-btn[data-col="' + def.col + '"]');
        if (activeBtn) { activeBtn.classList.add('active'); activeBtn.textContent = activeBtn.dataset.label + (def.dir === -1 ? ' ▼' : ' ▲'); }
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
