(function () {
    'use strict';

    var BASE_URL = 'https://cdn.contentful.com/spaces';

    function getConfig() {
        var config = window.CONTENTFUL_CONFIG;
        if (!config || !config.spaceId || !config.accessToken) {
            throw new Error(
                'Contentful credentials ontbreken. Laad js/contentful-config.js in vóór contentful.js.'
            );
        }
        return config;
    }

    function buildUrl(contentType, params) {
        var config = getConfig();
        var query = new URLSearchParams({
            access_token: config.accessToken,
            content_type: contentType,
            include: '2',
        });

        if (params) {
            Object.keys(params).forEach(function (key) {
                query.set(key, params[key]);
            });
        }

        return BASE_URL + '/' + config.spaceId + '/entries?' + query.toString();
    }

    function fetchEntries(contentType, params) {
        return fetch(buildUrl(contentType, params)).then(function (response) {
            if (!response.ok) {
                return response.text().then(function (body) {
                    throw new Error(
                        'Contentful request mislukt (' + response.status + '): ' + body
                    );
                });
            }
            return response.json();
        });
    }

    function assetMap(includes) {
        var map = {};
        (includes && includes.Asset ? includes.Asset : []).forEach(function (asset) {
            map[asset.sys.id] = asset;
        });
        return map;
    }

    function assetUrl(assets, link) {
        if (!link || !link.sys || link.sys.type !== 'Link') return null;
        var asset = assets[link.sys.id];
        if (!asset || !asset.fields || !asset.fields.file) return null;
        var file = asset.fields.file;
        var url = file.url;
        return url ? (url.indexOf('//') === 0 ? 'https:' + url : url) : null;
    }

    function firstAssetUrl(assets, field) {
        if (Array.isArray(field)) {
            for (var i = 0; i < field.length; i++) {
                var url = assetUrl(assets, field[i]);
                if (url) return url;
            }
            return null;
        }
        return assetUrl(assets, field);
    }

    function assetUrls(assets, links) {
        if (!Array.isArray(links)) return [];
        return links
            .map(function (link) {
                return assetUrl(assets, link);
            })
            .filter(Boolean);
    }

    function parseBlogPost(entry, assets) {
        var fields = entry.fields || {};
        return {
            id: entry.sys.id,
            titel: fields.titel || '',
            datum: fields.datum || '',
            tekst: fields.tekst || null,
            fotos: assetUrls(assets, fields.fotos),
        };
    }

    function parseLocatie(entry, assets) {
        var fields = entry.fields || {};
        return {
            id: entry.sys.id,
            naam: fields.naam || '',
            beschrijving: fields.beschrijving || '',
            latitude: fields.latitude != null ? Number(fields.latitude) : null,
            longitude: fields.longitude != null ? Number(fields.longitude) : null,
            categorie: fields.categorie || '',
            afbeelding: firstAssetUrl(assets, fields.afbeelding),
        };
    }

    function parseInstagramPost(entry, assets) {
        var fields = entry.fields || {};
        return {
            id: entry.sys.id,
            caption: fields.caption || '',
            afbeelding: firstAssetUrl(assets, fields.afbeelding),
            permalink: fields.permalink || '',
        };
    }

    function getBlogPosts() {
        return fetchEntries('blogPost', { order: '-fields.datum' }).then(function (data) {
            var assets = assetMap(data.includes);
            return (data.items || []).map(function (entry) {
                return parseBlogPost(entry, assets);
            });
        });
    }

    function getLocaties() {
        return fetchEntries('locatie', { order: 'fields.naam' }).then(function (data) {
            var assets = assetMap(data.includes);
            return (data.items || []).map(function (entry) {
                return parseLocatie(entry, assets);
            });
        });
    }

    function getInstagramPosts() {
        return fetchEntries('instagramPost').then(function (data) {
            var assets = assetMap(data.includes);
            return (data.items || []).map(function (entry) {
                return parseInstagramPost(entry, assets);
            });
        });
    }

    window.getBlogPosts = getBlogPosts;
    window.getLocaties = getLocaties;
    window.getInstagramPosts = getInstagramPosts;
})();
