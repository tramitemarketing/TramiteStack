// Genera icone PWA PNG nitide: logo a 3 barre arrotondate, centrato su navy,
// con anti-alias (supersampling) e padding (logo più piccolo → splash pulito).
import zlib from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'icons')
mkdirSync(outDir, { recursive: true })

const BG = [15, 76, 129] // #0F4C81
const BARS = [
  [255, 255, 255], // bianco
  [125, 178, 230], // #7DB2E6
  [242, 193, 78], // #F2C14E
]

// Geometria del logo su griglia 40×40 (come favicon): barre x6..34, h7, y 8/18/28, raggio 2.5
const BAR_X0 = 6, BAR_X1 = 34, BAR_H = 7, BAR_R = 2.5
const BAR_Y = [8, 18, 28]
const GRID = 40

function insideRoundRect(px, py, x0, y0, x1, y1, r) {
  if (px < x0 || px > x1 || py < y0 || py > y1) return false
  // regione angolo: fuori dall'arco?
  const ix0 = x0 + r, ix1 = x1 - r, iy0 = y0 + r, iy1 = y1 - r
  let cx = px, cy = py
  if (px < ix0) cx = ix0; else if (px > ix1) cx = ix1; else cx = px
  if (py < iy0) cy = iy0; else if (py > iy1) cy = iy1; else cy = py
  if (cx === px || cy === py) return true // dentro i bordi dritti
  const dx = px - cx, dy = py - cy
  return dx * dx + dy * dy <= r * r
}

// Colore del logo in un punto della griglia 40×40 (o null se sfondo)
function barColorAt(gx, gy) {
  for (let b = 0; b < 3; b++) {
    if (insideRoundRect(gx, gy, BAR_X0, BAR_Y[b], BAR_X1, BAR_Y[b] + BAR_H, BAR_R)) return BARS[b]
  }
  return null
}

function makePng(size, logoFraction) {
  const S = 4 // supersampling
  const box = size * logoFraction // lato del riquadro logo
  const offset = (size - box) / 2
  const scale = box / GRID

  const raw = Buffer.alloc((size * 3 + 1) * size)
  let p = 0
  for (let y = 0; y < size; y++) {
    raw[p++] = 0
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, bl = 0
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          const cx = x + (sx + 0.5) / S
          const cy = y + (sy + 0.5) / S
          const gx = (cx - offset) / scale
          const gy = (cy - offset) / scale
          const c = (gx >= 0 && gx <= GRID && gy >= 0 && gy <= GRID) ? barColorAt(gx, gy) : null
          const col = c || BG
          r += col[0]; g += col[1]; bl += col[2]
        }
      }
      const n = S * S
      raw[p++] = Math.round(r / n)
      raw[p++] = Math.round(g / n)
      raw[p++] = Math.round(bl / n)
    }
  }
  return encodePng(size, raw)
}

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
function encodePng(size, raw) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// "any": logo a ~62% del canvas. "maskable": logo più piccolo (~50%) per safe-zone/splash.
writeFileSync(join(outDir, 'icon-192.png'), makePng(192, 0.62)); console.log('icons/icon-192.png')
writeFileSync(join(outDir, 'icon-512.png'), makePng(512, 0.62)); console.log('icons/icon-512.png')
writeFileSync(join(outDir, 'icon-maskable-512.png'), makePng(512, 0.50)); console.log('icons/icon-maskable-512.png')
writeFileSync(join(root, 'public', 'apple-touch-icon.png'), makePng(180, 0.62)); console.log('apple-touch-icon.png')
