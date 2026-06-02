/**
 * Berlin Travel Blog — kaart (Leaflet + Contentful locaties)
 */
(function () {
    'use strict';

    var mapEl = document.getElementById('map');
    if (!mapEl || typeof L === 'undefined') return;

    var CHECKBOX_CLASSES =
        'form-checkbox h-5 w-5 text-primary-container rounded border-outline-variant focus:ring-primary-container';
    var LABEL_CLASSES =
        'flex items-center gap-3 cursor-pointer group';
    var LABEL_TEXT_CLASSES =
        'font-body-md text-body-md text-on-surface group-hover:text-primary-container transition-colors';
    var DETAIL_BTN_CLASSES =
        'w-full text-left flex items-center gap-2 font-body-md text-body-md text-on-surface hover:text-primary-container transition-colors py-1';

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function hasCoordinates(locatie) {
        return locatie.latitude != null && locatie.longitude != null;
    }

    function registerLocatie(locatie) {
        mapLocations[locatie.id] = {
            title: locatie.naam,
            description: locatie.beschrijving,
            categorie: locatie.categorie,
            afbeelding: locatie.afbeelding,
        };
        cmsLocationCoords[locatie.id] = {
            lat: locatie.latitude,
            lng: locatie.longitude,
        };
    }

    function renderSidebar(locaties) {
        var filtersEl = document.getElementById('map-location-filters');
        var detailsEl = document.getElementById('map-location-details');
        if (!filtersEl || !detailsEl) return;

        filtersEl.innerHTML = '';
        detailsEl.innerHTML = '';

        if (!locaties.length) {
            filtersEl.innerHTML =
                '<p class="font-body-md text-body-md text-on-surface-variant">Nog geen locaties in Contentful.</p>';
            return;
        }

        locaties.forEach(function (locatie) {
            var label = document.createElement('label');
            label.className = LABEL_CLASSES;

            var checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true;
            checkbox.className = CHECKBOX_CLASSES;
            checkbox.dataset.location = locatie.id;

            var name = document.createElement('span');
            name.className = LABEL_TEXT_CLASSES;
            name.textContent = locatie.naam;

            label.appendChild(checkbox);
            label.appendChild(name);
            filtersEl.appendChild(label);

            var listItem = document.createElement('li');
            var button = document.createElement('button');
            button.type = 'button';
            button.className = DETAIL_BTN_CLASSES;
            button.dataset.location = locatie.id;
            button.innerHTML =
                '<span class="material-symbols-outlined text-primary-container text-xl">location_on</span> ' +
                escapeHtml(locatie.naam);
            listItem.appendChild(button);
            detailsEl.appendChild(listItem);
        });
    }

    var mapInstance = null;
    var mapMarkers = {};

    function focusLocatie(locatieId) {
        var marker = mapMarkers[locatieId];
        if (!marker || !mapInstance) return;

        mapInstance.setView(marker.getLatLng(), 15);
        marker.openPopup();
        openMapModal(locatieId);
    }

    function initMap(locaties) {
        var map = L.map('map').setView([52.52, 13.405], 12);
        mapInstance = map;

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        var markers = {};
        var boundsPoints = [];

        locaties.forEach(function (locatie) {
            registerLocatie(locatie);

            var marker = L.marker([locatie.latitude, locatie.longitude]).addTo(map);
            marker.bindPopup(
                '<b>' +
                    escapeHtml(locatie.naam) +
                    '</b><br>' +
                    escapeHtml(locatie.beschrijving) +
                    '<br><button type="button" class="map-popup-btn" data-popup-id="' +
                    locatie.id +
                    '">Meer info</button>'
            );
            markers[locatie.id] = marker;
            mapMarkers[locatie.id] = marker;
            boundsPoints.push([locatie.latitude, locatie.longitude]);
        });

        if (boundsPoints.length > 1) {
            map.fitBounds(boundsPoints, { padding: [40, 40] });
        } else if (boundsPoints.length === 1) {
            map.setView(boundsPoints[0], 14);
        }

        mapEl.addEventListener('click', function (e) {
            var btn = e.target.closest('.map-popup-btn');
            if (!btn) return;
            openMapModal(btn.getAttribute('data-popup-id'));
            map.closePopup();
        });

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

        document.querySelectorAll('[data-location][type="button"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var marker = markers[btn.dataset.location];
                if (!marker) return;
                map.setView(marker.getLatLng(), 15);
                marker.openPopup();
                openMapModal(btn.dataset.location);
            });
        });

        function refreshMapSize() {
            map.invalidateSize();
        }

        if (typeof ResizeObserver !== 'undefined') {
            new ResizeObserver(refreshMapSize).observe(mapEl);
        }
        window.addEventListener('resize', refreshMapSize);
        setTimeout(refreshMapSize, 0);
        setTimeout(refreshMapSize, 300);

        var placeholder = document.getElementById('map-placeholder');
        if (placeholder) placeholder.style.display = 'none';

        var locatieId = new URLSearchParams(window.location.search).get('locatie');
        if (locatieId) {
            setTimeout(function () {
                focusLocatie(locatieId);
            }, 400);
        }
    }

    function start() {
        if (typeof getLocaties !== 'function') {
            console.error('getLocaties() niet beschikbaar. Laad contentful.js in.');
            return;
        }

        getLocaties()
            .then(function (locaties) {
                var validLocaties = locaties.filter(hasCoordinates);
                renderSidebar(validLocaties);
                initMap(validLocaties);
            })
            .catch(function (err) {
                console.error('Locaties laden mislukt:', err);
                var filtersEl = document.getElementById('map-location-filters');
                if (filtersEl) {
                    filtersEl.innerHTML =
                        '<p class="font-body-md text-body-md text-on-surface-variant">Locaties konden niet geladen worden.</p>';
                }
            });
    }

    start();
})();
