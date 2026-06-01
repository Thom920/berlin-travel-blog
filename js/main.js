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

function openMapModal() {
    document.getElementById('map-modal')?.classList.remove('hidden');
}

function closeMapModal() {
    document.getElementById('map-modal')?.classList.add('hidden');
}