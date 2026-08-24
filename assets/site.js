const GOOGLE_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSd_VwRRykfyUkD1rMcidgDw0SqKoA7FvXzXgxs7wIwB_WYXOQ/formResponse";

const GOOGLE_EMAIL_FIELD = "entry.2054451267";
const GOOGLE_PLUGIN_FIELD = "entry.990461776";
const GOOGLE_PLATFORM_FIELD = "entry.1787359691";

const UNLOCK_KEY = "literalSoundsLabsDownloadsUnlocked";
const EMAIL_KEY = "literalSoundsLabsDownloadEmail";

function downloadsUnlocked() {
  return localStorage.getItem(UNLOCK_KEY) === "yes";
}

function getStoredEmail() {
  return localStorage.getItem(EMAIL_KEY) || "";
}

function triggerDownload(href) {
  if (!href) return;

  const link = document.createElement("a");
  link.href = href;
  link.download = "";
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/*
 * Opens the email dialog and remembers exactly which download
 * the visitor was trying to access.
 */
function openUnlockDialog(downloadHref, plugin = "", platform = "") {
  const dialog = document.getElementById("unlockDialog");
  if (!dialog) return;

  dialog.dataset.pendingDownload = downloadHref || "";
  dialog.dataset.pendingPlugin = plugin || "";
  dialog.dataset.pendingPlatform = platform || "";

  const message = document.getElementById("formMessage");
  if (message) message.textContent = "";

  const submit = document.getElementById("submitEmail");
  if (submit) {
    submit.disabled = false;
    submit.textContent = "Unlock downloads";
  }

  const emailInput = document.getElementById("emailInput");

  /*
   * If we already have an email stored but the browser has lost
   * the unlock flag, pre-fill it for convenience.
   */
  if (emailInput && !emailInput.value) {
    const storedEmail = getStoredEmail();
    if (storedEmail) emailInput.value = storedEmail;
  }

  dialog.showModal();
  document.body.style.overflow = "hidden";

  setTimeout(() => {
    document.getElementById("emailInput")?.focus();
  }, 90);
}

function closeAnyDialog(dialog) {
  if (!dialog) return;

  if (dialog.open) dialog.close();

  if (!document.querySelector("dialog[open]")) {
    document.body.style.overflow = "";
  }
}

/*
 * Send a download record to Google Forms.
 *
 * Google Forms is being used as a simple download log:
 * Email + Plugin + Platform.
 */
async function recordDownload(email, plugin, platform) {
  if (!email) return;

  const data = new FormData();

  data.append(GOOGLE_EMAIL_FIELD, email);
  data.append(GOOGLE_PLUGIN_FIELD, plugin || "");
  data.append(GOOGLE_PLATFORM_FIELD, platform || "");

  /*
   * no-cors is required because this is a browser-to-Google-Forms
   * cross-origin submission. The request is sent successfully even
   * though JavaScript cannot read Google's response.
   */
  try {
    await fetch(GOOGLE_FORM_URL, {
      method: "POST",
      mode: "no-cors",
      body: data
    });
  } catch (error) {
    /*
     * Do not block the user's download if Google Forms is temporarily
     * unreachable. The download itself should still work.
     */
    console.warn("Download tracking could not be submitted:", error);
  }
}

function updateUnlockUI() {
  const unlocked = downloadsUnlocked();

  document.querySelectorAll("[data-download-trigger]").forEach(button => {
    button.textContent = unlocked
      ? (button.dataset.unlockedLabel || "Download")
      : (button.dataset.lockedLabel || "Unlock download");
  });

  const title = document.getElementById("unlockTitle");
  const text = document.getElementById("unlockText");

  if (title && text && unlocked) {
    title.textContent = "Downloads unlocked.";
    text.textContent =
      "All plugin download buttons are now available on this device.";
  }
}

function detectVisitorPlatform() {
  const platform = (
    navigator.userAgentData?.platform ||
    navigator.platform ||
    navigator.userAgent ||
    ""
  ).toLowerCase();

  if (
    platform.includes("mac") ||
    platform.includes("iphone") ||
    platform.includes("ipad")
  ) {
    return "macos";
  }

  if (platform.includes("win")) {
    return "windows";
  }

  return "";
}

function platformDisplayName(platform) {
  if (platform === "macos") return "macOS";
  if (platform === "windows") return "Windows";
  return platform || "";
}

function highlightRecommendedPlatform() {
  const platform = detectVisitorPlatform();
  if (!platform) return;

  document
    .querySelectorAll(`[data-platform="${platform}"]`)
    .forEach(button => {
      button.classList.add("recommended");
      button.setAttribute(
        "title",
        `${button.textContent} — recommended for this device`
      );
    });
}

/*
 * Download button handling.
 *
 * Every download button should contain:
 *
 * data-download-trigger
 * data-href
 * data-plugin
 * data-platform
 */
function bindDownloadTriggers() {
  document.querySelectorAll("[data-download-trigger]").forEach(button => {
    button.addEventListener("click", async () => {
      const href = button.dataset.href || "";
      const plugin = button.dataset.plugin || "";
      const platform = platformDisplayName(button.dataset.platform || "");

      if (!href) return;

      /*
       * Already unlocked:
       * record this specific plugin/platform download, then download.
       */
      if (downloadsUnlocked()) {
        const email = getStoredEmail();

        /*
         * Older users may have the old unlock flag but no stored email.
         * Ask for their email once so future downloads can be tracked.
         */
        if (!email) {
          openUnlockDialog(href, plugin, platform);
          return;
        }

        await recordDownload(email, plugin, platform);
        triggerDownload(href);
        return;
      }

      /*
       * Not unlocked:
       * open the email dialog and remember the requested download.
       */
      openUnlockDialog(href, plugin, platform);
    });
  });
}

function bindDialogs() {
  document.querySelectorAll(".dialog-close").forEach(btn => {
    btn.addEventListener("click", () => {
      closeAnyDialog(btn.closest("dialog"));
    });
  });

  document.querySelectorAll("dialog").forEach(dialog => {
    dialog.addEventListener("click", event => {
      const rect = dialog.getBoundingClientRect();

      const outside =
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom;

      if (outside) {
        closeAnyDialog(dialog);
      }
    });

    dialog.addEventListener("close", () => {
      if (!document.querySelector("dialog[open]")) {
        document.body.style.overflow = "";
      }
    });
  });

  const form = document.getElementById("emailForm");

  if (!form) return;

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const emailInput = document.getElementById("emailInput");
    const email = emailInput?.value.trim() || "";

    const message = document.getElementById("formMessage");
    const submit = document.getElementById("submitEmail");

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      if (message) {
        message.textContent = "Please enter a valid email address.";
      }
      return;
    }

    if (submit) {
      submit.disabled = true;
      submit.textContent = "Unlocking…";
    }

    if (message) {
      message.textContent = "";
    }

    const dialog = document.getElementById("unlockDialog");

    const pendingDownload =
      dialog?.dataset.pendingDownload || "";

    const pendingPlugin =
      dialog?.dataset.pendingPlugin || "";

    const pendingPlatform =
      dialog?.dataset.pendingPlatform || "";

    try {
      /*
       * Store the email locally so subsequent individual downloads
       * can be tracked without asking for the email again.
       */
      localStorage.setItem(EMAIL_KEY, email);
      localStorage.setItem(UNLOCK_KEY, "yes");

      /*
       * Record the download that caused the unlock.
       *
       * If the dialog was opened from the general "Enter email"
       * button, plugin/platform will simply be blank.
       */
      if (pendingDownload) {
        await recordDownload(
          email,
          pendingPlugin,
          pendingPlatform
        );
      } else {
        /*
         * General email registration from the Downloads section.
         * This keeps the original behavior of recording the email.
         */
        await recordDownload(email, "", "");
      }

      updateUnlockUI();

      if (message) {
        message.textContent = pendingDownload
          ? "Downloads unlocked."
          : "Downloads unlocked. You can now download the plugins.";
      }

      setTimeout(() => {
        closeAnyDialog(dialog);

        if (pendingDownload) {
          triggerDownload(pendingDownload);
        }

        if (dialog) {
          dialog.dataset.pendingDownload = "";
          dialog.dataset.pendingPlugin = "";
          dialog.dataset.pendingPlatform = "";
        }
      }, 450);

    } catch (error) {
      console.error("Download unlock error:", error);

      if (message) {
        message.textContent =
          "The download access request could not be completed. Please try again.";
      }
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.textContent = "Unlock downloads";
      }
    }
  });
}

