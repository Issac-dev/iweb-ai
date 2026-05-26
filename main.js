const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasGsap = Boolean(window.gsap && window.ScrollTrigger && window.ScrollToPlugin);
const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

if (window.AOS) {
  window.AOS.init({
    once: true,
    duration: 800,
    easing: "ease-in-out",
    disable: prefersReducedMotion
  });
}

if (hasGsap) {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
}

const navContent = document.querySelector(".nav-content");
const navMeter = document.querySelector(".nav-meter");
const navMeterFill = document.querySelector(".meter-fill");
const navMeterScore = document.querySelector(".meter-score");
const navMeterStatusText = document.querySelector(".nav-meter-status-text");
const heroVideo = document.getElementById("heroVideo");
const secondaryVideo = document.querySelector(".video-section-player");
const heroScanTrigger = document.getElementById("heroScanTrigger");
const scanBtn = document.getElementById("scanBtn");
const scanInput = document.getElementById("scanUrl");
const scanResults = document.getElementById("scannerResults");
const barFill = document.getElementById("barFill");
const barLabel = document.getElementById("barLabel");
const scanDomain = document.getElementById("scanDomain");
const scannerProgress = document.querySelector(".scanner-bar");
const internalLinks = document.querySelectorAll('a[href^="#"]');
const scrollButtons = document.querySelectorAll("[data-scroll-target]");

const SCORES = {
  aiScores: [9, 14, 18, 22, 12, 31, 8],
  perfScores: [28, 35, 42, 38, 29, 51, 33],
  llmRatings: ["Poor", "Poor", "Weak", "Poor", "Critical", "Weak", "Critical"]
};

function smoothScrollTo(target) {
  if (!target) {
    return;
  }

  if (hasGsap && !prefersReducedMotion) {
    gsap.to(window, {
      duration: 1.1,
      ease: "power3.inOut",
      scrollTo: target
    });
    return;
  }

  target.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "start"
  });
}

internalLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const hash = link.getAttribute("href");
    if (!hash || hash === "#") {
      return;
    }

    const target = document.querySelector(hash);
    if (!target) {
      return;
    }

    event.preventDefault();
    smoothScrollTo(target);
  });
});

scrollButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selector = button.getAttribute("data-scroll-target");
    const target = selector ? document.querySelector(selector) : null;
    smoothScrollTo(target);
  });
});

if (navMeter) {
  navMeter.addEventListener("click", () => {
    const scanner = document.getElementById("scanner");
    smoothScrollTo(scanner);
  });
}

if (heroScanTrigger && scanInput) {
  heroScanTrigger.addEventListener("click", () => {
    scanInput.focus();
    if (window.innerWidth < 860) {
      smoothScrollTo(document.getElementById("scanner"));
    }
  });
}

function updateNavSurface() {
  if (!navContent) {
    return;
  }

  const opacity = window.scrollY > 80 ? 0.17 : 0.1;
  navContent.style.background = `rgba(255, 255, 255, ${opacity})`;
}

window.addEventListener("scroll", updateNavSurface, { passive: true });
updateNavSurface();

function primeVideo(videoEl) {
  if (!videoEl) {
    return;
  }

  videoEl.muted = true;
  videoEl.setAttribute("playsinline", "");
  videoEl.setAttribute("webkit-playsinline", "");

  document.documentElement.addEventListener("touchstart", () => {
    videoEl.play().then(() => {
      videoEl.pause();
      if (videoEl.currentTime < 0.01) {
        videoEl.currentTime = 0.01;
      }
    }).catch(() => {});
  }, { once: true });
}

primeVideo(heroVideo);
primeVideo(secondaryVideo);

function setupVideoSync(videoEl, config) {
  if (!videoEl || !hasGsap || prefersReducedMotion) {
    return;
  }

  let initialized = false;

  const initSync = () => {
    if (initialized || !Number.isFinite(videoEl.duration) || videoEl.duration <= 0 || videoEl.readyState < 2) {
      return;
    }

    initialized = true;

    ScrollTrigger.create({
      trigger: config.trigger,
      start: config.start || "top top",
      end: config.end,
      endTrigger: config.endTrigger,
      scrub: config.scrub || 0.8,
      pin: config.pin || false,
      pinSpacing: config.pinSpacing,
      anticipatePin: config.anticipatePin || 0,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const duration = Math.max(videoEl.duration - 0.1, 0.01);
        const nextTime = Math.min(duration, Math.max(0, duration * self.progress));
        if (Math.abs(videoEl.currentTime - nextTime) > 0.02) {
          videoEl.currentTime = nextTime;
        }
      }
    });

    ScrollTrigger.refresh();
  };

  if (videoEl.readyState >= 2 && videoEl.duration) {
    initSync();
  } else {
    videoEl.addEventListener("loadeddata", initSync, { once: true });
    videoEl.addEventListener("canplay", initSync, { once: true });
  }
}

const useMobileHeroScroll = isiOS && window.matchMedia("(max-width: 860px)").matches;

setupVideoSync(heroVideo, useMobileHeroScroll ? {
  trigger: "#home",
  endTrigger: "#home",
  end: "bottom top",
  scrub: 0.65,
  pin: false,
  pinSpacing: false
} : {
  trigger: "#home",
  end: () => {
    const durationMultiplier = heroVideo && heroVideo.duration
      ? Math.min(Math.max(heroVideo.duration * 0.5, 4.8), 6.2)
      : 5.1;
    return `+=${Math.round(window.innerHeight * durationMultiplier)}`;
  },
  scrub: 0.95,
  pin: true,
  pinSpacing: true,
  anticipatePin: 1
});

