/**
 * Berlin Travel Blog — kaart (Leaflet)
 * Quick start: https://leafletjs.com/examples/quick-start/
 */
(function () {
    'use strict';

    var mapEl = document.getElementById('map');
    if (!mapEl || typeof L === 'undefined') return;

    // 1. Kaart + center (altijd eerst, vóór fitBounds/flyTo)
    var map = L.map('map').setView([52.52, 13.405], 12);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // 2. Markers
    var markers = {};
    var boundsPoints = [];

    Object.keys(mapLocations).forEach(function (id) {
        var coords = cmsLocationCoords[id];
        var loc = mapLocations[id];
        if (!coords || !loc) return;

        var marker = L.marker([coords.lat, coords.lng]).addTo(map);
        marker.bindPopup(
            '<b>' + loc.title + '</b><br>' + loc.description +
            '<br><button type="button" class="map-popup-btn" data-popup-id="' + id + '">Meer info</button>'
        );
        markers[id] = marker;
        boundsPoints.push([coords.lat, coords.lng]);
    });

    if (boundsPoints.length > 1) {
        map.fitBounds(boundsPoints, { padding: [40, 40] });
    }

    // 3. Popup-knop → modal
    mapEl.addEventListener('click', function (e) {
        var btn = e.target.closest('.map-popup-btn');
        if (!btn) return;
        openMapModal(btn.getAttribute('data-popup-id'));
        map.closePopup();
    });

    // 4. Checkbox-filters
    document.querySelectorAll('input[type="checkbox"][data-location]').forEach(function (cb) {
        cb.addEventListener('change', function () {
            var marker = markers[cb.dataset.location];
            if (!marker) return;
            if (cb.checked) {
                marker.addTo(map);
            } else {
                map.removeLayer(marker);
            }
        });
    });

    // 5. Sidebar: zoom naar locatie
    document.querySelectorAll('[data-location][type="button"]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var marker = markers[btn.dataset.location];
            if (!marker) return;
            map.setView(marker.getLatLng(), 15);
            marker.openPopup();
            openMapModal(btn.dataset.location);
        });
    });

    // 6. Layout: herbereken na resize (flex/grid + Tailwind)
    function refreshMapSize() {
        map.invalidateSize();
    }

    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(refreshMapSize).observe(mapEl);
    }
    window.addEventListener('resize', refreshMapSize);
    setTimeout(refreshMapSize, 0);
    setTimeout(refreshMapSize, 300);

    // 7. Placeholder verbergen
    var placeholder = document.getElementById('map-placeholder');
    if (placeholder) placeholder.style.display = 'none';
})();
