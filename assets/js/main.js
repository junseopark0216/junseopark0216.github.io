/* =================================================================
   Zune — 테마 동작 스크립트
   ================================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 다크 모드 ---------- */
  var root = document.documentElement;
  function setTheme(t) {
    root.setAttribute("data-theme", t);
    try { localStorage.setItem("theme", t); } catch (e) {}
  }
  if (!root.getAttribute("data-theme")) {
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.setAttribute("data-theme", prefersDark ? "dark" : "light");
  }
  var toggle = document.querySelector("[data-theme-toggle]");
  if (toggle) toggle.addEventListener("click", function () {
    setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
  });

  /* ---------- Categories 드롭다운 ---------- */
  var catWrap = document.querySelector(".nav-cat");
  if (catWrap) {
    var catBtn = catWrap.querySelector(".nav-cat-btn");
    var close = function () { catWrap.removeAttribute("data-open"); catBtn.setAttribute("aria-expanded", "false"); };
    catBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = catWrap.hasAttribute("data-open");
      if (open) { close(); } else { catWrap.setAttribute("data-open", ""); catBtn.setAttribute("aria-expanded", "true"); }
    });
    document.addEventListener("click", function (e) { if (!catWrap.contains(e.target)) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }

  /* ---------- 히어로: whoami 타이핑 → 이름 디코드 ---------- */
  var cmd = document.querySelector(".hero [data-type]");
  var out = document.querySelector(".hero [data-out]");
  var title = document.querySelector(".hero-title");

  // 이름을 랜덤 글자로 섞었다가 왼쪽부터 자리를 잡는 "디코드" 효과
  function decode(el, finalText, duration) {
    var glyphs = "!<>-_\\/[]{}=+*#%$x0189abcdef";
    var start = performance.now();
    (function tick(now) {
      var p = Math.min(1, (now - start) / duration);
      var locked = p * finalText.length;
      var s = "";
      for (var k = 0; k < finalText.length; k++) {
        if (k < Math.floor(locked)) s += finalText[k];
        else if (finalText[k] === " ") s += " ";
        else s += glyphs[(Math.random() * glyphs.length) | 0];
      }
      el.textContent = s;
      if (p < 1) requestAnimationFrame(tick);
      else { el.textContent = finalText; el.classList.add("is-set"); }
    })(start);
  }

  if (cmd && out) {
    var full = cmd.getAttribute("data-type");
    var name = title ? title.textContent.trim() : "";
    if (reduce) {
      cmd.textContent = full; out.classList.add("is-shown");
    } else {
      cmd.textContent = "";
      if (title) title.textContent = "";          // 디코드 전 잠깐 비움
      var i = 0;
      (function type() {
        if (i <= full.length) { cmd.textContent = full.slice(0, i); i++; setTimeout(type, 85); }
        else {
          setTimeout(function () {
            out.classList.add("is-shown");
            if (title) decode(title, name, 760);
          }, 240);
        }
      })();
    }
  }

  /* ---------- 디스코드 아이디 복사 ---------- */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      var done = function () {
        btn.classList.add("is-copied");
        // 툴팁(.copied)이 없는 버튼(푸터 등)은 글자를 잠깐 "복사됨"으로 바꿈
        var hasTip = btn.querySelector(".copied");
        var label = null;
        if (!hasTip) {
          var node = Array.prototype.filter.call(btn.childNodes, function (n) { return n.nodeType === 3; })[0];
          if (node) { label = node.nodeValue; node.nodeValue = "복사됨"; }
        }
        setTimeout(function () {
          btn.classList.remove("is-copied");
          if (label !== null && node) node.nodeValue = label;
        }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else {
        var ta = document.createElement("textarea");
        ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); } catch (e) {}
        document.body.removeChild(ta); done();
      }
    });
  });

  /* ---------- 히어로: 하프톤 점 배경 (은은하게 반짝임) ---------- */
  var canvas = document.querySelector(".halftone");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var gap = 22, R = 1.6;
    var dots = [], cw = 0, ch = 0, raf = null, t0 = performance.now();
    function brass() { return getComputedStyle(root).getPropertyValue("--brass").trim() || "#a9741a"; }
    function build() {
      cw = canvas.clientWidth; ch = canvas.clientHeight;
      canvas.width = cw * dpr; canvas.height = ch * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      var cx = cw / 2, cy = ch * 0.42, maxd = Math.hypot(Math.max(cx, cw - cx), Math.max(cy, ch - cy));
      for (var y = gap; y < ch; y += gap) {
        for (var x = gap; x < cw; x += gap) {
          var d = Math.hypot(x - cx, y - cy) / maxd;    // 0..1 (중심→가장자리)
          var a = Math.max(0, 0.55 - d * 0.6);
          if (a <= 0.02) continue;
          dots.push({ x: x, y: y, r: R * (1 - d * 0.5), a: a, ph: x * 0.06 + y * 0.09 });
        }
      }
    }
    function render(now) {
      ctx.clearRect(0, 0, cw, ch);
      ctx.fillStyle = brass();
      var t = (now - t0) / 1000;
      for (var i = 0; i < dots.length; i++) {
        var dt = dots[i];
        // 위치마다 위상이 달라 잔잔하게 깜빡이는 느낌 (진폭 작게)
        var tw = reduce ? 1 : (0.68 + 0.32 * Math.sin(t * 0.8 + dt.ph));
        ctx.globalAlpha = dt.a * tw;
        ctx.beginPath(); ctx.arc(dt.x, dt.y, dt.r, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!reduce && !document.hidden) raf = requestAnimationFrame(render);
    }
    function loop() { if (raf) cancelAnimationFrame(raf); raf = requestAnimationFrame(render); }
    build();
    if (reduce) render(performance.now()); else loop();
    var rt; window.addEventListener("resize", function () {
      clearTimeout(rt); rt = setTimeout(function () { build(); if (reduce) render(performance.now()); }, 150);
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { if (raf) cancelAnimationFrame(raf), raf = null; }
      else if (!reduce) loop();
    });
    // 테마 전환 시 색은 brass()가 매 프레임 읽으므로 자동 반영 (reduce면 한 번 다시 그림)
    if (reduce) new MutationObserver(function () { render(performance.now()); })
      .observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  }

  /* ---------- 글 본문: 한/영 분리 → 헤딩 앵커 + 목차 ---------- */
  var prose = document.getElementById("prose");
  var tocList = document.getElementById("toc-list");
  var tocBox = tocList ? tocList.closest(".toc") : null;
  var article = document.querySelector(".post[data-langs]");
  var spy = null;

  if (prose) {
    // 1) 한/영 글이면 본문을 언어 블록으로 나눈다 (<!--ko--> / <!--en--> 주석 기준)
    if (article) {
      var langs = article.getAttribute("data-langs").split(",");
      var buckets = { common: [] };
      langs.forEach(function (l) { buckets[l] = []; });
      var cur = "common";
      Array.prototype.slice.call(prose.childNodes).forEach(function (n) {
        if (n.nodeType === 8) { // 주석 노드
          var v = n.nodeValue.trim();
          if (buckets[v]) { cur = v; return; }
        }
        (buckets[cur] || buckets.common).push(n);
      });
      prose.innerHTML = "";
      if (buckets.common.length) {
        var cw = document.createElement("div"); cw.className = "lang-common";
        buckets.common.forEach(function (n) { cw.appendChild(n); });
        prose.appendChild(cw);
      }
      langs.forEach(function (l) {
        var d = document.createElement("div"); d.className = "lang-block"; d.setAttribute("data-lang", l);
        buckets[l].forEach(function (n) { d.appendChild(n); });
        prose.appendChild(d);
      });

      var saved = null; try { saved = localStorage.getItem("zune-post-lang"); } catch (e) {}
      var active = langs.indexOf(saved) >= 0 ? saved : langs[0];
      var btns = article.querySelectorAll("[data-lang-switch]");
      function applyLang(l) {
        prose.querySelectorAll(".lang-block").forEach(function (b) {
          b.hidden = b.getAttribute("data-lang") !== l;
        });
        btns.forEach(function (btn) {
          var on = btn.getAttribute("data-lang-switch") === l;
          btn.classList.toggle("is-active", on); btn.setAttribute("aria-selected", on ? "true" : "false");
        });
        try { localStorage.setItem("zune-post-lang", l); } catch (e) {}
        rebuildToc();
      }
      btns.forEach(function (btn) {
        btn.addEventListener("click", function () { applyLang(btn.getAttribute("data-lang-switch")); });
      });
      ensureAnchors();
      applyLang(active);
    } else {
      ensureAnchors();
      rebuildToc();
    }
  }

  // 보이는 헤딩에만 id/앵커 보장
  function ensureAnchors() {
    var used = {};
    prose.querySelectorAll("h2, h3").forEach(function (h) {
      if (!h.dataset.label) h.dataset.label = (h.textContent || "").trim();
      if (!h.id) {
        var slug = h.dataset.label.toLowerCase().replace(/[^\w가-힣\s-]/g, "").replace(/\s+/g, "-").slice(0, 50) || "sec";
        if (used[slug]) { used[slug]++; slug += "-" + used[slug]; } else { used[slug] = 1; }
        h.id = slug;
      } else { used[h.id] = 1; }
      if (!h.querySelector(".anchor")) {
        var a = document.createElement("a");
        a.href = "#" + h.id; a.className = "anchor"; a.setAttribute("aria-hidden", "true"); a.textContent = "#";
        h.appendChild(a);
      }
    });
  }

  // 현재 보이는 언어의 헤딩으로 목차를 다시 그린다
  function rebuildToc() {
    if (!tocList) return;
    var heads = Array.prototype.filter.call(prose.querySelectorAll("h2, h3"), function (h) {
      var lb = h.closest(".lang-block"); return !(lb && lb.hidden);
    });
    tocList.innerHTML = "";
    if (spy) { spy.disconnect(); spy = null; }
    if (!heads.length) { if (tocBox) tocBox.style.display = "none"; return; }
    if (tocBox) tocBox.style.display = "";
    heads.forEach(function (h) {
      var li = document.createElement("li");
      li.className = "lv-" + h.tagName.slice(1);
      var a = document.createElement("a");
      a.href = "#" + h.id; a.textContent = h.dataset.label || h.textContent.replace(/#$/, "");
      li.appendChild(a); tocList.appendChild(li);
    });
    var links = tocList.querySelectorAll("a");
    spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (l) {
          l.classList.toggle("is-active", l.getAttribute("href") === "#" + en.target.id);
        });
      });
    }, { rootMargin: "-80px 0px -70% 0px" });
    heads.forEach(function (h) { spy.observe(h); });
  }

  /* ---------- 카테고리 내 분류 토글 ---------- */
  var gtabs = document.querySelectorAll("[data-group-filter]");
  if (gtabs.length) {
    var rows = document.querySelectorAll(".post-row[data-group]");
    var blocks = document.querySelectorAll("[data-year-block]");
    var gEmpty = document.querySelector("[data-group-empty]");
    function applyFilter(g) {
      var shown = 0;
      rows.forEach(function (r) {
        var match = !g || r.getAttribute("data-group") === g;
        r.hidden = !match; if (match) shown++;
      });
      // 비어버린 연도 블록은 숨김
      blocks.forEach(function (b) {
        var any = b.querySelector(".post-row:not([hidden])");
        b.hidden = !any;
      });
      if (gEmpty) gEmpty.hidden = shown !== 0;
    }
    gtabs.forEach(function (t) {
      t.addEventListener("click", function () {
        gtabs.forEach(function (x) { x.classList.remove("is-active"); x.setAttribute("aria-selected", "false"); });
        t.classList.add("is-active"); t.setAttribute("aria-selected", "true");
        applyFilter(t.getAttribute("data-group-filter"));
      });
    });
  }

  /* ---------- 검색 ---------- */
  var searchEl = document.getElementById("search");
  if (searchEl) {
    var input = document.getElementById("search-input");
    var results = document.getElementById("search-results");
    var emptyMsg = document.getElementById("search-empty");
    var data = null, active = -1;

    function openSearch() {
      searchEl.hidden = false; document.body.style.overflow = "hidden";
      input.focus(); if (!data) loadIndex();
    }
    function closeSearch() { searchEl.hidden = true; document.body.style.overflow = ""; }
    function loadIndex() {
      fetch(window.SEARCH_INDEX).then(function (r) { return r.json(); })
        .then(function (d) { data = d; render(input.value); })
        .catch(function () { data = []; });
    }
    function esc(s) { return s.replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
    function hi(text, q) {
      if (!q) return esc(text);
      var idx = text.toLowerCase().indexOf(q.toLowerCase());
      if (idx < 0) return esc(text);
      return esc(text.slice(0, idx)) + "<mark>" + esc(text.slice(idx, idx + q.length)) + "</mark>" + esc(text.slice(idx + q.length));
    }
    function render(q) {
      if (!data) return;
      q = q.trim();
      var list = !q ? data.slice(0, 8) : data.filter(function (p) {
        var hay = (p.title + " " + p.category + " " + (p.tags || []).join(" ") + " " + p.text).toLowerCase();
        return hay.indexOf(q.toLowerCase()) >= 0;
      });
      results.innerHTML = "";
      active = -1;
      emptyMsg.hidden = list.length > 0;
      list.slice(0, 20).forEach(function (p) {
        var li = document.createElement("li");
        li.innerHTML = '<a href="' + p.url + '"><div class="sr-title">' + hi(p.title, q) +
          '</div><div class="sr-meta">' + (p.category ? p.category + " · " : "") + p.date +
          (p.tags && p.tags.length ? "  " + p.tags.slice(0, 3).map(function (t) { return "#" + t; }).join(" ") : "") +
          '</div></a>';
        results.appendChild(li);
      });
    }
    function move(dir) {
      var items = results.querySelectorAll("li");
      if (!items.length) return;
      if (active >= 0) items[active].classList.remove("is-active");
      active = (active + dir + items.length) % items.length;
      items[active].classList.add("is-active");
      items[active].scrollIntoView({ block: "nearest" });
    }

    document.querySelectorAll("[data-search-open]").forEach(function (b) { b.addEventListener("click", openSearch); });
    document.querySelectorAll("[data-search-close]").forEach(function (b) { b.addEventListener("click", closeSearch); });
    input.addEventListener("input", function () { render(input.value); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") {
        var items = results.querySelectorAll("li a");
        if (active >= 0 && items[active]) location.href = items[active].getAttribute("href");
        else if (items[0]) location.href = items[0].getAttribute("href");
      }
    });
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); searchEl.hidden ? openSearch() : closeSearch(); }
      else if (e.key === "Escape" && !searchEl.hidden) closeSearch();
      else if (e.key === "/" && searchEl.hidden && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
    });
  }
})();