setupVideoSync(secondaryVideo, {
  trigger: "#video2-section",
  end: () => `+=${Math.round(window.innerHeight * 3.5)}`,
  scrub: 0.8,
  pin: true,
  pinSpacing: true
});

if (hasGsap && !prefersReducedMotion) {
  gsap.fromTo(
    ".hero-line-1",
    { yPercent: 110, opacity: 0 },
    { yPercent: 0, opacity: 1, duration: 0.9, ease: "power3.out", delay: 0.25 }
  );

  gsap.fromTo(
    ".hero-line-2",
    { yPercent: 110, opacity: 0 },
    { yPercent: 0, opacity: 1, duration: 0.9, ease: "power3.out", delay: 0.48 }
  );
}

function animateCount(element, target, duration = 800, suffix = "") {
  if (!element) {
    return;
  }

  const startTime = performance.now();

  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const nextValue = Math.round(progress * target);
    element.textContent = `${nextValue}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

function setMetricState(score) {
  if (!navMeterFill || !navMeterScore) {
    return;
  }

  let strokeColor = "var(--color-danger)";
  let statusText = "Low visibility";

  if (score >= 60) {
    strokeColor = "var(--color-secondary)";
    statusText = "Strong signal";
  } else if (score >= 30) {
    strokeColor = "var(--color-warn)";
    statusText = "Needs work";
  }

  navMeterFill.style.strokeDashoffset = 100 - score;
  navMeterFill.style.stroke = strokeColor;
  navMeterScore.textContent = String(score);

  if (navMeterStatusText) {
    navMeterStatusText.textContent = statusText;
  }
}

function runScan() {
  if (!scanResults || !scanInput) {
    return;
  }

  const inputValue = scanInput.value.trim() || "yoursite.com.ng";
  const idx = Math.floor(Math.random() * SCORES.aiScores.length);
  const ai = SCORES.aiScores[idx];
  const perf = SCORES.perfScores[idx];
  const llm = SCORES.llmRatings[idx];

  scanResults.hidden = false;
  scanResults.removeAttribute("hidden");

  if (scanDomain) {
    scanDomain.textContent = inputValue.replace(/^https?:\/\//, "");
  }

  animateCount(document.getElementById("metricAI"), ai);
  animateCount(document.getElementById("metricSchema"), 0);
  animateCount(document.getElementById("metricPerf"), perf);

  const metricLlm = document.getElementById("metricLLM");
  if (metricLlm) {
    metricLlm.textContent = llm;
  }

  window.setTimeout(() => {
    if (barFill) {
      barFill.style.width = `${ai}%`;
      barFill.style.background = ai < 30
        ? "var(--color-danger)"
        : ai < 60
          ? "var(--color-warn)"
          : "var(--color-success)";
    }

    if (barLabel) {
      barLabel.textContent = `${ai}%`;
    }

    if (scannerProgress) {
      scannerProgress.setAttribute("aria-valuenow", String(ai));
    }
  }, 100);

  setMetricState(ai);

  if (hasGsap && !prefersReducedMotion) {
    gsap.fromTo(
      scanResults,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", overwrite: true }
    );
  } else {
    scanResults.style.opacity = "1";
  }
}

if (scanBtn) {
  scanBtn.addEventListener("click", runScan);
}

if (scanInput) {
  scanInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      runScan();
    }
  });
}

setMetricState(23);

function initButtonMotion() {
  if (!hasGsap || prefersReducedMotion) {
    return;
  }

  const animatedButtons = document.querySelectorAll(
    ".cta-button, .scanner-btn, .scanner-fix-btn, .nav-cta, .price-button, .contact-primary, .contact-secondary"
  );

  animatedButtons.forEach((button) => {
    button.addEventListener("mouseenter", () => {
      gsap.to(button, { y: -2, duration: 0.2, ease: "power2.out" });
    });

    button.addEventListener("mouseleave", () => {
      gsap.to(button, { y: 0, duration: 0.2, ease: "power2.out" });
    });

    button.addEventListener("click", () => {
      gsap.fromTo(
        button,
        { scale: 1 },
        { scale: 0.97, duration: 0.08, yoyo: true, repeat: 1, ease: "power1.inOut" }
      );
    });
  });
}

initButtonMotion();

function initTestimonialLoop() {
  const viewport = document.querySelector(".testimonial-viewport");
  const track = document.querySelector(".testimonial-track");

  if (!viewport || !track || !hasGsap || prefersReducedMotion) {
    return;
  }

  const originalMarkup = track.innerHTML;
  let tween = null;

  function buildLoop() {
    track.innerHTML = originalMarkup + originalMarkup;

    const cards = Array.from(track.children);
    const originalCount = cards.length / 2;
    const originalCards = cards.slice(0, originalCount);
    const gap = parseFloat(window.getComputedStyle(track).gap) || 0;

    const singleLoopWidth = originalCards.reduce((total, card, index) => {
      return total + card.getBoundingClientRect().width + (index < originalCards.length - 1 ? gap : 0);
    }, 0);

    if (tween) {
      tween.kill();
    }

    gsap.set(track, { x: 0 });

    tween = gsap.to(track, {
      x: -singleLoopWidth,
      duration: 28,
      ease: "none",
      repeat: -1
    });
  }

  buildLoop();

  viewport.addEventListener("mouseenter", () => {
    if (tween) {
      tween.pause();
    }
  });

  viewport.addEventListener("mouseleave", () => {
    if (tween) {
      tween.resume();
    }
  });

  viewport.addEventListener("focusin", () => {
    if (tween) {
      tween.pause();
    }
  });

  viewport.addEventListener("focusout", () => {
    if (tween) {
      tween.resume();
    }
  });

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(buildLoop, 180);
  });
}

window.addEventListener("load", initTestimonialLoop);
