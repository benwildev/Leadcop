#!/usr/bin/env node
// Build and package the LeadCop WordPress plugin
// Run with: node wordpress-plugin/build.sh

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  const table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table.push(c >>> 0);
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = (table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)) >>> 0;
  return ((crc ^ 0xFFFFFFFF) >>> 0);
}

function writeZip(entries) {
  const parts = [];
  const centrals = [];
  let localOffset = 0;
  for (const [name, content] of entries) {
    const nameBuf = Buffer.from(name, 'utf8');
    const raw = Buffer.isBuffer(content) ? content : Buffer.from(content);
    const comp = raw.length > 0 ? zlib.deflateRawSync(raw) : Buffer.alloc(0);
    const method = raw.length > 0 ? 8 : 0;
    const crc = crc32(raw);
    const lh = Buffer.alloc(30 + nameBuf.length);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0, 6);
    lh.writeUInt16LE(method, 8); lh.writeUInt16LE(0, 10); lh.writeUInt16LE(0, 12);
    lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(raw.length, 22);
    lh.writeUInt16LE(nameBuf.length, 26); lh.writeUInt16LE(0, 28); nameBuf.copy(lh, 30);
    const cd = Buffer.alloc(46 + nameBuf.length);
    cd.writeUInt32LE(0x02014b50, 0); cd.writeUInt16LE(20, 4); cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8); cd.writeUInt16LE(method, 10); cd.writeUInt16LE(0, 12); cd.writeUInt16LE(0, 14);
    cd.writeUInt32LE(crc, 16); cd.writeUInt32LE(comp.length, 20); cd.writeUInt32LE(raw.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28); cd.writeUInt16LE(0, 30); cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34); cd.writeUInt16LE(0, 36); cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(localOffset, 42); nameBuf.copy(cd, 46);
    parts.push(lh, comp);
    centrals.push(cd);
    localOffset += lh.length + comp.length;
  }
  const cdBuf = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(0, 4); eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(centrals.length, 8); eocd.writeUInt16LE(centrals.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12); eocd.writeUInt32LE(localOffset, 16); eocd.writeUInt16LE(0, 20);
  return Buffer.concat([...parts, cdBuf, eocd]);
}

const pluginDir = path.join(__dirname, 'leadcop-email-validator');
const outDir = path.join(__dirname, '..', 'artifacts', 'tempshield', 'public', 'downloads');
const outFile = path.join(outDir, 'leadcop-email-validator.zip');
const entries = [];

function walk(dir, rel) {
  for (const name of fs.readdirSync(dir).sort()) {
    if (name === '.DS_Store' || name === '.git') continue;
    const full = path.join(dir, name);
    const r = rel ? rel + '/' + name : name;
    if (fs.statSync(full).isDirectory()) walk(full, r);
    else entries.push(['leadcop-email-validator/' + r, fs.readFileSync(full)]);
  }
}
walk(pluginDir, '');

fs.mkdirSync(outDir, { recursive: true });
const zipBuf = writeZip(entries);
fs.writeFileSync(outFile, zipBuf);
console.log('Built:', outFile, zipBuf.length + ' bytes,', entries.length, 'entries');
