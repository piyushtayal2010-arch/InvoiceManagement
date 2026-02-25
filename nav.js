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

function injectProfileMenu() {
  const navWrapper = document.querySelector('.app-nav .nav-wrapper');
  if (!navWrapper || navWrapper.querySelector('.profile-menu-wrap')) return;

  const wrap = document.createElement('div');
  wrap.className = 'profile-menu-wrap';
  wrap.innerHTML = `
    <a class="dropdown-trigger profile-trigger" href="#" data-target="profileDropdown" aria-label="Profile menu">
      <i class="material-icons">account_circle</i>
    </a>
    <ul id="profileDropdown" class="dropdown-content profile-dropdown">
      <li><a href="#" id="editProfileAction">Edit Profile</a></li>
      <li class="divider" tabindex="-1"></li>
      <li><a href="#" id="logoutAction">Logout</a></li>
    </ul>
  `;
  navWrapper.appendChild(wrap);
  M.Dropdown.init(wrap.querySelector('.dropdown-trigger'), { constrainWidth: false, coverTrigger: false });

  wrap.querySelector('#logoutAction').addEventListener('click', (e) => {
    e.preventDefault();
    window.Auth.logout();
  });

  wrap.querySelector('#editProfileAction').addEventListener('click', async (e) => {
    e.preventDefault();
    await openProfileModal();
  });
}

function injectProfileModal() {
  if (document.getElementById('profileModal')) return;
  const modal = document.createElement('div');
  modal.id = 'profileModal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h5>Edit Profile</h5>
      <div class="row">
        <div class="input-field col s12">
          <input id="profileFullName" type="text">
          <label for="profileFullName">Full Name</label>
        </div>
        <div class="input-field col s12">
          <input id="profileCountry" type="text">
          <label for="profileCountry">Country</label>
        </div>
        <div class="input-field col s12">
          <input id="profileEmail" type="email" disabled>
          <label for="profileEmail">Email</label>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <a href="#!" class="modal-close waves-effect btn-flat">Cancel</a>
      <button id="saveProfileBtn" class="btn waves-effect waves-light">Save</button>
    </div>
  `;
  document.body.appendChild(modal);
  M.Modal.init(modal);
}

async function openProfileModal() {
  injectProfileModal();
  const modalEl = document.getElementById('profileModal');
  const modal = M.Modal.getInstance(modalEl);
  const user = window.Auth.getUser() || {};

  document.getElementById('profileFullName').value = user.fullName || '';
  document.getElementById('profileCountry').value = user.country || '';
  document.getElementById('profileEmail').value = user.email || '';
  M.updateTextFields();
  modal.open();

  const saveBtn = document.getElementById('saveProfileBtn');
  saveBtn.onclick = async () => {
    const fullName = document.getElementById('profileFullName').value.trim();
    const country = document.getElementById('profileCountry').value.trim();
    if (!fullName || !country) {
      M.toast({ html: 'Full name and country are required' });
      return;
    }
    saveBtn.disabled = true;
    try {
      const result = await window.Api.saveProfile({ fullName, country });
      window.Auth.setSession(result.token, result.user);
      updateNavIdentity(result.user);
      modal.close();
      M.toast({ html: 'Profile updated' });
    } catch (err) {
      M.toast({ html: err.message || 'Profile update failed' });
    } finally {
      saveBtn.disabled = false;
    }
  };
}

function updateNavIdentity(user) {
  const brandLogo = document.querySelector('.brand-logo');
  if (!brandLogo) return;
  const name = user?.fullName || user?.email || 'Invoice Workspace';
  brandLogo.textContent = `Invoice Workspace | ${name}`;
}

async function hydrateUser() {
  try {
    const data = await window.Api.getProfile();
    if (data?.user) {
      const token = window.Auth.getToken();
      if (token) window.Auth.setSession(token, data.user);
      return data.user;
    }
  } catch (_err) {
    // fall back to token user data
  }
  return window.Auth.getUser();
}

window.addEventListener('DOMContentLoaded', async () => {
  const ok = await window.Auth.requireAuth();
  if (!ok) return;
  const user = await hydrateUser();
  initMobileMenu();
  updateNavIdentity(user);
  injectProfileMenu();
});
