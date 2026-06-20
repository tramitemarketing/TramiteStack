// Genera icone PWA PNG: tre barre impilate (bianco/azzurro/oro) su navy. Nessuna dipendenza.
import zlib from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'icons')
mkdirSync(outDir, { recursive: true })

const BG = [15, 76, 129] // Stack Blue 800 #0F4C81
const BARS = [
  [255, 255, 255], // bianco
  [125, 178, 230], // azzurro #7DB2E6
  [242, 193, 78], // oro #F2C14E
]

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
  // Geometria su griglia 40×40 del logo, scalata a "size".
  const s = size / 40
  const barX0 = Math.round(6 * s)
  const barX1 = Math.round(34 * s)
  // tre barre: y 8–15, 18–25, 28–35
  const bands = [
    [Math.round(8 * s), Math.round(15 * s)],
    [Math.round(18 * s), Math.round(25 * s)],
    [Math.round(28 * s), Math.round(35 * s)],
  ]

  const raw = Buffer.alloc((size * 3 + 1) * size)
  let p = 0
  for (let y = 0; y < size; y++) {
    raw[p++] = 0
    for (let x = 0; x < size; x++) {
      let c = BG
      for (let b = 0; b < 3; b++) {
        if (y >= bands[b][0] && y < bands[b][1] && x >= barX0 && x < barX1) {
          c = BARS[b]
          break
        }
      }
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
