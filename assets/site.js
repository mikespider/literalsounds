
const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSd_VwRRykfyUkD1rMcidgDw0SqKoA7FvXzXgxs7wIwB_WYXOQ/formResponse";
const GOOGLE_EMAIL_FIELD = "entry.2054451267";
const UNLOCK_KEY = "literalSoundsLabsDownloadsUnlocked";

function downloadsUnlocked(){ return localStorage.getItem(UNLOCK_KEY) === "yes"; }

function triggerDownload(href) {
  if (!href) return;
  const link = document.createElement('a');
  link.href = href;
  link.download = '';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function openUnlockDialog(downloadHref) {
  const dialog = document.getElementById('unlockDialog');
  if (!dialog) return;
  dialog.dataset.pendingDownload = downloadHref || '';
  dialog.showModal();
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('emailInput')?.focus(), 90);
}

function closeAnyDialog(dialog) {
  dialog.close();
  if (!document.querySelector('dialog[open]')) document.body.style.overflow = '';
}

function updateUnlockUI() {
  const unlocked = downloadsUnlocked();
  document.querySelectorAll('[data-download-trigger]').forEach(button => {
    button.textContent = unlocked ? (button.dataset.unlockedLabel || 'Download') : (button.dataset.lockedLabel || 'Unlock download');
  });
  const title = document.getElementById('unlockTitle');
  const text = document.getElementById('unlockText');
  if (title && text && unlocked) {
    title.textContent = 'Downloads unlocked.';
    text.textContent = 'All plugin download buttons are now available on this device.';
  }
}

function bindDownloadTriggers() {
  document.querySelectorAll('[data-download-trigger]').forEach(button => {
    button.addEventListener('click', () => {
      const href = button.dataset.href;
      if (downloadsUnlocked()) triggerDownload(href);
      else openUnlockDialog(href);
    });
  });
}

function bindDialogs() {
  document.querySelectorAll('.dialog-close').forEach(btn => {
    btn.addEventListener('click', () => closeAnyDialog(btn.closest('dialog')));
  });
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
      if (outside) closeAnyDialog(dialog);
    });
    dialog.addEventListener('close', () => {
      if (!document.querySelector('dialog[open]')) document.body.style.overflow = '';
    });
  });
  const form = document.getElementById('emailForm');
  if (form) {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const email = document.getElementById('emailInput').value.trim();
      const message = document.getElementById('formMessage');
      const submit = document.getElementById('submitEmail');
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        message.textContent = 'Please enter a valid email address.';
        return;
      }
      submit.disabled = true;
      submit.textContent = 'Unlocking…';
      message.textContent = '';
      try {
        const data = new FormData();
        data.append(GOOGLE_EMAIL_FIELD, email);
        await fetch(GOOGLE_FORM_URL, { method: 'POST', mode: 'no-cors', body: data });
        localStorage.setItem(UNLOCK_KEY, 'yes');
        updateUnlockUI();
        message.textContent = 'Downloads unlocked.';
        const dialog = document.getElementById('unlockDialog');
        const pending = dialog?.dataset.pendingDownload || '';
        setTimeout(() => {
          closeAnyDialog(dialog);
          if (pending) triggerDownload(pending);
          dialog.dataset.pendingDownload = '';
        }, 450);
      } catch (error) {
        message.textContent = 'The form could not be reached. Please check your connection and try again.';
      } finally {
        submit.disabled = false;
        submit.textContent = 'Unlock downloads';
      }
    });
  }
}

function bindVideoPreviews() {
  document.querySelectorAll('.video-preview').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.youtubeId;
      const title = button.dataset.videoTitle || 'YouTube video';
      if (!id) return;
      const shell = button.closest('.video-shell');
      shell.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="${title}" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    });
  });
}

function bindHeaderMotion() {
  const header = document.getElementById('siteHeader');
  const hero = document.querySelector('.hero');
  let scrollFrame = 0;
  let scrollStopTimer = 0;
  function updateHeader() {
    header?.classList.toggle('scrolled', window.scrollY > 20);
    scrollFrame = 0;
  }
  window.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateHeader);
    document.body.classList.add('is-scrolling');
    clearTimeout(scrollStopTimer);
    scrollStopTimer = setTimeout(() => document.body.classList.remove('is-scrolling'), 140);
  }, { passive: true });
  updateHeader();
  if (hero) {
    const observer = new IntersectionObserver(entries => {
      const visible = entries[0] && entries[0].isIntersecting;
      hero.classList.toggle('hero-paused', !visible);
    }, { rootMargin: '80px 0px', threshold: 0.01 });
    observer.observe(hero);
  }
  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('page-hidden', document.hidden);
  });
}

function bindReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => observer.observe(el));
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year') && (document.getElementById('year').textContent = new Date().getFullYear());
  bindDownloadTriggers();
  bindDialogs();
  bindVideoPreviews();
  bindHeaderMotion();
  bindReveal();
  updateUnlockUI();
});
