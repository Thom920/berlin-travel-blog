document.getElementById('mobile-menu-btn')?.addEventListener('click', function () {
    document.getElementById('mobile-menu')?.classList.toggle('hidden');
});

function triggerToast() {
    const toast = document.getElementById('sync-toast');
    if (!toast) return;

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
