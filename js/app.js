/* Общая логика демо: меню, кнопка мессенджеров, появление блоков, формы, окно заявки,
   отрисовка каталога, карточки изделия и объектов. Без библиотек. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var params = new URLSearchParams(location.search);

  function slot(caption, ratio, extra) {
    return '<div class="slot ' + (ratio || "r-43") + ' ' + (extra || "") + '"><div class="slot-inner"><i class="ph ph-image" aria-hidden="true"></i><span>Фото: ' + esc(caption) + '</span></div></div>';
  }

  /* ---------- мобильное меню ---------- */
  var burger = $(".burger"), mnav = $(".mobile-nav");
  if (burger && mnav) {
    burger.addEventListener("click", function () {
      var open = mnav.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.innerHTML = open ? '<i class="ph ph-x" aria-hidden="true"></i>' : '<i class="ph ph-list" aria-hidden="true"></i>';
    });
    $$("a", mnav).forEach(function (a) { a.addEventListener("click", function () { mnav.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); burger.innerHTML = '<i class="ph ph-list" aria-hidden="true"></i>'; }); });
  }

  /* ---------- плавающая кнопка мессенджеров ---------- */
  var fab = $(".fab");
  if (fab) {
    var ft = $(".fab-toggle", fab);
    ft.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = fab.classList.toggle("open");
      ft.setAttribute("aria-expanded", open ? "true" : "false");
      ft.innerHTML = open ? '<i class="ph ph-x" aria-hidden="true"></i>' : '<i class="ph ph-chat-circle-dots" aria-hidden="true"></i>';
    });
    document.addEventListener("click", function (e) { if (!fab.contains(e.target) && fab.classList.contains("open")) ft.click(); });
  }

  /* ---------- появление при прокрутке ---------- */
  function observeReveal() {
    if (!("IntersectionObserver" in window)) { $$(".reveal").forEach(function (el) { el.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    $$(".reveal:not(.in)").forEach(function (el) { io.observe(el); });
  }

  /* ---------- форма заявки ---------- */
  function formHTML(idp, picked) {
    return '' +
      '<form class="form" novalidate data-form>' +
      '<div class="form-body" style="display:grid;gap:18px">' +
      (picked ? '<div class="picked"><i class="ph ph-check" aria-hidden="true"></i><span data-picked>' + esc(picked) + '</span></div>' : '') +
      '<div class="form-row two">' +
        '<div class="field"><label for="' + idp + '-name">Как к вам обращаться</label><input class="input" id="' + idp + '-name" name="name" autocomplete="name" required><span class="err">Напишите имя</span></div>' +
        '<div class="field"><label for="' + idp + '-phone">Телефон</label><input class="input" id="' + idp + '-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7" required><span class="err">Нужен номер, чтобы мы перезвонили</span></div>' +
      '</div>' +
      '<div class="field"><span class="label" id="' + idp + '-dir-l">Для чего изделие</span><div class="seg" role="radiogroup" aria-labelledby="' + idp + '-dir-l">' +
        '<input type="radio" id="' + idp + '-d1" name="dir" value="Заведение"><label for="' + idp + '-d1">Ресторан, бар, кафе</label>' +
        '<input type="radio" id="' + idp + '-d2" name="dir" value="Дом"><label for="' + idp + '-d2">Для дома</label>' +
        '<input type="radio" id="' + idp + '-d3" name="dir" value="Производство"><label for="' + idp + '-d3">Производство</label>' +
      '</div></div>' +
      '<div class="field"><label for="' + idp + '-msg">Что нужно сделать</label><textarea class="input" id="' + idp + '-msg" name="message" placeholder="Например: 4 барных стола 120×60, высота 110 см, чёрный муар"></textarea><span class="help">Размеры, количество, сроки. Можно в двух словах, уточним по телефону.</span></div>' +
      '<div class="field"><span class="label">Фото, эскиз или картинка из интернета</span><label class="file-drop" for="' + idp + '-file"><i class="ph ph-upload-simple" aria-hidden="true"></i><span data-file-label>Прикрепить файл (до 10 МБ)</span><input type="file" id="' + idp + '-file" name="file" accept="image/*,.pdf" multiple></label></div>' +
      '<input class="honeypot" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<div class="field"><label class="check"><input type="checkbox" name="consent" required><span>Согласен на обработку персональных данных по <a href="politika.html" target="_blank">политике конфиденциальности</a></span></label><span class="err">Без согласия мы не можем принять заявку</span></div>' +
      '<button class="btn btn-accent" type="submit">Отправить заявку <i class="ph ph-arrow-right" aria-hidden="true"></i></button>' +
      '</div>' +
      '<div class="form-success" role="status"><i class="ph ph-info" aria-hidden="true"></i><h3>Это демо-версия сайта</h3><p class="muted">Заявка никуда не отправлена. Чтобы заказать, позвоните мастеру: <a href="' + window.SITE.phoneHref + '">' + window.SITE.phone + '</a>. В рабочей версии заявка будет сразу приходить мастеру в мессенджер.</p></div>' +
      '</form>';
  }

  function bindForm(form) {
    var file = $('input[type="file"]', form), fl = $("[data-file-label]", form);
    if (file && fl) file.addEventListener("change", function () {
      var n = file.files.length;
      fl.textContent = n ? (n === 1 ? file.files[0].name : "Файлов: " + n) : "Прикрепить файл (до 10 МБ)";
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      var name = form.elements.name, phone = form.elements.phone, consent = form.elements.consent;
      function mark(el, bad) { var f = el.closest(".field"); f.classList.toggle("invalid", bad); if (bad) ok = false; }
      mark(name, !name.value.trim());
      mark(phone, phone.value.replace(/\D/g, "").length < 10);
      mark(consent, !consent.checked);
      if (form.elements.website.value) return; // ловушка для ботов
      if (!ok) { var first = $(".field.invalid input, .field.invalid textarea", form); if (first) first.focus(); return; }
      form.classList.add("sent");
    });
    $$("input, textarea", form).forEach(function (el) {
      el.addEventListener("input", function () { var f = el.closest(".field"); if (f) f.classList.remove("invalid"); });
      el.addEventListener("change", function () { var f = el.closest(".field"); if (f) f.classList.remove("invalid"); });
    });
  }

  $$("[data-form-mount]").forEach(function (m, i) { m.innerHTML = formHTML("f" + i); bindForm($("form", m)); });

  /* ---------- окно заявки ---------- */
  var modal = document.createElement("div");
  modal.className = "modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "modal-title");
  document.body.appendChild(modal);
  var lastFocus = null;
  function openModal(picked) {
    lastFocus = document.activeElement;
    modal.innerHTML = '<div class="modal-box"><div class="modal-top"><h3 id="modal-title">Рассчитать стоимость</h3><button class="modal-close" type="button" aria-label="Закрыть"><i class="ph ph-x" aria-hidden="true"></i></button></div>' + formHTML("m", picked) + '</div>';
    bindForm($("form", modal));
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    $(".modal-close", modal).addEventListener("click", closeModal);
    setTimeout(function () { var f = $("input.input", modal); if (f) f.focus(); }, 30);
  }
  function closeModal() {
    modal.classList.remove("open");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { if (modal.classList.contains("open")) closeModal(); else if (fab && fab.classList.contains("open")) $(".fab-toggle", fab).click(); }
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-want]");
    if (!b) return;
    e.preventDefault();
    var picked = b.getAttribute("data-want");
    if (b.hasAttribute("data-with-coat")) { var c = $(".coat-pick [aria-pressed='true']"); if (c) picked += ", покрытие: " + c.getAttribute("data-name"); }
    openModal(picked);
  });

  /* ---------- главная: лента работ ---------- */
  var strip = $("[data-works]");
  if (strip) {
    strip.innerHTML = window.OBJECTS.map(function (o) {
      return '<article class="work">' + slot(o.photos[0], "r-45") +
        '<div class="work-meta"><span>' + esc(o.kind) + '</span><span>' + esc(window.DIRS[o.dir].short) + '</span></div>' +
        '<h3>' + esc(o.title) + '</h3><p class="work-did">' + esc(o.did.join(", ").toLowerCase().replace(/^./, function (c) { return c.toUpperCase(); })) + '</p>' +
        '<button class="btn btn-ghost btn-sm" type="button" data-want="Как в объекте: ' + esc(o.kind.toLowerCase()) + ' (' + esc(o.did.join(", ").toLowerCase()) + ')">Хочу такое же</button></article>';
    }).join("");
  }

  /* ---------- каталог ---------- */
  var grid = $("[data-catalog]");
  if (grid) {
    var state = { dir: params.get("dir") || "all", type: params.get("type") || "all" };
    var dirChips = $("[data-dir-chips]"), typeChips = $("[data-type-chips]");
    dirChips.innerHTML = [["all", "Все направления"]].concat(Object.keys(window.DIRS).map(function (k) { return [k, window.DIRS[k].short]; }))
      .map(function (d) { return '<button class="chip" type="button" data-dir="' + d[0] + '">' + esc(d[1]) + '</button>'; }).join("");
    typeChips.innerHTML = ["all"].concat(window.TYPES).map(function (t) { return '<button class="chip" type="button" data-type="' + esc(t) + '">' + (t === "all" ? "Все изделия" : esc(t)) + '</button>'; }).join("");
    function render() {
      $$("[data-dir]", dirChips).forEach(function (c) { c.setAttribute("aria-pressed", c.getAttribute("data-dir") === state.dir ? "true" : "false"); });
      $$("[data-type]", typeChips).forEach(function (c) { c.setAttribute("aria-pressed", c.getAttribute("data-type") === state.type ? "true" : "false"); });
      var list = window.PRODUCTS.filter(function (p) { return (state.dir === "all" || p.dir === state.dir) && (state.type === "all" || p.type === state.type); });
      $("[data-count]").textContent = list.length ? "Найдено: " + list.length : "";
      grid.innerHTML = list.length ? list.map(function (p) {
        return '<a class="card reveal" href="product.html?id=' + p.id + '">' + slot(p.photos[0], "r-43") +
          '<div class="card-title"><h3>' + esc(p.name) + '</h3></div>' +
          '<div class="card-title"><span class="card-sub">' + esc(window.DIRS[p.dir].short) + ', ' + esc(p.size) + '</span><span class="card-price">Цена по размеру</span></div></a>';
      }).join("") : '<div class="empty" style="grid-column:1/-1"><i class="ph ph-magnifying-glass" aria-hidden="true"></i><p>В этом разделе пока нет изделий. Опишите, что нужно, и мы сделаем под заказ.</p><button class="btn btn-accent" type="button" data-want="Изделие под заказ">Рассчитать стоимость</button></div>';
      var u = new URL(location.href);
      state.dir === "all" ? u.searchParams.delete("dir") : u.searchParams.set("dir", state.dir);
      state.type === "all" ? u.searchParams.delete("type") : u.searchParams.set("type", state.type);
      history.replaceState(null, "", u);
      observeReveal();
    }
    dirChips.addEventListener("click", function (e) { var c = e.target.closest("[data-dir]"); if (c) { state.dir = c.getAttribute("data-dir"); render(); } });
    typeChips.addEventListener("click", function (e) { var c = e.target.closest("[data-type]"); if (c) { state.type = c.getAttribute("data-type"); render(); } });
    render();
  }

  /* ---------- карточка изделия ---------- */
  var pm = $("[data-product]");
  if (pm) {
    var p = window.PRODUCTS.filter(function (x) { return x.id === params.get("id"); })[0] || window.PRODUCTS[0];
    document.title = p.name + " | " + window.SITE.name;
    $("[data-crumb]").textContent = p.name;
    pm.innerHTML =
      '<div class="gallery">' + slot(p.photos[0], "r-11", "main-slot") +
        '<div class="thumbs">' + p.photos.slice(1).map(function (c) { return slot(c, "r-11"); }).join("") + '</div></div>' +
      '<div class="product-info">' +
        '<div style="display:grid;gap:12px"><span class="tag" style="justify-self:start">' + esc(window.DIRS[p.dir].title) + '</span><h1 style="font-size:clamp(1.9rem,3.4vw,2.6rem);text-wrap:balance">' + esc(p.name) + '</h1><p class="lead">' + esc(p.desc) + '</p></div>' +
        '<div class="price-line"><b>Цена по размеру</b><span class="muted">посчитаем по фото или эскизу</span></div>' +
        '<div class="specs">' +
          '<div class="spec"><small>Размер</small><b>' + esc(p.size) + '</b></div>' +
          '<div class="spec"><small>Металл</small><b>' + esc(p.metal) + '</b></div>' +
          '<div class="spec"><small>Срок</small><b>' + esc(p.term) + '</b></div>' +
          '<div class="spec"><small>Покрытие</small><b data-coat-name></b></div>' +
        '</div>' +
        '<div style="display:grid;gap:10px"><span class="label" style="font-weight:500">Цвет покрытия</span><div class="coat-pick">' +
          window.COATS.map(function (c, i) { return '<button type="button" aria-pressed="' + (i === 0 ? "true" : "false") + '" data-name="' + esc(c.name) + '" data-tint="' + c.tint + '" style="background:' + c.color + '" aria-label="' + esc(c.name) + '" title="' + esc(c.name) + '"></button>'; }).join("") +
        '</div></div>' +
        '<div class="product-cta"><button class="btn btn-accent" type="button" data-want="' + esc(p.name) + '" data-with-coat>Хочу такое же <i class="ph ph-arrow-right" aria-hidden="true"></i></button>' +
          '<a class="btn btn-ghost" href="' + window.SITE.max + '"><i class="ph ph-chat-circle-dots" aria-hidden="true"></i>Спросить в MAX</a></div>' +
        '<div class="notes"><div><i class="ph ph-ruler" aria-hidden="true"></i>Сделаем под ваш размер и количество</div><div><i class="ph ph-truck" aria-hidden="true"></i>Доставка и монтаж (условия уточняются)</div><div><i class="ph ph-shield-check" aria-hidden="true"></i>Гарантия на сварку и покрытие (срок уточняется)</div></div>' +
      '</div>';
    var pick = $(".coat-pick", pm), cname = $("[data-coat-name]", pm);
    function setCoat(btn) {
      $$("button", pick).forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
      cname.textContent = btn.getAttribute("data-name");
      $$(".slot", pm).forEach(function (s) { s.style.setProperty("--coat", btn.getAttribute("data-tint")); });
    }
    pick.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) setCoat(b); });
    setCoat($("button", pick));
    var more = $("[data-more]");
    if (more) more.innerHTML = window.PRODUCTS.filter(function (x) { return x.dir === p.dir && x.id !== p.id; }).slice(0, 3).map(function (x) {
      return '<a class="card" href="product.html?id=' + x.id + '">' + slot(x.photos[0], "r-43") + '<h3>' + esc(x.name) + '</h3></a>';
    }).join("");
  }

  /* ---------- объекты ---------- */
  var ob = $("[data-objects]");
  if (ob) {
    ob.innerHTML = window.OBJECTS.map(function (o) {
      return '<article class="object reveal" id="' + o.id + '">' +
        '<div class="object-head"><div class="object-logo">логотип<br>заказчика</div><div><span class="muted">' + esc(window.DIRS[o.dir].title) + '</span><h2 style="font-size:clamp(1.5rem,3vw,2.1rem)">' + esc(o.title) + '</h2></div></div>' +
        '<div class="object-photos">' + slot(o.photos[0], "r-43") + slot(o.photos[1], "r-32") + slot(o.photos[2], "r-32") + '</div>' +
        '<div class="object-body"><p class="muted">' + esc(o.text) + '</p><div><span class="label" style="font-weight:500">Что делали</span><div class="did" style="margin-top:10px">' + o.did.map(function (d) { return '<span class="tag">' + esc(d) + '</span>'; }).join("") + '</div></div>' +
        '<button class="btn btn-accent" style="justify-self:start" type="button" data-want="Как в объекте: ' + esc(o.kind.toLowerCase()) + ' (' + esc(o.did.join(", ").toLowerCase()) + ')">Хочу такое же</button></div>' +
        '</article>';
    }).join("");
  }

  observeReveal();
})();
