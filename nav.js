function initMobileMenu() {
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  const appShell = document.querySelector('.app-shell');

  if (!menuToggle || !sidebar || !appShell) return;

  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('mobile-open');
    appShell.classList.toggle('menu-open');
  });

  document.querySelectorAll('.sidebar a').forEach((link) => {
    link.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      appShell.classList.remove('menu-open');
    });
  });

  appShell.addEventListener('click', (e) => {
    if (e.target === appShell && appShell.classList.contains('menu-open')) {
      sidebar.classList.remove('mobile-open');
      appShell.classList.remove('menu-open');
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.sidebar') && !e.target.closest('.menu-toggle')) {
      sidebar.classList.remove('mobile-open');
      appShell.classList.remove('menu-open');
    }
  });
}

window.addEventListener('DOMContentLoaded', initMobileMenu);
