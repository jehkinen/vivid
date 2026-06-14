'use client'

import { useEffect, useRef } from 'react'
import { wrapTextToLines } from '@/components/login/canvasTextLayout'
import {
  BOTTOM_CENTER_BLOCKS,
  BOTTOM_LEFT_BLOCKS,
  BOTTOM_RIGHT_BLOCKS,
  DRIFT_GLYPHS,
  LEFT_MARGIN_BLOCKS,
  LOGIN_QUOTES,
  NARROW_ABOVE_BLOCKS,
  NARROW_BELOW_BLOCKS,
  RIGHT_MARGIN_BLOCKS,
  TUNNEL_PHRASES,
  type MarginBlock,
} from '@/components/login/loginQuotes'

const BG = '#0a0c14'
const MONO = '"Courier New", monospace'
const MAX_LETTERS = 2800
const SERPENT_SEGMENTS = 32
const SEG_SPACING = 10
const FORM_MAX_WIDTH = 400
const FORM_PAGE_PAD = 16
const FORM_TITLE_BLOCK = 72
const FORM_CARD_HEIGHT = 480
const FORM_PAD = 14
const VIVID_TITLE = 'VIVID'
const VIVID_FONT = 'bold 44px system-ui, sans-serif'
const VIVID_FONT_SIZE = 44
const VIVID_COLORS = ['#3eb8b5', '#5ec4bc', '#d4738f', '#9b8bd4', '#3eb8b5']
const VIVID_LETTER_SPACING = VIVID_FONT_SIZE * 0.22
const MAX_PARTICLES = 100
const MAX_EMBERS = 36
const VIVID_GLOW = '#ffb86a'
const VIVID_GLOW_REACH = 50
const VIVID_SPRING_MUL = 2.2
const VIVID_DAMP = 0.93
const VIVID_MAX_DISP = 14

const fireChars = '*✦✧⁕❋✺◌•∘˚⋆·'.split('')
const AMBIENT_QUOTE_PUSH = 0.75

type TextStyle = {
  fontSize: number
  lineHeight: number
  color: string
  alpha: number
}

const TEXT_STYLES = {
  heading: { fontSize: 34, lineHeight: 40, color: '#3eb8b5', alpha: 0.42 } satisfies TextStyle,
  tagline: { fontSize: 15, lineHeight: 22, color: '#8a9aa8', alpha: 0.58 } satisfies TextStyle,
  quoteLeft: { fontSize: 16, lineHeight: 24, color: '#d0dce4', alpha: 0.82 } satisfies TextStyle,
  quoteRight: { fontSize: 15, lineHeight: 23, color: '#ddd0c0', alpha: 0.8 } satisfies TextStyle,
  quoteSmall: { fontSize: 13, lineHeight: 20, color: '#b8c0c8', alpha: 0.68 } satisfies TextStyle,
  author: { fontSize: 11, lineHeight: 17, color: '#3eb8b5', alpha: 0.55 } satisfies TextStyle,
  fragment: { fontSize: 17, lineHeight: 24, color: '#d4a574', alpha: 0.62 } satisfies TextStyle,
  whisper: { fontSize: 12, lineHeight: 18, color: '#6a7580', alpha: 0.38 } satisfies TextStyle,
  list: { fontSize: 12, lineHeight: 17, color: '#c9a882', alpha: 0.52 } satisfies TextStyle,
} as const

const CONFIG = {
  springStrength: 0.032,
  damping: 0.91,
  pushForce: 7,
  serpentSpeed: 0.09,
  serpentScale: 0.95,
}

