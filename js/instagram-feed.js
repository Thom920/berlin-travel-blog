(function () {
    'use strict';

    var FEED_LIMIT = 6;
    var TILE_CLASSES =
        'aspect-square bg-surface-container rounded-lg group relative overflow-hidden bg-cover bg-center';

    function createPlaceholderTile() {
        var tile = document.createElement('div');
        tile.className =
            'aspect-square bg-surface-container border-2 border-dashed border-outline-variant rounded-lg flex items-center justify-center';
        tile.innerHTML =
            '<span class="material-symbols-outlined text-outline text-3xl" aria-hidden="true">photo_camera</span>';
        return tile;
    }

    function createPostTile(post) {
        if (!post.permalink) {
            var fallback = document.createElement('div');
            fallback.className = TILE_CLASSES;
            if (post.afbeelding) {
                fallback.style.backgroundImage = 'url("' + post.afbeelding + '")';
            }
            fallback.setAttribute('aria-label', post.caption || 'Instagram post');
            return fallback;
        }

        var link = document.createElement('a');
        link.href = post.permalink;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = TILE_CLASSES + ' block';
        link.setAttribute('aria-label', post.caption || 'Bekijk op Instagram');

        if (post.afbeelding) {
            link.style.backgroundImage = 'url("' + post.afbeelding + '")';
        }

        var overlay = document.createElement('div');
        overlay.className =
            'absolute inset-0 flex items-end justify-center p-4 bg-black/0 group-hover:bg-black/60 transition-colors duration-200';

        if (post.caption) {
            var caption = document.createElement('p');
            caption.className =
                'font-body-sm text-body-sm text-white text-center line-clamp-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200';
            caption.textContent = post.caption;
            overlay.appendChild(caption);
        }

        link.appendChild(overlay);
        return link;
    }

    function renderFeed(posts) {
        var container = document.getElementById('instagram-feed');
        if (!container) return;

        container.innerHTML = '';
        container.setAttribute('aria-label', 'Instagram feed');

        var visiblePosts = posts.slice(0, FEED_LIMIT);

        visiblePosts.forEach(function (post) {
            container.appendChild(createPostTile(post));
        });

        for (var i = visiblePosts.length; i < FEED_LIMIT; i++) {
            container.appendChild(createPlaceholderTile());
        }
    }

    function initInstagramFeed() {
        var container = document.getElementById('instagram-feed');
        if (!container || typeof getInstagramPosts !== 'function') return;

        getInstagramPosts()
            .then(renderFeed)
            .catch(function (err) {
                console.error('Instagram feed laden mislukt:', err);
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initInstagramFeed);
    } else {
        initInstagramFeed();
    }
})();