function bindVideoPreviews() {
  document.querySelectorAll(".video-preview").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.youtubeId;
      const title =
        button.dataset.videoTitle || "YouTube video";

      if (!id) return;

      const shell = button.closest(".video-shell");

      if (!shell) return;

      shell.innerHTML = `
        <iframe
          src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0"
          title="${title}"
          referrerpolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen>
        </iframe>
      `;
    });
  });
}

function bindHeaderMotion() {
  const header = document.getElementById("siteHeader");

  let ticking = false;
  let scrollStopTimer;

  const update = () => {
    header?.classList.toggle(
      "scrolled",
      window.scrollY > 20
    );

    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }

      document.body.classList.add("is-scrolling");

      clearTimeout(scrollStopTimer);

      scrollStopTimer = setTimeout(() => {
        document.body.classList.remove("is-scrolling");
      }, 100);
    },
    { passive: true }
  );

  update();

  document.addEventListener("visibilitychange", () => {
    document.body.classList.toggle(
      "page-hidden",
      document.hidden
    );
  });
}

function bindActiveNavigation() {
  const links = Array.from(
    document.querySelectorAll(".nav-links [data-nav]")
  );

  if (!links.length) return;

  const setActive = key => {
    links.forEach(link => {
      const active = link.dataset.nav === key;

      link.classList.toggle("is-active", active);

      if (active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const cleanPath =
    window.location.pathname.replace(/\/+$/, "") || "/";

  const isContact =
    cleanPath.endsWith("/contact.html");

  const isPlugin =
    cleanPath.includes("/plugins/");

  const isLegal =
    /\/(terms|privacy|refund)\.html$/.test(cleanPath);

  const isHome =
    cleanPath === "/" ||
    cleanPath.endsWith("/index.html");

  if (isContact) {
    setActive("contact");
    return;
  }

  if (isPlugin) {
    setActive("plugins");
    return;
  }

  if (isLegal || !isHome) {
    setActive("");
    return;
  }

  const sections = [
    {
      key: "home",
      element: document.getElementById("top")
    },
    {
      key: "plugins",
      element: document.getElementById("plugins")
    },
    {
      key: "about",
      element: document.getElementById("about")
    },
    {
      key: "downloads",
      element: document.getElementById("downloads")
    }
  ].filter(item => item.element);

  let ticking = false;

  const update = () => {
    const headerHeight =
      document.getElementById("siteHeader")?.offsetHeight || 0;

    const activationLine =
      headerHeight +
      Math.max(70, window.innerHeight * 0.22);

    let current = "home";

    for (const section of sections) {
      const rect =
        section.element.getBoundingClientRect();

      if (rect.top <= activationLine) {
        current = section.key;
      }
    }

    if (
      window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 8 &&
      document.getElementById("downloads")
    ) {
      current = "downloads";
    }

    setActive(current);

    ticking = false;
  };

  const requestUpdate = () => {
    if (ticking) return;

    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener(
    "scroll",
    requestUpdate,
    { passive: true }
  );

  window.addEventListener(
    "resize",
    requestUpdate,
    { passive: true }
  );

  window.addEventListener(
    "hashchange",
    requestUpdate
  );

  links.forEach(link => {
    link.addEventListener("click", () => {
      const key = link.dataset.nav;

      if (key) {
        setActive(key);
      }

      setTimeout(requestUpdate, 120);
      setTimeout(requestUpdate, 450);
    });
  });

  requestUpdate();
}

function bindReveal() {
  const els = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    els.forEach(el => el.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  els.forEach(el => observer.observe(el));
}

document.addEventListener("DOMContentLoaded", () => {
  const year = document.getElementById("year");

  if (year) {
    year.textContent =
      new Date().getFullYear();
  }

  bindDownloadTriggers();
  bindDialogs();
  bindVideoPreviews();
  bindHeaderMotion();
  bindActiveNavigation();
  bindReveal();
  updateUnlockUI();
  highlightRecommendedPlatform();
});
