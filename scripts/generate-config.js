/**
 * Leest .env en schrijft js/contentful-config.js voor gebruik in de browser.
 * Run: node scripts/generate-config.js
 */
'use strict';

var fs = require('fs');
var path = require('path');

var root = path.join(__dirname, '..');
var envPath = path.join(root, '.env');
var outPath = path.join(root, 'js', 'contentful-config.js');

function parseEnv(content) {
    var env = {};
    content.split(/\r?\n/).forEach(function (line) {
        line = line.trim();
        if (!line || line.charAt(0) === '#') return;

        var idx = line.indexOf('=');
        if (idx === -1) return;

        var key = line.slice(0, idx).trim();
        var value = line.slice(idx + 1).trim();

        if (
            (value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') ||
            (value.charAt(0) === "'" && value.charAt(value.length - 1) === "'")
        ) {
            value = value.slice(1, -1);
        }

        env[key] = value;
    });
    return env;
}

if (!fs.existsSync(envPath)) {
    console.error('Fout: .env niet gevonden. Kopieer .env.example naar .env en vul je gegevens in.');
    process.exit(1);
}

var env = parseEnv(fs.readFileSync(envPath, 'utf8'));
var spaceId = env.CONTENTFUL_SPACE_ID;
var accessToken = env.CONTENTFUL_ACCESS_TOKEN;

if (!spaceId || !accessToken) {
    console.error('Fout: CONTENTFUL_SPACE_ID en CONTENTFUL_ACCESS_TOKEN moeten in .env staan.');
    process.exit(1);
}

var output =
    'window.CONTENTFUL_CONFIG = {\n' +
    "    spaceId: '" + spaceId + "',\n" +
    "    accessToken: '" + accessToken + "',\n" +
    '};\n';

fs.writeFileSync(outPath, output, 'utf8');
console.log('Geschreven: js/contentful-config.js');
