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


/* =========================================================
   GOOGLE FORM SUBMISSION
   ========================================================= */

async function logDownload(email, plugin, platform) {
  if (!email) return;

  try {
    const data = new FormData();

    data.append(GOOGLE_EMAIL_FIELD, email);
    data.append(GOOGLE_PLUGIN_FIELD, plugin || "Unknown plugin");
    data.append(GOOGLE_PLATFORM_FIELD, platform || "Unknown");

    await fetch(GOOGLE_FORM_URL, {
      method: "POST",
      mode: "no-cors",
      body: data
    });

  } catch (error) {
    console.warn("Could not log download:", error);
  }
}


/* =========================================================
   DOWNLOAD
   ========================================================= */

function triggerDownload(href) {
  if (!href) return;

  const link = document.createElement("a");
  link.href = href;
  link.download = "";

  document.body.appendChild(link);
  link.click();
  link.remove();
}


/*
   This handles an actual plugin download.

   If the user has already entered their email, we log:
   - email
   - plugin
   - platform

   BEFORE starting the download.
*/

async function processDownload(button) {
  if (!button) return;

  const href = button.dataset.href || "";
  const plugin = button.dataset.plugin || "Unknown plugin";
  const platform = button.dataset.platform || "Unknown";

  if (!href) return;

  const email = getStoredEmail();

  /*
     If somehow the email is missing, ask for it again.
  */
  if (!email) {
    openUnlockDialog(href, plugin, platform);
    return;
  }

  /*
     Log this particular download.
  */
  await logDownload(email, plugin, platform);

  /*
     Then start the actual download.
  */
  triggerDownload(href);
}


/* =========================================================
   EMAIL / UNLOCK DIALOG
   ========================================================= */

function openUnlockDialog(downloadHref, plugin, platform) {
  const dialog = document.getElementById("unlockDialog");

  if (!dialog) return;

  dialog.dataset.pendingDownload = downloadHref || "";
  dialog.dataset.pendingPlugin = plugin || "";
  dialog.dataset.pendingPlatform = platform || "";

  dialog.showModal();

  document.body.style.overflow = "hidden";

  setTimeout(() => {
    document.getElementById("emailInput")?.focus();
  }, 90);
}


function closeAnyDialog(dialog) {
  if (!dialog) return;

  dialog.close();

  if (!document.querySelector("dialog[open]")) {
    document.body.style.overflow = "";
  }
}


/* =========================================================
   UPDATE DOWNLOAD BUTTONS
   ========================================================= */

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
      "Your email is registered. Download buttons are now available.";

  }
}


/* =========================================================
   PLATFORM DETECTION
   ========================================================= */

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


/* =========================================================
   DOWNLOAD BUTTONS
   ========================================================= */

function bindDownloadTriggers() {

  document
    .querySelectorAll("[data-download-trigger]")
    .forEach(button => {

      button.addEventListener("click", async () => {

        const href = button.dataset.href || "";
        const plugin = button.dataset.plugin || "";
        const platform = button.dataset.platform || "";

        /*
           Not unlocked yet:
           open email dialog.
        */

        if (!downloadsUnlocked()) {

          openUnlockDialog(
            href,
            plugin,
            platform
          );

          return;
        }

        /*
           Already unlocked:
           log this particular download.
        */

        await processDownload(button);

      });

    });

}


/* =========================================================
   DIALOGS + EMAIL FORM
   ========================================================= */

