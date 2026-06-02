/**
 * Berlin Travel Blog — kaart (Leaflet + Contentful locaties & Instagram)
 */
(function () {
    'use strict';

    var mapEl = document.getElementById('map');
    if (!mapEl || typeof L === 'undefined') return;

    var CHECKBOX_CLASSES =
        'form-checkbox h-5 w-5 text-primary-container rounded border-outline-variant focus:ring-primary-container';
    var LABEL_CLASSES = 'flex items-center gap-3 cursor-pointer group';
    var LABEL_TEXT_CLASSES =
        'font-body-md text-body-md text-on-surface group-hover:text-primary-container transition-colors';
    var DETAIL_BTN_CLASSES =
        'w-full text-left flex items-center gap-2 font-body-md text-body-md text-on-surface hover:text-primary-container transition-colors py-1';

    var mapInstance = null;
    var mapMarkers = {};
    var instagramLayer = null;
    var instagramMarkers = {};
    var locatieInstagramIndex = {};

    function buildLocatieInstagramIndex(posts) {
        var index = {};
        posts.forEach(function (post) {
            var locId = post.gekoppeldeLocatie.id;
            if (!index[locId]) index[locId] = [];
            index[locId].push(post.id);
        });
        return index;
    }

    function locatieIdsWithInstagram(posts) {
        var ids = {};
        posts.forEach(function (post) {
            ids[post.gekoppeldeLocatie.id] = true;
        });
        return ids;
    }

    function openInstagramAtLocatie(locatieId) {
        var postIds = locatieInstagramIndex[locatieId];
        if (!postIds || !postIds.length) return;
        var igMarker = instagramMarkers[postIds[0]];
        if (igMarker) igMarker.openPopup();
    }

    function setInstagramAtLocatieVisible(locatieId, visible) {
        var postIds = locatieInstagramIndex[locatieId];
        if (!postIds || !instagramLayer) return;
        postIds.forEach(function (postId) {
            var igMarker = instagramMarkers[postId];
            if (!igMarker) return;
            if (visible) {
                instagramLayer.addLayer(igMarker);
            } else {
                instagramLayer.removeLayer(igMarker);
            }
        });
    }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function truncate(text, max) {
        if (!text || text.length <= max) return text || '';
        return text.slice(0, max).trim() + '…';
    }

    function hasCoordinates(locatie) {
        return locatie && locatie.latitude != null && locatie.longitude != null;
    }

    function hasLocatieNaam(locatie) {
        return Boolean(locatie && locatie.naam && String(locatie.naam).trim());
    }

    function getSidebarLocaties(locaties) {
        return locaties.filter(hasLocatieNaam);
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

    function getMapReadyInstagramPosts(posts) {
        return posts.filter(function (post) {
            return post.afbeelding && hasCoordinates(post.gekoppeldeLocatie);
        });
    }

    function offsetLatLng(lat, lng, index, total) {
        if (total <= 1) return [lat, lng];
        var angle = (2 * Math.PI * index) / total;
        var offset = 0.00035;
        return [lat + offset * Math.sin(angle), lng + offset * Math.cos(angle)];
    }

    function groupInstagramByLocation(posts) {
        var groups = {};
        posts.forEach(function (post) {
            var loc = post.gekoppeldeLocatie;
            var key = loc.id;
            if (!groups[key]) groups[key] = [];
            groups[key].push(post);
        });
        return groups;
    }

    function renderSidebar(locaties) {
        var filtersEl = document.getElementById('map-location-filters');
        var detailsEl = document.getElementById('map-location-details');
        var sectionEl = document.getElementById('map-locaties-sidebar');
        if (!filtersEl || !detailsEl) return;

        var sidebarLocaties = getSidebarLocaties(locaties);

        filtersEl.innerHTML = '';
        detailsEl.innerHTML = '';

        if (!sidebarLocaties.length) {
            if (sectionEl) sectionEl.classList.add('hidden');
            return;
        }

        if (sectionEl) sectionEl.classList.remove('hidden');

        sidebarLocaties.forEach(function (locatie) {
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

    function renderInstagramSidebar(posts) {
        var filtersEl = document.getElementById('map-instagram-filters');
        var sectionEl = document.getElementById('map-instagram-section');
        if (!filtersEl || !sectionEl) return;

        filtersEl.innerHTML = '';

        if (!posts.length) {
            sectionEl.classList.add('hidden');
            return;
        }

        sectionEl.classList.remove('hidden');

        posts.forEach(function (post) {
            var label = document.createElement('label');
            label.className = LABEL_CLASSES + ' items-start';

            var checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true;
            checkbox.className = CHECKBOX_CLASSES + ' mt-2';
            checkbox.dataset.instagram = post.id;

            var thumb = document.createElement('img');
            thumb.src = post.afbeelding;
            thumb.alt = '';
            thumb.className = 'map-instagram-sidebar-thumb';

            var textWrap = document.createElement('div');
            textWrap.className = 'min-w-0 flex-1';

            var caption = document.createElement('span');
            caption.className =
                'font-body-sm text-body-sm text-on-surface block line-clamp-2 group-hover:text-primary-container transition-colors';
            caption.textContent = truncate(post.caption, 60) || 'Instagram post';

            textWrap.appendChild(caption);

            if (hasLocatieNaam(post.gekoppeldeLocatie)) {
                var locName = document.createElement('span');
                locName.className =
                    'font-label-sm text-label-sm text-on-surface-variant block mt-0.5';
                locName.textContent = post.gekoppeldeLocatie.naam;
                textWrap.appendChild(locName);
            }

            label.appendChild(checkbox);
            label.appendChild(thumb);
            label.appendChild(textWrap);
            filtersEl.appendChild(label);
        });
    }

    function createInstagramPopupHtml(post) {
        return (
            '<div class="map-instagram-popup">' +
            '<img class="map-instagram-popup__img" src="' +
            escapeHtml(post.afbeelding) +
            '" alt="" />' +
            '<p class="map-instagram-popup__caption">' +
            escapeHtml(truncate(post.caption, 120)) +
            '</p>' +
            (post.gekoppeldeLocatie && hasLocatieNaam(post.gekoppeldeLocatie)
                ? '<p class="font-label-sm text-label-sm text-on-surface-variant mb-2">' +
                  escapeHtml(post.gekoppeldeLocatie.naam) +
                  '</p>'
                : '') +
            '<a class="map-instagram-popup__link" href="' +
            escapeHtml(post.permalink) +
            '" target="_blank" rel="noopener noreferrer">Bekijk op Instagram</a>' +
            '</div>'
        );
    }

    function createInstagramIcon(post) {
        var html =
            '<div class="map-instagram-marker" title="' +
            escapeHtml(truncate(post.caption, 80) || 'Instagram') +
            '">' +
            '<img src="' +
            escapeHtml(post.afbeelding) +
            '" alt="" />' +
            '</div>';

        return L.divIcon({
            className: 'map-instagram-icon-wrap',
            html: html,
            iconSize: [52, 52],
            iconAnchor: [26, 26],
            popupAnchor: [0, -30],
        });
    }

    function addInstagramMarkers(map, posts) {
        instagramLayer = L.layerGroup().addTo(map);
        instagramMarkers = {};

        var groups = groupInstagramByLocation(posts);

        Object.keys(groups).forEach(function (locId) {
            var groupPosts = groups[locId];
            var loc = groupPosts[0].gekoppeldeLocatie;

            groupPosts.forEach(function (post, index) {
                var coords = offsetLatLng(loc.latitude, loc.longitude, index, groupPosts.length);

                var marker = L.marker(coords, {
                    icon: createInstagramIcon(post),
                    zIndexOffset: 1000,
                });

                marker.bindPopup(createInstagramPopupHtml(post), {
                    maxWidth: 280,
                    className: 'map-instagram-leaflet-popup',
                });

                marker.on('click', function () {
                    marker.openPopup();
                });

                instagramLayer.addLayer(marker);
                instagramMarkers[post.id] = marker;
            });
        });

        var toggle = document.getElementById('map-instagram-toggle');
        if (toggle) {
            toggle.addEventListener('change', function () {
                if (toggle.checked) {
                    map.addLayer(instagramLayer);
                } else {
                    map.removeLayer(instagramLayer);
                }
            });
        }

        document.querySelectorAll('input[data-instagram]').forEach(function (cb) {
            cb.addEventListener('change', function () {
                var marker = instagramMarkers[cb.dataset.instagram];
                if (!marker || !instagramLayer) return;
                if (cb.checked) {
                    instagramLayer.addLayer(marker);
                } else {
                    instagramLayer.removeLayer(marker);
                }
            });
        });
    }

    function focusLocatie(locatieId) {
        var marker = mapMarkers[locatieId];
        var coords = cmsLocationCoords[locatieId];
        if (!mapInstance || !coords) return;

        mapInstance.setView([coords.lat, coords.lng], 15);

        if (marker) {
            marker.openPopup();
        } else {
            openInstagramAtLocatie(locatieId);
        }

        openMapModal(locatieId);
    }

    function initMap(locaties, instagramPosts) {
        var map = L.map('map').setView([52.52, 13.405], 12);
        mapInstance = map;
        locatieInstagramIndex = buildLocatieInstagramIndex(instagramPosts);
        var hideLocatieMarker = locatieIdsWithInstagram(instagramPosts);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        var markers = {};
        var boundsPoints = [];

        locaties.forEach(function (locatie) {
            registerLocatie(locatie);
            boundsPoints.push([locatie.latitude, locatie.longitude]);

            if (hideLocatieMarker[locatie.id]) return;

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
        });

        if (instagramPosts.length) {
            addInstagramMarkers(map, instagramPosts);
        }

        if (boundsPoints.length > 1) {
            map.fitBounds(boundsPoints, { padding: [50, 50] });
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
                var locId = cb.dataset.location;
                var marker = markers[locId];

                if (marker) {
                    if (cb.checked) {
                        marker.addTo(map);
                    } else {
                        map.removeLayer(marker);
                    }
                }

                if (locatieInstagramIndex[locId]) {
                    setInstagramAtLocatieVisible(locId, cb.checked);
                }
            });
        });

        document.querySelectorAll('[data-location][type="button"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var locId = btn.dataset.location;
                var marker = markers[locId];
                var coords = cmsLocationCoords[locId];
                if (!coords) return;

                map.setView([coords.lat, coords.lng], 15);

                if (marker) {
                    marker.openPopup();
                } else {
                    openInstagramAtLocatie(locId);
                }

                openMapModal(locId);
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
        if (typeof getLocaties !== 'function' || typeof getInstagramPosts !== 'function') {
            console.error('Contentful-functies ontbreken. Laad contentful.js in.');
            return;
        }

        Promise.all([getLocaties(), getInstagramPosts()])
            .then(function (results) {
                var locaties = results[0].filter(hasCoordinates);
                var instagramPosts = getMapReadyInstagramPosts(results[1]);
                renderSidebar(locaties);
                renderInstagramSidebar(instagramPosts);
                initMap(locaties, instagramPosts);
            })
            .catch(function (err) {
                console.error('Kaart laden mislukt:', err);
                var filtersEl = document.getElementById('map-location-filters');
                if (filtersEl) {
                    filtersEl.innerHTML =
                        '<p class="font-body-md text-body-md text-on-surface-variant">Kaart kon niet geladen worden.</p>';
                }
            });
    }

    start();
})();
