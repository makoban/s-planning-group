(() => {
  "use strict";

  const body = document.body;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const markLoaded = () => body.classList.add("is-loaded");
  if (reducedMotion) {
    markLoaded();
  } else {
    window.addEventListener("load", () => window.setTimeout(markLoaded, 1150), { once: true });
    window.setTimeout(markLoaded, 2800);
  }

  const header = document.querySelector("[data-header]");
  const progressBar = document.querySelector(".scroll-progress span");
  const heroImage = document.querySelector("[data-parallax] img");
  const motionPictures = [...document.querySelectorAll("[data-scroll-motion]")];

  let ticking = false;
  const updateScrollState = () => {
    const scrollY = window.scrollY;
    const scrollMax = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    header?.classList.toggle("is-scrolled", scrollY > 24);
    if (progressBar) progressBar.style.transform = `scaleX(${Math.min(scrollY / scrollMax, 1)})`;

    if (heroImage && !reducedMotion && finePointer) {
      const offset = Math.min(scrollY * 0.035, 12);
      heroImage.style.transform = `translate3d(0, ${offset}px, 0) scale(1.015)`;
    }

    if (!reducedMotion && finePointer) {
      motionPictures.forEach((picture) => {
        const rect = picture.getBoundingClientRect();
        if (rect.bottom < -120 || rect.top > window.innerHeight + 120) return;
        const distance = window.innerHeight / 2 - (rect.top + rect.height / 2);
        const progress = Math.max(-1, Math.min(1, distance / Math.max(window.innerHeight / 2, 1)));
        picture.style.setProperty("--motion-y", `${(progress * 9).toFixed(2)}px`);
      });
    }
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollState);
        ticking = true;
      }
    },
    { passive: true }
  );
  updateScrollState();

  if (!reducedMotion && finePointer) {
    document.querySelectorAll("[data-tilt]").forEach((surface) => {
      const target = surface.querySelector(".company-image-button");
      if (!(target instanceof HTMLElement)) return;
      let tiltFrame = 0;

      surface.addEventListener("pointermove", (event) => {
        if (tiltFrame) window.cancelAnimationFrame(tiltFrame);
        tiltFrame = window.requestAnimationFrame(() => {
          const rect = surface.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2;
          const y = ((event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * 2;
          target.style.setProperty("--tilt-x", `${(-y * 1.15).toFixed(2)}deg`);
          target.style.setProperty("--tilt-y", `${(x * 1.15).toFixed(2)}deg`);
        });
      });

      surface.addEventListener("pointerleave", () => {
        if (tiltFrame) window.cancelAnimationFrame(tiltFrame);
        target.style.setProperty("--tilt-x", "0deg");
        target.style.setProperty("--tilt-y", "0deg");
      });
    });
  }

  const menuButton = document.querySelector(".menu-button");
  const mobileMenu = document.querySelector(".mobile-menu");

  const closeMenu = () => {
    if (!menuButton || !mobileMenu) return;
    menuButton.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-hidden", "true");
    mobileMenu.classList.remove("is-open");
    body.classList.remove("menu-open");
  };

  menuButton?.addEventListener("click", () => {
    const willOpen = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(willOpen));
    mobileMenu?.setAttribute("aria-hidden", String(!willOpen));
    mobileMenu?.classList.toggle("is-open", willOpen);
    body.classList.toggle("menu-open", willOpen);
  });

  mobileMenu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  const revealItems = document.querySelectorAll(".reveal, .media-curtain");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8%", threshold: 0.12 }
    );
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const map = document.querySelector("[data-group-map]");
  if (map) {
    if (reducedMotion || !("IntersectionObserver" in window)) {
      map.classList.add("map-in");
    } else {
      const mapObserver = new IntersectionObserver(
        (entries, observer) => {
          if (!entries[0].isIntersecting) return;
          map.classList.add("map-in");
          observer.disconnect();
        },
        { threshold: 0.25 }
      );
      mapObserver.observe(map);
    }
  }

  const groupData = {
    splanning: {
      type: "GROUP CORE",
      name: "エス・プランニング株式会社",
      copy: ["現場にある可能性を事業へ。", "ものづくりを原点に、", "自社事業と専門会社の未来をつなぐ", "グループの中心です。"],
      href: "#business",
      label: "事業を見る",
      external: false,
    },
    stockmart: {
      type: "OUR BUSINESS / RETAIL",
      name: "stockmart",
      copy: ["輸入食品・生活雑貨を中心に、", "必要な分だけ選べる買い物体験を届ける、", "エス・プランニングの小売事業です。"],
      href: "#stockmart",
      label: "事業を見る",
      external: false,
    },
    seiryu: {
      type: "GROUP COMPANY / BUILDING",
      name: "有限会社青竜社塗装店",
      copy: ["建築塗装、防水、修繕工事を通じて、", "地域の建物と暮らしを長く支える", "専門会社です。"],
      href: "https://www.seiryu-sha.co.jp/",
      label: "公式サイト",
      external: true,
    },
    shinko: {
      type: "GROUP COMPANY / INDUSTRIAL",
      name: "伸晃工業株式会社",
      copy: ["多様な素材への工業塗装・表面処理を担い、", "製品の色、質感、その先の品質をつくる", "専門会社です。"],
      href: "https://makoban.github.io/shinko-kogyo-site/",
      label: "サイト提案を見る",
      external: true,
    },
    itn: {
      type: "GROUP COMPANY / COMMUNICATION",
      name: "有限会社アイ・ティー・ネット",
      copy: ["アンテナ、防犯、LAN・ネットワークなど、", "暮らしと仕事の見えないつながりを支える", "専門会社です。"],
      href: "https://makoban.github.io/it-network-renewal/",
      label: "サイト提案を見る",
      external: true,
    },
  };

  const groupNodes = document.querySelectorAll("[data-group-key]");
  const detailType = document.querySelector("[data-group-type]");
  const detailName = document.querySelector("[data-group-name]");
  const detailCopy = document.querySelector("[data-group-copy]");
  const detailLink = document.querySelector("[data-group-link]");

  const renderPhrases = (element, phrases) => {
    element.replaceChildren();
    phrases.forEach((phrase, index) => {
      if (index > 0) element.append(document.createElement("wbr"));
      const span = document.createElement("span");
      span.className = "phrase";
      span.textContent = phrase;
      element.append(span);
    });
  };

  groupNodes.forEach((node) => {
    node.addEventListener("click", () => {
      const data = groupData[node.dataset.groupKey];
      if (!data || !detailType || !detailName || !detailCopy || !detailLink) return;

      groupNodes.forEach((item) => {
        const active = item === node;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });

      detailType.textContent = data.type;
      detailName.textContent = data.name;
      renderPhrases(detailCopy, data.copy);
      detailLink.href = data.href;
      detailLink.innerHTML = `${data.label} <span aria-hidden="true">${data.external ? "↗" : "→"}</span>`;

      if (data.external) {
        detailLink.target = "_blank";
        detailLink.rel = "noopener noreferrer";
      } else {
        detailLink.removeAttribute("target");
        detailLink.removeAttribute("rel");
      }
    });
  });

  const navLinks = [...document.querySelectorAll(".desktop-nav a")];
  const navTargets = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (navTargets.length && "IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        navLinks.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`));
      },
      { rootMargin: "-25% 0px -60%", threshold: [0.05, 0.2, 0.5] }
    );
    navTargets.forEach((section) => navObserver.observe(section));
  }

  const dialog = document.querySelector("#demo-dialog");
  const openDialog = document.querySelector("[data-demo-submit]");
  const closeDialogButtons = document.querySelectorAll("[data-dialog-close]");

  openDialog?.addEventListener("click", () => {
    if (dialog instanceof HTMLDialogElement) dialog.showModal();
  });
  closeDialogButtons.forEach((button) => button.addEventListener("click", () => dialog?.close()));
  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  const imageDialog = document.querySelector("#image-dialog");
  const imageDialogImage = document.querySelector("[data-image-dialog-image]");
  const imageDialogCaption = document.querySelector("[data-image-dialog-caption]");
  const imageDialogClose = document.querySelector("[data-image-dialog-close]");
  const imageDialogFigure = imageDialog?.querySelector("figure");
  let imageDialogTrigger = null;

  document.querySelectorAll("[data-image-zoom]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      if (!(imageDialog instanceof HTMLDialogElement) || !(imageDialogImage instanceof HTMLImageElement)) return;
      imageDialogTrigger = trigger;
      imageDialogImage.src = trigger.dataset.imageSrc || "";
      imageDialogImage.alt = trigger.dataset.imageAlt || "";
      if (imageDialogCaption) imageDialogCaption.textContent = trigger.dataset.imageCaption || "";
      imageDialog.classList.toggle("is-screenshot", trigger.dataset.imageKind === "screenshot");
      imageDialog.classList.remove("is-zoomed");
      if (imageDialogFigure) {
        imageDialogFigure.scrollTop = 0;
        imageDialogFigure.scrollLeft = 0;
      }
      imageDialog.showModal();
    });
  });

  imageDialogImage?.addEventListener("click", () => {
    if (!imageDialog?.classList.contains("is-screenshot")) return;
    imageDialog.classList.toggle("is-zoomed");
    if (!imageDialog.classList.contains("is-zoomed") && imageDialogFigure) {
      imageDialogFigure.scrollTo({ top: 0, left: 0, behavior: reducedMotion ? "auto" : "smooth" });
    }
  });

  imageDialogClose?.addEventListener("click", () => imageDialog?.close());
  imageDialog?.addEventListener("click", (event) => {
    if (event.target === imageDialog) imageDialog.close();
  });
  imageDialog?.addEventListener("close", () => {
    imageDialog.classList.remove("is-screenshot", "is-zoomed");
    imageDialogTrigger?.focus();
  });

  document.querySelectorAll("[data-year]").forEach((item) => {
    item.textContent = String(new Date().getFullYear());
  });
})();
