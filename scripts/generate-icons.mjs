/**
 * Renders the PWA icons, favicons and apple-touch-icon from resources/icons/logo.svg.
 *
 * Usage: node scripts/generate-icons.mjs
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const logo = await readFile(resolve(root, 'resources/icons/logo.svg'));
const publicDir = resolve(root, 'public');

await mkdir(resolve(publicDir, 'icons'), { recursive: true });

const render = (size) => sharp(logo, { density: 1024 }).resize(size, size).png().toBuffer();

/**
 * Maskable icons are cropped by the OS: draw the gradient edge to edge.
 * The snowflake already sits inside the 80% safe zone.
 */
const fullBleed = Buffer.from(logo.toString().replaceAll('rx="18"', 'rx="0"'));

const maskable = (size) => sharp(fullBleed, { density: 1024 }).resize(size, size).png().toBuffer();

/**
 * A .ico file can simply wrap PNG images.
 */
function ico(images) {
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(images.length, 4);

    let offset = 6 + images.length * 16;
    const entries = images.map(({ size, data }) => {
        const entry = Buffer.alloc(16);
        entry.writeUInt8(size >= 256 ? 0 : size, 0);
        entry.writeUInt8(size >= 256 ? 0 : size, 1);
        entry.writeUInt8(0, 2);
        entry.writeUInt8(0, 3);
        entry.writeUInt16LE(1, 4);
        entry.writeUInt16LE(32, 6);
        entry.writeUInt32LE(data.length, 8);
        entry.writeUInt32LE(offset, 12);
        offset += data.length;

        return entry;
    });

    return Buffer.concat([header, ...entries, ...images.map(({ data }) => data)]);
}

const outputs = {
    'icons/icon-192.png': await render(192),
    'icons/icon-512.png': await render(512),
    'icons/maskable-192.png': await maskable(192),
    'icons/maskable-512.png': await maskable(512),
    'apple-touch-icon.png': await maskable(180),
    'favicon.ico': ico([
        { size: 16, data: await render(16) },
        { size: 32, data: await render(32) },
        { size: 48, data: await render(48) },
    ]),
    'favicon.svg': logo,
};

for (const [path, data] of Object.entries(outputs)) {
    await writeFile(resolve(publicDir, path), data);
    console.log(`✓ public/${path}`);
}
