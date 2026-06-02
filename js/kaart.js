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

    var MAP_CATEGORIES = [
        {
            id: 'cultuur',
            label: 'Cultuur & Geschiedenis',
            emoji: '🏛️',
            cssClass: 'map-category-marker--cultuur',
        },
        {
            id: 'kunst',
            label: 'Kunst & Creatief',
            emoji: '🎨',
            cssClass: 'map-category-marker--kunst',
        },
        {
            id: 'natuur',
            label: 'Natuur & Dieren',
            emoji: '🦌',
            cssClass: 'map-category-marker--natuur',
        },
        {
            id: 'educatie',
            label: 'Educatie',
            emoji: '📚',
            cssClass: 'map-category-marker--educatie',
        },
        {
            id: 'instagram',
            label: 'Instagram posts',
            emoji: '📷',
            isInstagram: true,
        },
    ];

    var CATEGORY_BY_LABEL = {};
    MAP_CATEGORIES.forEach(function (cat) {
        if (!cat.isInstagram) CATEGORY_BY_LABEL[cat.label.toLowerCase()] = cat;
    });

    var mapInstance = null;
    var mapMarkers = {};
    var locatieCategoryById = {};
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

    function resolveLocatieCategory(locatie) {
        var raw = (locatie.categorie || '').trim().toLowerCase();
        if (raw && CATEGORY_BY_LABEL[raw]) return CATEGORY_BY_LABEL[raw];
        return {
            id: 'overig',
            label: locatie.categorie || 'Overig',
            emoji: '📍',
            cssClass: '',
        };
    }

    function registerLocatie(locatie) {
        var category = resolveLocatieCategory(locatie);
        locatieCategoryById[locatie.id] = category.id;
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

    function isCategoryChecked(categoryId) {
        var cb = document.querySelector('input[data-category="' + categoryId + '"]');
        return !cb || cb.checked;
    }

    function renderCategoryFilters() {
        var filtersEl = document.getElementById('map-category-filters');
        if (!filtersEl) return;

        filtersEl.innerHTML = '';

        MAP_CATEGORIES.forEach(function (category) {
            var label = document.createElement('label');
            label.className = LABEL_CLASSES;

            var checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true;
            checkbox.className = CHECKBOX_CLASSES;
            checkbox.dataset.category = category.id;

            var emoji = document.createElement('span');
            emoji.className = 'map-category-filter-emoji';
            emoji.setAttribute('aria-hidden', 'true');
            emoji.textContent = category.emoji;

            var name = document.createElement('span');
            name.className = LABEL_TEXT_CLASSES;
            name.textContent = category.label;

            label.appendChild(checkbox);
            label.appendChild(emoji);
            label.appendChild(name);
            filtersEl.appendChild(label);
        });
    }

    function renderLocationDetails(locaties) {
        var detailsEl = document.getElementById('map-location-details');
        var sectionEl = document.getElementById('map-locaties-sidebar');
        if (!detailsEl) return;

        var sidebarLocaties = getSidebarLocaties(locaties);
        detailsEl.innerHTML = '';

        if (!sidebarLocaties.length) {
            if (sectionEl) sectionEl.classList.add('hidden');
            return;
        }

        if (sectionEl) sectionEl.classList.remove('hidden');

        sidebarLocaties.forEach(function (locatie) {
            var category = resolveLocatieCategory(locatie);
            var listItem = document.createElement('li');
            var button = document.createElement('button');
            button.type = 'button';
            button.className = DETAIL_BTN_CLASSES;
            button.dataset.location = locatie.id;
            button.innerHTML =
                '<span class="map-category-filter-emoji" aria-hidden="true">' +
                category.emoji +
                '</span> ' +
                escapeHtml(locatie.naam);
            listItem.appendChild(button);
            detailsEl.appendChild(listItem);
        });
    }

    function createCategoryIcon(category) {
        var html =
            '<div class="map-category-marker ' +
            (category.cssClass || '') +
            '" title="' +
            escapeHtml(category.label) +
            '">' +
            '<span aria-hidden="true">' +
            category.emoji +
            '</span>' +
            '</div>';

        return L.divIcon({
            className: 'map-category-icon-wrap',
            html: html,
            iconSize: [36, 36],
            iconAnchor: [18, 36],
            popupAnchor: [0, -36],
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

    function setLocatieMarkersVisible(categoryId, visible) {
        if (!mapInstance) return;
        Object.keys(mapMarkers).forEach(function (locId) {
            if (locatieCategoryById[locId] !== categoryId) return;
            var marker = mapMarkers[locId];
            if (!marker) return;
            if (visible) {
                marker.addTo(mapInstance);
            } else {
                mapInstance.removeLayer(marker);
            }
        });
    }

    function setInstagramLayerVisible(visible) {
        if (!mapInstance || !instagramLayer) return;
        if (visible) {
            mapInstance.addLayer(instagramLayer);
        } else {
            mapInstance.removeLayer(instagramLayer);
        }
    }

    function bindCategoryFilters() {
        document.querySelectorAll('input[data-category]').forEach(function (cb) {
            cb.addEventListener('change', function () {
                var categoryId = cb.dataset.category;
                var visible = cb.checked;
                if (categoryId === 'instagram') {
                    setInstagramLayerVisible(visible);
                } else {
                    setLocatieMarkersVisible(categoryId, visible);
                }
            });
        });
    }

    function addInstagramMarkers(map, posts) {
        instagramLayer = L.layerGroup();
        if (isCategoryChecked('instagram')) {
            instagramLayer.addTo(map);
        }
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
    }

    function focusLocatie(locatieId) {
        var marker = mapMarkers[locatieId];
        var coords = cmsLocationCoords[locatieId];
        if (!mapInstance || !coords) return;

        mapInstance.setView([coords.lat, coords.lng], 15);

        if (marker && mapInstance.hasLayer(marker)) {
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

        var boundsPoints = [];

        locaties.forEach(function (locatie) {
            registerLocatie(locatie);
            boundsPoints.push([locatie.latitude, locatie.longitude]);

            if (hideLocatieMarker[locatie.id]) return;

            var category = resolveLocatieCategory(locatie);
            var marker = L.marker([locatie.latitude, locatie.longitude], {
                icon: createCategoryIcon(category),
            });

            if (isCategoryChecked(category.id)) {
                marker.addTo(map);
            }

            marker.bindPopup(
                '<b>' +
                    escapeHtml(locatie.naam) +
                    '</b><br>' +
                    escapeHtml(locatie.beschrijving) +
                    '<br><button type="button" class="map-popup-btn" data-popup-id="' +
                    locatie.id +
                    '">Meer info</button>'
            );
            mapMarkers[locatie.id] = marker;
        });

        if (instagramPosts.length) {
            addInstagramMarkers(map, instagramPosts);
        }

        bindCategoryFilters();

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

        document.querySelectorAll('[data-location][type="button"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var locId = btn.dataset.location;
                var marker = mapMarkers[locId];
                var coords = cmsLocationCoords[locId];
                if (!coords) return;

                map.setView([coords.lat, coords.lng], 15);

                if (marker && map.hasLayer(marker)) {
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

        renderCategoryFilters();

        Promise.all([getLocaties(), getInstagramPosts()])
            .then(function (results) {
                var locaties = results[0].filter(hasCoordinates);
                var instagramPosts = getMapReadyInstagramPosts(results[1]);
                renderLocationDetails(locaties);
                initMap(locaties, instagramPosts);
            })
            .catch(function (err) {
                console.error('Kaart laden mislukt:', err);
                var filtersEl = document.getElementById('map-category-filters');
                if (filtersEl) {
                    filtersEl.innerHTML =
                        '<p class="font-body-md text-body-md text-on-surface-variant">Kaart kon niet geladen worden.</p>';
                }
            });
    }

    start();
})();
