/* Veeprime Groups — interactions & motion
   Uses "Motion" (the vanilla-JS successor to Framer Motion) via CDN */
(function () {
  const { animate, stagger, inView } = window.Motion || {};

  /* ---------------------------------------------------------
       0) Image uploads — click the camera icon on any image
          (including the logo) to swap in your own picture.
          Saved to localStorage (per browser) so it survives reloads;
          falls back to in-memory only if storage isn't available.
    --------------------------------------------------------- */
  const IMG_STORAGE_PREFIX = "veeprime:img:";
  const memoryStore = {};

  function storageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return memoryStore[key] || null;
    }
  }
  function storageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      memoryStore[key] = value;
    }
  }

  function applyImage(key, dataUrl) {
    document.querySelectorAll(`img[data-img="${key}"]`).forEach((img) => {
      img.src = dataUrl;
    });
  }

  function restoreSavedImages() {
    const keys = new Set();
    document
      .querySelectorAll("img[data-img]")
      .forEach((img) => keys.add(img.dataset.img));
    keys.forEach((key) => {
      const saved = storageGet(IMG_STORAGE_PREFIX + key);
      if (saved) applyImage(key, saved);
    });
  }

  function showToast(text) {
    let toast = document.querySelector(".upload-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "upload-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.classList.add("show");
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function initImageUploads() {
    document
      .querySelectorAll('input[type="file"][data-img-input]')
      .forEach((input) => {
        input.addEventListener("change", () => {
          const file = input.files && input.files[0];
          if (!file) return;
          const key = input.dataset.imgInput;
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result;
            applyImage(key, dataUrl);
            storageSet(IMG_STORAGE_PREFIX + key, dataUrl);
            showToast("Image updated ✓");
            const targetImg = document.querySelector(`img[data-img="${key}"]`);
            if (targetImg && animate) {
              animate(
                targetImg,
                { opacity: [0, 1], transform: ["scale(1.08)", "scale(1)"] },
                { duration: 0.5, easing: [0.34, 1.56, 0.64, 1] }
              );
            }
          };
          reader.readAsDataURL(file);
        });
      });
  }

  /* ---------------------------------------------------------
       1) Hero entrance — orchestrated sequence on load
    --------------------------------------------------------- */
  function playHero() {
    const items = document.querySelectorAll(".hero [data-reveal]");
    const portrait = document.querySelector(".hero-portrait");
    const blob = document.querySelector(".hero-blob");

    if (blob && animate) {
      animate(
        blob,
        { opacity: [0, 0.95], scale: [0.85, 1] },
        { duration: 1.1, easing: "ease-out" }
      );
    }

    if (animate && items.length) {
      animate(
        items,
        { opacity: [0, 1], transform: ["translateY(24px)", "translateY(0px)"] },
        {
          delay: stagger(0.12, { start: 0.15 }),
          duration: 0.75,
          easing: [0.16, 0.8, 0.24, 1],
        }
      );
    } else {
      items.forEach((el) => el.classList.add("in-view"));
    }

    if (portrait && animate) {
      animate(
        portrait,
        {
          opacity: [0, 1],
          transform: [
            "translateY(40px) scale(0.96)",
            "translateY(0px) scale(1)",
          ],
        },
        { duration: 0.9, delay: 0.3, easing: [0.16, 0.8, 0.24, 1] }
      );
    }
  }

  /* ---------------------------------------------------------
       2) Scroll reveal for everything else marked [data-reveal]
    --------------------------------------------------------- */
  function initScrollReveal() {
    const targets = document.querySelectorAll(
      "[data-reveal]:not(.hero [data-reveal])"
    );

    targets.forEach((el) => {
      if (inView) {
        inView(
          el,
          () => {
            if (animate) {
              animate(
                el,
                {
                  opacity: [0, 1],
                  transform: [
                    "translateY(28px) scale(0.98)",
                    "translateY(0px) scale(1)",
                  ],
                },
                { duration: 0.75, easing: [0.16, 0.8, 0.24, 1] }
              );
            } else {
              el.classList.add("in-view");
            }
          },
          { amount: 0.2 }
        );
      } else {
        el.classList.add("in-view");
      }
    });
  }

  /* ---------------------------------------------------------
       3) Animated stat counters (450+, 450+) on scroll into view
    --------------------------------------------------------- */
  function initCounters() {
    const nums = document.querySelectorAll(".stat-num[data-count]");
    if (!nums.length) return;

    nums.forEach((el) => {
      const target = parseInt(el.dataset.count, 10);
      const run = () => {
        let start = null;
        const duration = 1400;
        function step(ts) {
          if (start === null) start = ts;
          const progress = Math.min((ts - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(eased * target);
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      };
      if (inView) {
        inView(el, run, { amount: 0.6 });
      } else {
        run();
      }
    });
  }

  /* ---------------------------------------------------------
       4) Services carousel — dots stay in sync with scroll on
          mobile (snap-scroll) and simply cycle a highlight on
          desktop where both cards are visible at once.
    --------------------------------------------------------- */
  function initServiceCarousel() {
    const track = document.getElementById("serviceTrack");
    const dots = document.querySelectorAll("#trackDots .dot");
    if (!track || !dots.length) return;

    const cards = Array.from(track.querySelectorAll(".service-card"));
    let index = 0;
    let autoTimer = null;

    const setActive = (i) => {
      index = i;
      dots.forEach((d, di) =>
        d.classList.toggle("active", di === i % dots.length)
      );
    };

    const isScrollMode = () => window.matchMedia("(max-width: 820px)").matches;

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const i = parseInt(dot.dataset.index, 10);
        setActive(i);
        if (isScrollMode() && cards[i % cards.length]) {
          cards[i % cards.length].scrollIntoView({
            behavior: "smooth",
            inline: "center",
            block: "nearest",
          });
        } else if (animate) {
          animate(track, { opacity: [0.5, 1] }, { duration: 0.4 });
        }
      });
    });

    // Sync dots to horizontal scroll position on mobile
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const i = cards.indexOf(entry.target);
              if (i > -1) setActive(i % dots.length);
            }
          });
        },
        { root: track, threshold: 0.6 }
      );
      cards.forEach((c) => io.observe(c));
    }

    // Gentle auto-cycle of the highlight dot when not in scroll mode
    autoTimer = setInterval(() => {
      if (!isScrollMode()) setActive((index + 1) % dots.length);
    }, 4000);
  }

  /* ---------------------------------------------------------
       5) Card hover — playful lift handled in CSS; Motion adds a
          touch of spring on enter/leave for pointer devices.
    --------------------------------------------------------- */
  function initCardHover() {
    if (window.matchMedia("(hover: none)").matches) return;
    const cards = document.querySelectorAll(".testi-card, .service-card");
    cards.forEach((card) => {
      card.addEventListener("mouseenter", () => {
        if (animate)
          animate(
            card,
            { transform: ["translateY(0px)", "translateY(-10px)"] },
            { duration: 0.4, easing: [0.34, 1.56, 0.64, 1] }
          );
      });
      card.addEventListener("mouseleave", () => {
        if (animate)
          animate(
            card,
            { transform: ["translateY(-10px)", "translateY(0px)"] },
            { duration: 0.4, easing: [0.34, 1.56, 0.64, 1] }
          );
      });
    });
  }

  /* ---------------------------------------------------------
       6) CTA email form — lightweight client-side confirmation
    --------------------------------------------------------- */
  function initCtaForm() {
    const form = document.getElementById("ctaForm");
    const msg = document.getElementById("formMsg");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      msg.textContent = "Thanks — we'll reach out shortly.";
      if (animate) {
        animate(
          msg,
          {
            opacity: [0, 1],
            transform: ["translateY(6px)", "translateY(0px)"],
          },
          { duration: 0.4 }
        );
      }
      form.reset();
    });

    const footerForm = document.querySelector(".footer-form");
    if (footerForm) {
      footerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = footerForm.querySelector("input");
        if (input) input.placeholder = "Subscribed ✓";
        footerForm.reset();
      });
    }
  }

  /* ---------------------------------------------------------
       7) Mobile nav — hamburger morphs to a close icon and opens
          a slide-in panel with a staggered link reveal.
    --------------------------------------------------------- */
  function initMobileNav() {
    const burger = document.getElementById("navBurger");
    const menu = document.getElementById("mobileMenu");
    const overlay = document.getElementById("mobileOverlay");
    if (!burger || !menu || !overlay) return;

    let open = false;

    function setOpen(next) {
      open = next;
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("open", open);
      menu.setAttribute("aria-hidden", String(!open));
      overlay.classList.toggle("show", open);
      document.body.style.overflow = open ? "hidden" : "";

      if (open && animate) {
        const links = menu.querySelectorAll(".mobile-link");
        animate(
          links,
          {
            opacity: [0, 1],
            transform: ["translateX(18px)", "translateX(0px)"],
          },
          {
            delay: stagger(0.06, { start: 0.15 }),
            duration: 0.4,
            easing: [0.22, 1, 0.36, 1],
          }
        );
      }
    }

    burger.addEventListener("click", () => setOpen(!open));
    overlay.addEventListener("click", () => setOpen(false));
    menu.querySelectorAll(".mobile-link, .mobile-cta").forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && open) setOpen(false);
    });
    window.addEventListener("resize", () => {
      if (open && window.innerWidth > 920) setOpen(false);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    restoreSavedImages();
    initImageUploads();
    playHero();
    initScrollReveal();
    initCounters();
    initServiceCarousel();
    initCardHover();
    initCtaForm();
    initMobileNav();
  });
})();
