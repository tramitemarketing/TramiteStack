// Genera icone PWA PNG (sfondo indigo + lettera "T" bianca) senza dipendenze.
import zlib from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'icons')
mkdirSync(outDir, { recursive: true })

const BG = [109, 40, 217] // violet-700 (brand)
const FG = [255, 255, 255]

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typeData), 0)
  return Buffer.concat([len, typeData, crc])
}

function makePng(size) {
  // Geometria lettera "T"
  const m = Math.round(size * 0.26) // margine
  const barH = Math.round(size * 0.16) // spessore tratto
  const topY0 = m
  const topY1 = m + barH
  const stemX0 = Math.round(size / 2 - barH / 2)
  const stemX1 = Math.round(size / 2 + barH / 2)
  const stemY1 = size - m

  // Righe raw: ogni riga preceduta dal byte filtro 0
  const raw = Buffer.alloc((size * 3 + 1) * size)
  let p = 0
  for (let y = 0; y < size; y++) {
    raw[p++] = 0
    for (let x = 0; x < size; x++) {
      const inTop = y >= topY0 && y < topY1 && x >= m && x < size - m
      const inStem = x >= stemX0 && x < stemX1 && y >= topY0 && y < stemY1
      const c = inTop || inStem ? FG : BG
      raw[p++] = c[0]
      raw[p++] = c[1]
      raw[p++] = c[2]
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type RGB
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
  return png
}

for (const size of [192, 512]) {
  writeFileSync(join(outDir, `icon-${size}.png`), makePng(size))
  console.log(`icons/icon-${size}.png`)
}
// apple-touch-icon (180) nella public root
writeFileSync(join(root, 'public', 'apple-touch-icon.png'), makePng(180))
console.log('apple-touch-icon.png')