export default function PretextLoginBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const canvasEl = canvas
    const context = ctx

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let W = window.innerWidth
    let H = window.innerHeight
    let letterCount = 0
    let time = 0
    let lastTime = performance.now()
    let raf = 0
    let disposed = false

    const mouse = { x: W / 2, y: H / 2 }
    let fireAccum = 0
    let particleCount = 0
    let emberCount = 0

    let formLeft = 0
    let formRight = 0
    let formTop = 0
    let formBottom = 0
    let formCardTop = 0

    const lHomeX = new Float32Array(MAX_LETTERS)
    const lHomeY = new Float32Array(MAX_LETTERS)
    const lX = new Float32Array(MAX_LETTERS)
    const lY = new Float32Array(MAX_LETTERS)
    const lVx = new Float32Array(MAX_LETTERS)
    const lVy = new Float32Array(MAX_LETTERS)
    const lAngle = new Float32Array(MAX_LETTERS)
    const lAngVel = new Float32Array(MAX_LETTERS)
    const lCharW = new Float32Array(MAX_LETTERS)
    const lBaseAlpha = new Float32Array(MAX_LETTERS)
    const lFontSize = new Float32Array(MAX_LETTERS)
    const lChar: string[] = []
    const lFont: string[] = []
    const lColor: string[] = []
    const lIsTitle = new Uint8Array(MAX_LETTERS)
    const lBurnTimer = new Float32Array(MAX_LETTERS)

    const pX = new Float32Array(MAX_PARTICLES)
    const pY = new Float32Array(MAX_PARTICLES)
    const pVx = new Float32Array(MAX_PARTICLES)
    const pVy = new Float32Array(MAX_PARTICLES)
    const pLife = new Float32Array(MAX_PARTICLES)
    const pMaxLife = new Float32Array(MAX_PARTICLES)
    const pSize = new Float32Array(MAX_PARTICLES)
    const pChar: string[] = []

    const emX = new Float32Array(MAX_EMBERS)
    const emY = new Float32Array(MAX_EMBERS)
    const emVx = new Float32Array(MAX_EMBERS)
    const emVy = new Float32Array(MAX_EMBERS)
    const emLife = new Float32Array(MAX_EMBERS)
    const emSize = new Float32Array(MAX_EMBERS)
    const emChar: string[] = []

    const chainN = SERPENT_SEGMENTS
    const chX = new Float32Array(chainN)
    const chY = new Float32Array(chainN)
    const chPx = new Float32Array(chainN)
    const chPy = new Float32Array(chainN)
    const serpentChars = '◆◇◈▪▫▸▹▴✎✐┄┈··..'.split('')

    const TUNNEL_RINGS = 12
    const TUNNEL_DEPTH = 1200
    const tunnelZ = new Float32Array(TUNNEL_RINGS)
    const tunnelSide = new Uint8Array(TUNNEL_RINGS)
    const tunnelTextIdx = new Uint8Array(TUNNEL_RINGS)

    const RUNE_N = 10
    const runeX = new Float32Array(RUNE_N)
    const runeY = new Float32Array(RUNE_N)
    const runeSpd = new Float32Array(RUNE_N)
    const runePhase = new Float32Array(RUNE_N)
    const runeSz = new Float32Array(RUNE_N)
    const runeOp = new Float32Array(RUNE_N)
    const runeC: string[] = []

    function resize() {
      W = window.innerWidth
      H = window.innerHeight
      canvasEl.width = W * dpr
      canvasEl.height = H * dpr
      canvasEl.style.width = `${W}px`
      canvasEl.style.height = `${H}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      layoutAllText()
      buildTunnel()
      for (let i = 0; i < RUNE_N; i++) {
        runeX[i] = Math.random() * W
        runeY[i] = Math.random() * H
      }
      chX[0] = mouse.x
      chY[0] = mouse.y
      for (let i = 1; i < chainN; i++) {
        chX[i] = mouse.x - i * 8
        chY[i] = mouse.y
      }
    }

    function buildTunnel() {
      for (let i = 0; i < TUNNEL_RINGS; i++) {
        tunnelZ[i] = (i / TUNNEL_RINGS) * TUNNEL_DEPTH
        tunnelSide[i] = i % 4
        tunnelTextIdx[i] = i % TUNNEL_PHRASES.length
      }
    }

    function updateFormRect() {
      const formW = Math.min(FORM_MAX_WIDTH, W - FORM_PAGE_PAD * 2)
      const formH = FORM_TITLE_BLOCK + FORM_CARD_HEIGHT
      formLeft = (W - formW) / 2
      formRight = formLeft + formW
      formTop = (H - formH) / 2
      formBottom = formTop + formH
      formCardTop = formTop + FORM_TITLE_BLOCK
    }

    function overlapsForm(cx: number, cy: number) {
      return (
        cx >= formLeft - FORM_PAD &&
        cx <= formRight + FORM_PAD &&
        cy >= formCardTop - FORM_PAD &&
        cy <= formBottom + FORM_PAD
      )
    }

    function addLetter(
      cx: number,
      cy: number,
      char: string,
      charW: number,
      fontStr: string,
      fontSize: number,
      color: string,
      alpha: number,
      isTitle = false,
    ) {
      if (letterCount >= MAX_LETTERS) return
      const i = letterCount++
      lIsTitle[i] = isTitle ? 1 : 0
      lHomeX[i] = cx
      lHomeY[i] = cy
      lX[i] = cx
      lY[i] = cy
      lVx[i] = 0
      lVy[i] = 0
      lAngle[i] = 0
      lAngVel[i] = 0
      lCharW[i] = charW
      lBaseAlpha[i] = alpha
      lFontSize[i] = fontSize
      lChar[i] = char
      lFont[i] = fontStr
      lColor[i] = color
    }

    function layoutVividTitle() {
      context.font = VIVID_FONT
      let totalW = -VIVID_LETTER_SPACING
      for (const char of VIVID_TITLE) {
        totalW += context.measureText(char).width + VIVID_LETTER_SPACING
      }

      let xc = (W - totalW) / 2
      const cy = formTop + FORM_TITLE_BLOCK * 0.52

      for (let i = 0; i < VIVID_TITLE.length; i++) {
        const char = VIVID_TITLE[i]!
        const charW = context.measureText(char).width
        const cx = xc + charW / 2
        addLetter(cx, cy, char, charW, VIVID_FONT, VIVID_FONT_SIZE, VIVID_COLORS[i] ?? VIVID_COLORS[0], 1, true)
        xc += charW + VIVID_LETTER_SPACING
      }
    }

    function placeTextBlock(
      baseX: number,
      baseY: number,
      maxW: number,
      text: string,
      fontSize: number,
      lineHeight: number,
      color: string,
      alpha: number,
    ): number {
      const fontStr = `${fontSize}px ${MONO}`
      context.font = fontStr
      const lines = wrapTextToLines((line) => context.measureText(line).width, text, maxW)
      let y = baseY

      for (const line of lines) {
        let xc = baseX
        for (const char of line) {
          if (letterCount >= MAX_LETTERS) break
          const charW = context.measureText(char).width
          const cx = xc + charW / 2
          const cy = y + lineHeight / 2

          if (!overlapsForm(cx, cy)) {
            addLetter(cx, cy, char, charW, fontStr, fontSize, color, alpha)
          }
          xc += charW
        }
        y += lineHeight
      }

      return y - baseY
    }

    function layoutBlocks(
      blocks: MarginBlock[],
      baseX: number,
      startY: number,
      maxW: number,
      side: 'left' | 'right' | 'center',
      untilY: number,
    ) {
      let y = startY
      let quoteCount = 0

      for (const block of blocks) {
        if (y > untilY) break

        if (block.kind === 'heading') {
          y += placeTextBlock(baseX, y, maxW, block.text, TEXT_STYLES.heading.fontSize, TEXT_STYLES.heading.lineHeight, TEXT_STYLES.heading.color, TEXT_STYLES.heading.alpha) + 18
          continue
        }

        if (block.kind === 'tagline') {
          y += placeTextBlock(baseX, y, maxW, block.text, TEXT_STYLES.tagline.fontSize, TEXT_STYLES.tagline.lineHeight, TEXT_STYLES.tagline.color, TEXT_STYLES.tagline.alpha) + 22
          continue
        }

        if (block.kind === 'fragment') {
          y += placeTextBlock(baseX, y, maxW, block.text, TEXT_STYLES.fragment.fontSize, TEXT_STYLES.fragment.lineHeight, TEXT_STYLES.fragment.color, TEXT_STYLES.fragment.alpha) + 26
          continue
        }

        if (block.kind === 'whisper') {
          y += placeTextBlock(baseX, y, maxW, block.text, TEXT_STYLES.whisper.fontSize, TEXT_STYLES.whisper.lineHeight, TEXT_STYLES.whisper.color, TEXT_STYLES.whisper.alpha) + 24
          continue
        }

        if (block.kind === 'list') {
          for (const line of block.lines) {
            y += placeTextBlock(baseX, y, maxW, line, TEXT_STYLES.list.fontSize, TEXT_STYLES.list.lineHeight, TEXT_STYLES.list.color, TEXT_STYLES.list.alpha) + 6
          }
          y += 20
          continue
        }

        const quote = LOGIN_QUOTES[block.index]
        if (!quote) continue

        const quoteStyle =
          quoteCount % 3 === 2
            ? TEXT_STYLES.quoteSmall
            : side === 'right'
              ? TEXT_STYLES.quoteRight
              : TEXT_STYLES.quoteLeft

        y += placeTextBlock(
          baseX,
          y,
          maxW,
          `"${quote.text}"`,
          quoteStyle.fontSize,
          quoteStyle.lineHeight,
          quoteStyle.color,
          quoteStyle.alpha,
        ) + 8

        y += placeTextBlock(
          baseX,
          y,
          maxW,
          `— ${quote.author}`,
          TEXT_STYLES.author.fontSize,
          TEXT_STYLES.author.lineHeight,
          TEXT_STYLES.author.color,
          quoteCount % 2 === 0 ? TEXT_STYLES.author.alpha : TEXT_STYLES.author.alpha * 0.85,
        ) + 26

        quoteCount++
      }
    }

    function layoutAllText() {
      letterCount = 0
      lChar.length = 0
      lFont.length = 0
      lColor.length = 0

      updateFormRect()
      layoutVividTitle()

      const margin = Math.max(24, W * 0.035)
      const gutterGap = 28
      const leftMaxW = formLeft - margin - gutterGap
      const rightBaseX = formRight + gutterGap
      const rightMaxW = W - margin - rightBaseX
      const sideLayout = W >= 960 && leftMaxW >= 180 && rightMaxW >= 180
      const bottomY = formBottom + gutterGap
      const pageBottom = H - margin

      if (sideLayout) {
        layoutBlocks(LEFT_MARGIN_BLOCKS, margin, formTop, leftMaxW, 'left', formBottom - 16)
        layoutBlocks(RIGHT_MARGIN_BLOCKS, rightBaseX, formTop, rightMaxW, 'right', formBottom - 16)

        layoutBlocks(BOTTOM_LEFT_BLOCKS, margin, bottomY, leftMaxW, 'left', pageBottom)
        layoutBlocks(BOTTOM_RIGHT_BLOCKS, rightBaseX, bottomY, rightMaxW, 'right', pageBottom)

        const centerBandW = Math.min(520, W - margin * 2)
        const centerX = (W - centerBandW) / 2
        layoutBlocks(BOTTOM_CENTER_BLOCKS, centerX, bottomY, centerBandW, 'center', pageBottom)
        return
      }

      const bandMaxW = Math.min(480, W - margin * 2)
      const bandX = (W - bandMaxW) / 2

      layoutBlocks(NARROW_ABOVE_BLOCKS, bandX, margin, bandMaxW, 'left', formTop - gutterGap)
      layoutBlocks(NARROW_BELOW_BLOCKS, bandX, bottomY, bandMaxW, 'right', pageBottom)
    }

    function segScale(i: number) {
      if (i < 3) return (2.2 - i * 0.12) * CONFIG.serpentScale
      const t = i / chainN
      return (1.8 * (1 - t * t) + 0.15) * CONFIG.serpentScale
    }

    function updateSerpent() {
      chPx[0] = chX[0]
      chPy[0] = chY[0]
      chX[0] += (mouse.x - chX[0]) * CONFIG.serpentSpeed
      chY[0] += (mouse.y - chY[0]) * CONFIG.serpentSpeed

      for (let i = 1; i < chainN; i++) {
        chPx[i] = chX[i]
        chPy[i] = chY[i]
        const dx = chX[i - 1] - chX[i]
        const dy = chY[i - 1] - chY[i]
        const d = Math.sqrt(dx * dx + dy * dy) || 0.001
        const pull = (d - SEG_SPACING) * 0.35
        chX[i] += (dx / d) * pull
        chY[i] += (dy / d) * pull
      }
    }

    function titleSerpentDist(li: number, segs: number) {
      let minDist = Infinity
      for (let si = 0; si < segs; si++) {
        const dx = lHomeX[li] - chX[si]
        const dy = lHomeY[li] - chY[si]
        const d = Math.hypot(dx, dy)
        if (d < minDist) minDist = d
      }
      return minDist
    }

    function letterGlowStrength(li: number) {
      if (lIsTitle[li] !== 1) return 0
      let strength = 0

      const serpentNear = titleSerpentDist(li, Math.min(10, chainN))
      if (serpentNear < VIVID_GLOW_REACH) strength = Math.max(strength, 1 - serpentNear / VIVID_GLOW_REACH)

      if (lBurnTimer[li] > 0) {
        strength = Math.max(strength, Math.min(1, lBurnTimer[li] * 1.4))
      }

      return strength
    }

    function spawnEmber(bx: number, by: number) {
      if (emberCount >= MAX_EMBERS) return
      const i = emberCount++
      emX[i] = bx + (Math.random() - 0.5) * 16
      emY[i] = by + (Math.random() - 0.5) * 16
      emVx[i] = (Math.random() - 0.5) * 3
      emVy[i] = -1.5 - Math.random() * 2
      emLife[i] = 0.5 + Math.random() * 0.6
      emSize[i] = 8 + Math.random() * 8
      emChar[i] = fireChars[(Math.random() * fireChars.length) | 0]
    }

    function serpentHeadDir() {
      const hx = chX[0]
      const hy = chY[0]
      const ni = Math.min(3, chainN - 1)
      const fdx = hx - chX[ni]
      const fdy = hy - chY[ni]
      const len = Math.hypot(fdx, fdy) || 1
      return { hx, hy, dx: fdx / len, dy: fdy / len, angle: Math.atan2(fdy, fdx) }
    }

    function serpentNearTitle() {
      const { hx, hy } = serpentHeadDir()
      for (let i = 0; i < letterCount; i++) {
        if (lIsTitle[i] !== 1) continue
        if (Math.hypot(lX[i] - hx, lY[i] - hy) < 58) return true
      }
      return false
    }

    function igniteFromSerpent(li: number, si: number, d: number, minD: number) {
      const t = 1 - d / minD
      lBurnTimer[li] = Math.max(lBurnTimer[li], 0.32 + t * 0.65)
      if (Math.random() < 0.14 * t) spawnEmber(chX[si], chY[si])
    }

    function serpentTouchesLetter(li: number, x: number, y: number, cw: number, segs: number) {
      for (let si = 0; si < segs; si++) {
        const sc = segScale(si)
        const rad = (lIsTitle[li] === 1 ? 10 : 12) * sc * 0.45
        const dx = x - chX[si]
        const dy = y - chY[si]
        const dSq = dx * dx + dy * dy
        const minD = rad + cw * 0.35 + 4
        if (dSq < minD * minD && dSq > 0.01) {
          igniteFromSerpent(li, si, Math.sqrt(dSq), minD)
        }
      }
    }

    function emitSerpentFire(dt: number) {
      const { hx, hy, dx, dy, angle } = serpentHeadDir()
      const headSpeed = Math.hypot(chX[0] - chPx[0], chY[0] - chPy[0])
      const nearTitle = serpentNearTitle()
      if (!nearTitle && headSpeed < 0.35) return

      fireAccum += dt
      const interval = nearTitle ? 0.024 : 0.04
      while (fireAccum > interval) {
        fireAccum -= interval
        if (particleCount >= MAX_PARTICLES) break
        const i = particleCount++
        const spread = (Math.random() - 0.5) * 0.6
        const spd = nearTitle ? 3 + Math.random() * 5 : 2 + Math.random() * 3
        pX[i] = hx + dx * 12
        pY[i] = hy + dy * 12
        pVx[i] = Math.cos(angle + spread) * spd
        pVy[i] = Math.sin(angle + spread) * spd - Math.random() * 0.6
        pLife[i] = 1
        pMaxLife[i] = 0.24 + Math.random() * 0.3
        pSize[i] = nearTitle ? 5 + Math.random() * 10 : 4 + Math.random() * 6
        pChar[i] = fireChars[(Math.random() * fireChars.length) | 0]
      }
    }

    function updateParticles(dt: number) {
      for (let i = particleCount - 1; i >= 0; i--) {
        pX[i] += pVx[i]
        pY[i] += pVy[i]
        pVy[i] -= 0.22
        pVx[i] *= 0.97
        pLife[i] -= dt / pMaxLife[i]
        if (pLife[i] <= 0) {
          particleCount--
          pX[i] = pX[particleCount]
          pY[i] = pY[particleCount]
          pVx[i] = pVx[particleCount]
          pVy[i] = pVy[particleCount]
          pLife[i] = pLife[particleCount]
          pMaxLife[i] = pMaxLife[particleCount]
          pSize[i] = pSize[particleCount]
          pChar[i] = pChar[particleCount]
        }
      }

      for (let i = emberCount - 1; i >= 0; i--) {
        emX[i] += emVx[i]
        emY[i] += emVy[i]
        emVy[i] += 0.12
        emVx[i] *= 0.97
        emLife[i] -= dt
        if (emLife[i] <= 0) {
          emberCount--
          emX[i] = emX[emberCount]
          emY[i] = emY[emberCount]
          emVx[i] = emVx[emberCount]
          emVy[i] = emVy[emberCount]
          emLife[i] = emLife[emberCount]
          emSize[i] = emSize[emberCount]
          emChar[i] = emChar[emberCount]
        }
      }
    }

    function drawFireParticles() {
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.font = `12px ${MONO}`

      for (let i = 0; i < emberCount; i++) {
        context.globalAlpha = Math.min(1, emLife[i] * 2)
        context.fillStyle = '#ffaa44'
        context.font = `${emSize[i]}px ${MONO}`
        context.fillText(emChar[i], emX[i], emY[i])
      }

      for (let i = 0; i < particleCount; i++) {
        const t = pLife[i]
        context.globalAlpha = t * 0.85
        context.fillStyle = t > 0.5 ? '#ffe8a8' : '#ff8844'
        context.font = `${pSize[i]}px ${MONO}`
        context.fillText(pChar[i], pX[i], pY[i])
      }

      context.globalAlpha = 1
    }

    function applySerpentScatter(
      li: number,
      x: number,
      y: number,
      cw: number,
      vx: number,
      vy: number,
      av: number,
      pushScale: number,
      segs: number,
      rotScale: number,
      drag: number,
    ) {
      const push = CONFIG.pushForce
      for (let si = 0; si < segs; si++) {
        const sc = segScale(si)
        const isTitle = lIsTitle[li] === 1
        const rad = (isTitle ? 10 : 12) * sc * 0.45
        const dx = x - chX[si]
        const dy = y - chY[si]
        const dSq = dx * dx + dy * dy
        const minD = rad + cw * 0.35 + 4
        if (dSq >= minD * minD || dSq <= 0.01) continue
        const d = Math.sqrt(dSq)
        const f = push * pushScale * ((minD - d) / minD) * sc
        const nx = dx / d
        const ny = dy / d
        vx += nx * f + (chX[si] - chPx[si]) * drag
        vy += ny * f + (chY[si] - chPy[si]) * drag
        av += (nx * 0.25 - ny * 0.15) * f * rotScale
      }
      return { vx, vy, av }
    }

    function interactLetters() {
      const damp = CONFIG.damping
      const spring = CONFIG.springStrength
      const push = CONFIG.pushForce
      const quoteSegs = Math.min(Math.round(chainN * 0.45), chainN)
      const titleFireSegs = Math.min(chainN, Math.round(chainN * 0.65))

      for (let li = 0; li < letterCount; li++) {
        let vx = lVx[li]
        let vy = lVy[li]
        let av = lAngVel[li]
        const x = lX[li]
        const y = lY[li]
        const cw = lCharW[li]
        const isTitle = lIsTitle[li] === 1

        if (isTitle) {
          serpentTouchesLetter(li, x, y, cw, titleFireSegs)
        } else {
          ;({ vx, vy, av } = applySerpentScatter(
            li,
            x,
            y,
            cw,
            vx,
            vy,
            av,
            AMBIENT_QUOTE_PUSH,
            quoteSegs,
            0.1,
            0.35,
          ))

          const mdx = x - mouse.x
          const mdy = y - mouse.y
          const mDistSq = mdx * mdx + mdy * mdy
          if (mDistSq < 6400 && mDistSq > 1) {
            const md = Math.sqrt(mDistSq)
            const mf = push * 0.35 * (1 - md / 80)
            vx += (mdx / md) * mf
            vy += (mdy / md) * mf
          }
        }

        const letterSpring = isTitle ? spring * VIVID_SPRING_MUL : spring
        const letterDamp = isTitle ? VIVID_DAMP : damp

        const hdx = lHomeX[li] - x
        const hdy = lHomeY[li] - y
        const hd = Math.sqrt(hdx * hdx + hdy * hdy)
        if (hd > 0.5) {
          const sf = letterSpring * (1 + hd * 0.001)
          vx += hdx * sf
          vy += hdy * sf
          av -= lAngle[li] * (isTitle ? 0.08 : 0.04)
        } else {
          lAngle[li] *= isTitle ? 0.82 : 0.9
        }

        lVx[li] = vx * letterDamp
        lVy[li] = vy * letterDamp
        lAngVel[li] = av * (isTitle ? 0.85 : 0.9)
        lX[li] = x + lVx[li]
        lY[li] = y + lVy[li]
        lAngle[li] += lAngVel[li]

        if (isTitle) {
          const tdx = lX[li] - lHomeX[li]
          const tdy = lY[li] - lHomeY[li]
          const td = Math.hypot(tdx, tdy)
          if (td > VIVID_MAX_DISP) {
            lX[li] = lHomeX[li] + (tdx / td) * VIVID_MAX_DISP
            lY[li] = lHomeY[li] + (tdy / td) * VIVID_MAX_DISP
            lVx[li] *= 0.45
            lVy[li] *= 0.45
          }
        }
      }
    }

    function drawTunnel() {
      const cx = W * 0.5
      const cy = H * 0.5
      context.font = `13px ${MONO}`
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillStyle = '#3eb8b5'

      for (let i = 0; i < TUNNEL_RINGS; i++) {
        tunnelZ[i] -= 0.55
        if (tunnelZ[i] < 10) {
          tunnelZ[i] += TUNNEL_DEPTH
          tunnelSide[i] = (tunnelSide[i] + 1) % 4
          tunnelTextIdx[i] = (Math.random() * TUNNEL_PHRASES.length) | 0
        }
        const scale = 400 / (400 + tunnelZ[i])
        const alpha = Math.max(0, Math.min(0.055, 0.07 * scale - 0.008))
        if (alpha < 0.003) continue
        const spread = 340 * scale
        let x: number
        let y: number
        const s = tunnelSide[i]
        if (s === 0) {
          x = cx
          y = cy - spread
        } else if (s === 1) {
          x = cx + spread
          y = cy
        } else if (s === 2) {
          x = cx
          y = cy + spread
        } else {
          x = cx - spread
          y = cy
        }
        context.globalAlpha = alpha
        context.fillText(TUNNEL_PHRASES[tunnelTextIdx[i]], x, y)
      }
      context.globalAlpha = 1
    }

    function drawGlyphs() {
      context.fillStyle = '#3eb8b5'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      for (let i = 0; i < RUNE_N; i++) {
        runeY[i] -= runeSpd[i]
        if (runeY[i] < -30) {
          runeY[i] = H + 30
          runeX[i] = Math.random() * W
        }
        context.globalAlpha = runeOp[i] * (0.5 + Math.sin(time * 0.35 + runePhase[i]) * 0.5)
        context.font = `${runeSz[i]}px ${MONO}`
        context.fillText(runeC[i], runeX[i] + Math.sin(time * 0.6 + runePhase[i]) * 10, runeY[i])
      }
      context.globalAlpha = 1
    }

    function drawLetters() {
      let prevFont = ''
      for (let i = 0; i < letterCount; i++) {
        const font = lFont[i]
        if (font !== prevFont) {
          context.font = font
          prevFont = font
        }
        context.save()
        context.translate(lX[i], lY[i])
        if (lAngle[i] !== 0) context.rotate(lAngle[i])
        const breathe = 0.9 + Math.sin(time * 0.7 + lHomeX[i] * 0.012 + lFontSize[i] * 0.04) * 0.1
        const isTitle = lIsTitle[i] === 1
        const burning = isTitle && lBurnTimer[i] > 0
        let drawColor = lColor[i]
        let drawAlpha = lBaseAlpha[i] * breathe

        if (burning) {
          const h = Math.min(1, lBurnTimer[i])
          drawColor = `rgb(255,${80 + (h * 175) | 0},${(h * 60) | 0})`
          drawAlpha = Math.min(1, drawAlpha + 0.35)
        }

        const glow = isTitle ? letterGlowStrength(i) : 0
        if (glow > 0) {
          context.globalAlpha = glow * 0.32 * breathe
          context.fillStyle = burning ? '#ffcc88' : VIVID_GLOW
          context.textAlign = 'center'
          context.textBaseline = 'middle'
          context.fillText(lChar[i], 0, 0)
        }

        context.globalAlpha = drawAlpha
        context.fillStyle = drawColor
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.fillText(lChar[i], 0, 0)

        if (isTitle && burning && lBurnTimer[i] > 0.25) {
          context.globalAlpha = lBurnTimer[i] * 0.18
          context.fillStyle = '#ffaa00'
          context.fillText(lChar[i], 0, 0)
        }

        context.restore()
      }
    }

    function drawSerpent() {
      for (let i = chainN - 1; i >= 0; i--) {
        const sc = segScale(i)
        const ci = Math.min(i, serpentChars.length - 1)
        const size = 13 * sc
        const t = i / chainN
        const pulse = Math.sin(time * 2.5 + i * 0.28) * 0.1
        const r = (62 + pulse * 30) | 0
        const g = (184 + pulse * 20) | 0
        const b = (181 - t * 40) | 0
        const color = `rgba(${r},${g},${b},${0.55 - t * 0.35})`

        const angle =
          i === 0
            ? Math.atan2(mouse.y - chY[0], mouse.x - chX[0])
            : Math.atan2(chY[i - 1] - chY[i], chX[i - 1] - chX[i])

        if (i >= 6 && i <= 14 && i % 2 === 0) {
          const wp = Math.sin(time * 2.8 + i * 0.35) * 0.35
          const ws = size * (1.6 - Math.abs(i - 10) * 0.1)
          const wd = size * 1.2
          const w1 = angle + Math.PI / 2 + wp
          const w2 = angle - Math.PI / 2 - wp
          context.globalAlpha = 0.22
          context.font = `${ws}px ${MONO}`
          context.fillStyle = color
          context.textAlign = 'center'
          context.textBaseline = 'middle'
          context.fillText('≺', chX[i] + Math.cos(w1) * wd, chY[i] + Math.sin(w1) * wd)
          context.fillText('≻', chX[i] + Math.cos(w2) * wd, chY[i] + Math.sin(w2) * wd)
        }

        context.save()
        context.translate(chX[i], chY[i])
        context.rotate(angle)
        context.globalAlpha = 0.65 - t * 0.35
        context.font = `bold ${size}px ${MONO}`
        context.fillStyle = color
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.fillText(serpentChars[ci], 0, Math.sin(time * 4 + i * 0.3) * 1.2)
        context.restore()
      }

      const headAngle = Math.atan2(mouse.y - chY[0], mouse.x - chX[0])
      const ex = chX[0] + Math.cos(headAngle + 0.45) * 8
      const ey = chY[0] + Math.sin(headAngle + 0.45) * 8
      const fireHead = serpentNearTitle()
      context.globalAlpha = fireHead ? 0.22 : 0.12
      context.fillStyle = fireHead ? '#ff8844' : '#3eb8b5'
      context.beginPath()
      context.arc(ex, ey, fireHead ? 14 : 10, 0, Math.PI * 2)
      context.fill()
      context.globalAlpha = fireHead ? 0.9 : 0.7
      context.fillStyle = fireHead ? '#ffe8a0' : '#a8e8e4'
      context.font = `14px ${MONO}`
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(time % 6 > 5.6 ? '—' : '◎', ex, ey)
    }

    function frame(now: number) {
      if (disposed) return
      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now
      time += dt

      context.fillStyle = BG
      context.fillRect(0, 0, W, H)
      drawTunnel()
      drawGlyphs()
      updateSerpent()

      for (let li = 0; li < letterCount; li++) {
        if (lBurnTimer[li] > 0) {
          lBurnTimer[li] -= dt
          if (lBurnTimer[li] <= 0) lBurnTimer[li] = 0
        }
      }

      emitSerpentFire(dt)
      updateParticles(dt)
      interactLetters()
      drawLetters()
      drawFireParticles()
      drawSerpent()

      raf = requestAnimationFrame(frame)
    }

    for (let i = 0; i < RUNE_N; i++) {
      runeX[i] = Math.random() * W
      runeY[i] = Math.random() * H
      runeSpd[i] = 0.08 + Math.random() * 0.25
      runePhase[i] = Math.random() * Math.PI * 2
      runeSz[i] = 12 + Math.random() * 12
      runeOp[i] = 0.025 + Math.random() * 0.035
      runeC[i] = DRIFT_GLYPHS[(Math.random() * DRIFT_GLYPHS.length) | 0]
    }

    buildTunnel()
    resize()

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    const onTouch = (e: TouchEvent) => {
      if (e.touches[0]) {
        mouse.x = e.touches[0].clientX
        mouse.y = e.touches[0].clientY
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onTouch, { passive: true })
    window.addEventListener('resize', resize)
    document.fonts.ready.then(() => {
      if (!disposed) layoutAllText()
    })

    raf = requestAnimationFrame(frame)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onTouch)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full block pointer-events-none"
      style={{ background: BG }}
      aria-hidden
      suppressHydrationWarning
    />
  )
}