function bindDialogs() {

  /*
     Close buttons
  */

  document
    .querySelectorAll(".dialog-close")
    .forEach(btn => {

      btn.addEventListener("click", () => {

        closeAnyDialog(
          btn.closest("dialog")
        );

      });

    });


  /*
     Click outside dialog to close
  */

  document
    .querySelectorAll("dialog")
    .forEach(dialog => {

      dialog.addEventListener("click", event => {

        const rect =
          dialog.getBoundingClientRect();

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


  /*
     EMAIL FORM
  */

  const form =
    document.getElementById("emailForm");

  if (!form) return;


  form.addEventListener("submit", async event => {

    event.preventDefault();

    const emailInput =
      document.getElementById("emailInput");

    const email =
      emailInput.value.trim();

    const message =
      document.getElementById("formMessage");

    const submit =
      document.getElementById("submitEmail");

    /*
       Validate email
    */

    if (!/^\S+@\S+\.\S+$/.test(email)) {

      message.textContent =
        "Please enter a valid email address.";

      return;

    }


    submit.disabled = true;
    submit.textContent = "Unlocking…";
    message.textContent = "";


    /*
       Get information about the download
       that caused the dialog to open.
    */

    const dialog =
      document.getElementById("unlockDialog");

    const pending =
      dialog?.dataset.pendingDownload || "";

    const plugin =
      dialog?.dataset.pendingPlugin || "";

    const platform =
      dialog?.dataset.pendingPlatform || "";


    try {

      /*
         Store the email locally.

         This allows later downloads on this
         device to be associated with the
         same email address.
      */

      localStorage.setItem(
        EMAIL_KEY,
        email
      );

      localStorage.setItem(
        UNLOCK_KEY,
        "yes"
      );


      /*
         Record the first download/unlock.

         If the dialog was opened from a
         particular plugin button, record
         that plugin and platform.
      */

      await logDownload(
        email,
        plugin || "Download unlock",
        platform || "Unknown"
      );


      /*
         Update the page.
      */

      updateUnlockUI();


      message.textContent =
        "Downloads unlocked.";


      /*
         Close dialog and download the
         originally requested plugin.
      */

      setTimeout(() => {

        closeAnyDialog(dialog);

        if (pending) {
          triggerDownload(pending);
        }

        if (dialog) {
          dialog.dataset.pendingDownload = "";
          dialog.dataset.pendingPlugin = "";
          dialog.dataset.pendingPlatform = "";
        }

      }, 450);


    } catch (error) {

      console.error(error);

      message.textContent =
        "The form could not be reached. Please check your connection and try again.";

    } finally {

      submit.disabled = false;
      submit.textContent =
        "Unlock downloads";

    }

  });

}


/* =========================================================
   VIDEO PREVIEWS
   ========================================================= */

function bindVideoPreviews() {

  document
    .querySelectorAll(".video-preview")
    .forEach(button => {

      button.addEventListener("click", () => {

        const id =
          button.dataset.youtubeId;

        const title =
          button.dataset.videoTitle ||
          "YouTube video";

        if (!id) return;

        const shell =
          button.closest(".video-shell");

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


/* =========================================================
   HEADER MOTION
   ========================================================= */

function bindHeaderMotion() {

  const header =
    document.getElementById("siteHeader");

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

      document.body.classList.add(
        "is-scrolling"
      );

      clearTimeout(scrollStopTimer);

      scrollStopTimer = setTimeout(() => {

        document.body.classList.remove(
          "is-scrolling"
        );

      }, 100);

    },
    { passive: true }
  );


  update();


  document.addEventListener(
    "visibilitychange",
    () => {

      document.body.classList.toggle(
        "page-hidden",
        document.hidden
      );

    }
  );

}


/* =========================================================
   ACTIVE NAVIGATION
   ========================================================= */

function bindActiveNavigation() {

  const links =
    Array.from(
      document.querySelectorAll(
        ".nav-links [data-nav]"
      )
    );

  if (!links.length) return;


  const setActive = key => {

    links.forEach(link => {

      const active =
        link.dataset.nav === key;

      link.classList.toggle(
        "is-active",
        active
      );

      if (active) {
        link.setAttribute(
          "aria-current",
          "page"
        );
      } else {
        link.removeAttribute(
          "aria-current"
        );
      }

    });

  };


  const cleanPath =
    window.location.pathname
      .replace(/\/+$/, "") || "/";

  const isContact =
    cleanPath.endsWith(
      "/contact.html"
    );

  const isPlugin =
    cleanPath.includes(
      "/plugins/"
    );

  const isLegal =
    /\/(terms|privacy|refund)\.html$/
      .test(cleanPath);

  const isHome =
    cleanPath === "/" ||
    cleanPath.endsWith(
      "/index.html"
    );


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
      element:
        document.getElementById("top")
    },

    {
      key: "plugins",
      element:
        document.getElementById("plugins")
    },

    {
      key: "about",
      element:
        document.getElementById("about")
    },

    {
      key: "downloads",
      element:
        document.getElementById("downloads")
    }

  ].filter(item => item.element);


  let ticking = false;


  const update = () => {

    const headerHeight =
      document.getElementById(
        "siteHeader"
      )?.offsetHeight || 0;

    const activationLine =
      headerHeight +
      Math.max(
        70,
        window.innerHeight * 0.22
      );

    let current = "home";


    for (const section of sections) {

      const rect =
        section.element
          .getBoundingClientRect();

      if (rect.top <= activationLine) {
        current = section.key;
      }

    }


    if (
      window.innerHeight +
      window.scrollY >=
      document.documentElement
        .scrollHeight - 8 &&
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

    link.addEventListener(
      "click",
      () => {

        const key =
          link.dataset.nav;

        if (key) {
          setActive(key);
        }

        setTimeout(
          requestUpdate,
          120
        );

        setTimeout(
          requestUpdate,
          450
        );

      }
    );

  });


  requestUpdate();

}


/* =========================================================
   REVEAL ANIMATIONS
   ========================================================= */

function bindReveal() {

  const els =
    document.querySelectorAll(
      ".reveal"
    );

  if (
    !("IntersectionObserver" in window)
  ) {

    els.forEach(el =>
      el.classList.add("visible")
    );

    return;

  }


  const observer =
    new IntersectionObserver(
      entries => {

        entries.forEach(entry => {

          if (entry.isIntersecting) {

            entry.target.classList.add(
              "visible"
            );

            observer.unobserve(
              entry.target
            );

          }

        });

      },
      { threshold: 0.12 }
    );


  els.forEach(el =>
    observer.observe(el)
  );

}


/* =========================================================
   INITIALISE
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const year =
      document.getElementById("year");

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

  }
);
