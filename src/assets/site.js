(() => {
  // Close the mobile menu by default; it stays open on large screens.
  const sidebar = document.getElementById('sidebar');
  const wide = window.matchMedia('(min-width: 900px)');
  const syncSidebar = () => {
    if (wide.matches) sidebar.setAttribute('open', '');
    else sidebar.removeAttribute('open');
  };
  syncSidebar();
  wide.addEventListener('change', syncSidebar);

  // Support form: absolute redirect URL, subject line, and file size check.
  const form = document.getElementById('support-form');
  if (!form) return;

  const next = form.querySelector('[name="_next"]');
  next.value = new URL('thanks.html', window.location.href).href;

  const subject = form.querySelector('#subject');
  const subjectLine = form.querySelector('[name="_subject"]');
  const file = form.querySelector('#attachment');
  const error = form.querySelector('.form-error');
  const MAX_BYTES = 5 * 1024 * 1024;

  // Until the form endpoint is configured in site.config.json, don't let requests get lost.
  if (form.action.includes('YOUR-FORM-ID')) {
    form.querySelector('[type="submit"]').disabled = true;
    error.textContent = 'The support form is being set up and will be available shortly.';
    error.hidden = false;
    return;
  }

  form.addEventListener('submit', (event) => {
    error.hidden = true;
    if (file.files.length && file.files[0].size > MAX_BYTES) {
      event.preventDefault();
      error.textContent = 'The screenshot is larger than 5 MB. Please attach a smaller image or add a link in the description.';
      error.hidden = false;
      file.focus();
      return;
    }
    subjectLine.value = `Ironbench support: ${subject.value.trim() || 'New request'}`;
  });
})();
