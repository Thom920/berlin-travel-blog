document.getElementById('mobile-menu-btn')?.addEventListener('click', function () {
    document.getElementById('mobile-menu')?.classList.toggle('hidden');
});

function triggerToast(message) {
    const toast = document.getElementById('sync-toast');
    if (!toast) return;

    const messageEl = toast.querySelector('[data-toast-message]');
    if (message && messageEl) {
        messageEl.textContent = message;
    }

    toast.classList.remove('hidden');
    toast.classList.add('toast-enter');

    setTimeout(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-exit');

        setTimeout(() => {
            toast.classList.add('hidden');
            toast.classList.remove('toast-exit');
        }, 300);
    }, 3000);
}

const mapLocations = {
    'urban-nation': {
        title: 'Urban Nation',
        description: 'Street art museum in Berlin-Schöneberg. Een duik in de wereld van urban art en graffiti.',
    },
    'ddr-museum': {
        title: 'DDR Museum',
        description: 'Interactief museum over het leven in voormalig Oost-Duitsland, aan de Spree.',
    },
    teufelsberg: {
        title: 'Teufelsberg',
        description: 'Voormalige afluisterpost uit de Koude Oorlog met uitzicht over Berlijn en indrukwekkende graffiti.',
    },
};

function openMapModal(locationId) {
    const modal = document.getElementById('map-modal');
    if (!modal) return;

    const location = locationId ? mapLocations[locationId] : null;
    const titleEl = modal.querySelector('[data-map-modal-title]');
    const descriptionEl = modal.querySelector('[data-map-modal-description]');

    if (location && titleEl && descriptionEl) {
        titleEl.textContent = location.title;
        descriptionEl.textContent = location.description;
    }

    modal.classList.remove('hidden');
}

function closeMapModal() {
    document.getElementById('map-modal')?.classList.add('hidden');
}

const cmsLocationCoords = {
    'urban-nation': { lat: 52.4989, lng: 13.3622 },
    'ddr-museum': { lat: 52.5194, lng: 13.4025 },
    teufelsberg: { lat: 52.4961, lng: 13.2414 },
};

function initCms() {
    const loginSection = document.getElementById('cms-login');
    const dashboard = document.getElementById('cms-dashboard');
    if (!loginSection || !dashboard) return;

    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('cms-logout-btn');
    const postForm = document.getElementById('post-form');
    const cancelBtn = document.getElementById('post-cancel-btn');
    const locationSelect = document.getElementById('post-location');
    const latInput = document.getElementById('post-latitude');
    const lngInput = document.getElementById('post-longitude');
    const navButtons = document.querySelectorAll('.cms-nav-btn');
    const panels = document.querySelectorAll('.cms-panel');

    function showDashboard() {
        loginSection.classList.add('hidden');
        dashboard.classList.remove('hidden');
    }

    function showLogin() {
        dashboard.classList.add('hidden');
        loginSection.classList.remove('hidden');
        loginForm?.reset();
    }

    function switchPanel(panelId) {
        panels.forEach((panel) => {
            panel.classList.toggle('hidden', panel.dataset.cmsPanel !== panelId);
        });

        navButtons.forEach((btn) => {
            const isActive = btn.dataset.cmsPanel === panelId;
            btn.classList.toggle('bg-surface-container-low', isActive);
            btn.classList.toggle('text-primary-container', isActive);
            btn.classList.toggle('text-secondary', !isActive);
        });
    }

    loginForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        showDashboard();
        triggerToast('Succesvol ingelogd!');
    });

    logoutBtn?.addEventListener('click', showLogin);

    navButtons.forEach((btn) => {
        btn.addEventListener('click', () => switchPanel(btn.dataset.cmsPanel));
    });

    locationSelect?.addEventListener('change', () => {
        const coords = cmsLocationCoords[locationSelect.value];
        if (!coords || !latInput || !lngInput) return;

        latInput.value = coords.lat;
        lngInput.value = coords.lng;
    });

    cancelBtn?.addEventListener('click', () => postForm?.reset());

    postForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        triggerToast('Post opgeslagen als concept — Strapi volgt later.');
        postForm.reset();
    });
}

initCms();
