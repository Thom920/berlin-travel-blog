(function () {
    'use strict';

    var DAGEN = [
        'Zondag',
        'Maandag',
        'Dinsdag',
        'Woensdag',
        'Donderdag',
        'Vrijdag',
        'Zaterdag',
    ];

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDag(datum) {
        if (!datum) return '';
        var date = new Date(datum);
        if (isNaN(date.getTime())) return '';
        return DAGEN[date.getDay()];
    }

    function renderFotos(fotos) {
        if (!fotos || !fotos.length) return '';

        var gridClass =
            fotos.length === 1
                ? 'mb-4'
                : 'grid grid-cols-2 gap-2 mb-4';

        var html = '<div class="' + gridClass + '">';
        fotos.forEach(function (url) {
            html +=
                '<img src="' +
                escapeHtml(url) +
                '" alt="" class="rounded-lg object-cover w-full ' +
                (fotos.length === 1 ? 'max-h-64' : 'aspect-square') +
                '" loading="lazy" />';
        });
        html += '</div>';
        return html;
    }

    function renderMapLink(locatie, isReversed) {
        if (!locatie || !locatie.id) return '';

        var wrapClass = isReversed ? 'flex justify-start md:justify-end' : '';
        var link =
            '<a class="text-primary-container font-label-md text-label-md flex items-center gap-1 hover:text-primary transition-colors" href="kaart.html?locatie=' +
            encodeURIComponent(locatie.id) +
            '">' +
            '<span class="material-symbols-outlined text-[18px]">map</span> Bekijk op kaart' +
            '</a>';

        return wrapClass ? '<div class="' + wrapClass + '">' + link + '</div>' : link;
    }

    function renderPost(post, index) {
        var isReversed = index % 2 === 1;
        var rowClass =
            'relative flex flex-col md:flex-row' +
            (isReversed ? '-reverse' : '') +
            ' items-center w-full mb-12';
        var dateSideClass =
            'w-full md:w-1/2 pl-12 ' +
            (isReversed ? 'md:pl-12 text-left' : 'md:pl-0 md:pr-12 text-left md:text-right') +
            ' mb-4 md:mb-0';
        var cardSideClass =
            'w-full md:w-1/2 pl-12 ' + (isReversed ? 'md:pl-0 md:pr-12' : 'md:pl-12');
        var cardClass =
            'bg-surface-container-lowest border border-surface-variant p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow' +
            (isReversed ? ' text-left md:text-right' : '');

        var dag = formatDag(post.datum);
        var subtitle = post.gekoppeldeLocatie ? post.gekoppeldeLocatie.naam : post.titel;

        return (
            '<div class="' +
            rowClass +
            '">' +
            '<div class="absolute left-5 md:left-1/2 w-4 h-4 rounded-full bg-primary-container -ml-2 border-4 border-surface-container-lowest z-10 shadow-sm"></div>' +
            '<div class="' +
            dateSideClass +
            '">' +
            '<h2 class="font-headline-lg text-headline-lg text-primary-container">' +
            escapeHtml(dag) +
            '</h2>' +
            '<p class="font-label-md text-label-md text-secondary mt-1">' +
            escapeHtml(subtitle) +
            '</p>' +
            '</div>' +
            '<div class="' +
            cardSideClass +
            '">' +
            '<div class="' +
            cardClass +
            '">' +
            '<h3 class="font-headline-md text-headline-md text-on-surface mb-2">' +
            escapeHtml(post.titel) +
            '</h3>' +
            renderFotos(post.fotos) +
            (post.tekst
                ? '<p class="font-body-md text-body-md text-on-surface-variant mb-4">' +
                  escapeHtml(post.tekst) +
                  '</p>'
                : '') +
            renderMapLink(post.gekoppeldeLocatie, isReversed) +
            '</div>' +
            '</div>' +
            '</div>'
        );
    }

    function renderTimeline(posts) {
        var container = document.getElementById('timeline-posts');
        if (!container) return;

        if (!posts.length) {
            container.innerHTML =
                '<p class="font-body-md text-body-md text-on-surface-variant text-center">Nog geen blogposts in Contentful.</p>';
            return;
        }

        container.innerHTML = posts.map(renderPost).join('');
    }

    function initTimeline() {
        if (typeof getBlogPosts !== 'function') {
            console.error('getBlogPosts() niet beschikbaar. Laad contentful.js in.');
            return;
        }

        getBlogPosts()
            .then(renderTimeline)
            .catch(function (err) {
                console.error('Tijdlijn laden mislukt:', err);
                var container = document.getElementById('timeline-posts');
                if (container) {
                    container.innerHTML =
                        '<p class="font-body-md text-body-md text-on-surface-variant text-center">Tijdlijn kon niet geladen worden.</p>';
                }
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTimeline);
    } else {
        initTimeline();
    }
})();
