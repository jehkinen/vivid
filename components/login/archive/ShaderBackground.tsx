'use client'

import { useEffect, useRef } from 'react'

const BG = '#0a0c14'

const VS_ES300 = `#version 300 es
in vec2 a_xy;
out vec2 v_uv;
void main() {
  v_uv = a_xy * 0.5 + 0.5;
  gl_Position = vec4(a_xy, 0.0, 1.0);
}
`

const FS_ES300 = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform float u_time;
const float density = 200.0;
const vec3 base = vec3(0.055, 0.06, 0.10);
const vec3 teal = vec3(0.20, 0.58, 0.65);
const vec3 rose = vec3(0.68, 0.32, 0.48);
const vec3 violet = vec3(0.45, 0.38, 0.68);
const vec3 highlight = vec3(0.42, 0.65, 0.72);
const float gap = 0.12;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec2 cell = floor(v_uv * density);
  vec2 l = fract(v_uv * density);
  float edge = step(gap, l.x) * step(l.x, 1.0 - gap) * step(gap, l.y) * step(l.y, 1.0 - gap);
  float t = u_time * 0.55;
  float L1 = sin(cell.x * 0.022 + t * 0.31) * sin(cell.y * 0.018 - t * 0.27);
  float L2 = sin(cell.x * 0.055 + t * 0.53) * sin(cell.y * 0.048 + t * 0.41) * 0.65;
  float L3 = sin((cell.x + cell.y) * 0.038 - t * 0.37) * 0.45;
  float L4 = sin(cell.x * 0.09 - cell.y * 0.065 + t * 0.61) * 0.28;
  float raw = (L1 + L2 + L3 + L4 + 2.4) * 0.2;
  float a = smoothstep(0.2, 0.7, raw);
  float h = hash(cell);
  float phase = fract(h + t * 0.05);
  vec3 col = mix(rose, teal, smoothstep(0.0, 0.5, phase));
  col = mix(col, violet, smoothstep(0.35, 0.85, phase));
  col = col * (0.90 + 0.10 * sin(t * 0.25 + h * 6.28));
  float hi = smoothstep(0.65, 0.95, a) * edge;
  vec3 fin = mix(base, col, a * edge);
  fin = mix(fin, highlight, hi);
  outColor = vec4(fin, 1.0);
}
`

const VS_ES100 = `attribute vec2 a_xy;
varying vec2 v_uv;
void main() {
  v_uv = a_xy * 0.5 + 0.5;
  gl_Position = vec4(a_xy, 0.0, 1.0);
}
`

const FS_ES100 = `precision highp float;
varying vec2 v_uv;
uniform float u_time;
const float density = 200.0;
const vec3 base = vec3(0.055, 0.06, 0.10);
const vec3 teal = vec3(0.20, 0.58, 0.65);
const vec3 rose = vec3(0.68, 0.32, 0.48);
const vec3 violet = vec3(0.45, 0.38, 0.68);
const vec3 highlight = vec3(0.42, 0.65, 0.72);
const float gap = 0.12;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec2 cell = floor(v_uv * density);
  vec2 l = fract(v_uv * density);
  float edge = step(gap, l.x) * step(l.x, 1.0 - gap) * step(gap, l.y) * step(l.y, 1.0 - gap);
  float t = u_time * 0.55;
  float L1 = sin(cell.x * 0.022 + t * 0.31) * sin(cell.y * 0.018 - t * 0.27);
  float L2 = sin(cell.x * 0.055 + t * 0.53) * sin(cell.y * 0.048 + t * 0.41) * 0.65;
  float L3 = sin((cell.x + cell.y) * 0.038 - t * 0.37) * 0.45;
  float L4 = sin(cell.x * 0.09 - cell.y * 0.065 + t * 0.61) * 0.28;
  float raw = (L1 + L2 + L3 + L4 + 2.4) * 0.2;
  float a = smoothstep(0.2, 0.7, raw);
  float h = hash(cell);
  float phase = fract(h + t * 0.05);
  vec3 col = mix(rose, teal, smoothstep(0.0, 0.5, phase));
  col = mix(col, violet, smoothstep(0.35, 0.85, phase));
  col = col * (0.90 + 0.10 * sin(t * 0.25 + h * 6.28));
  float hi = smoothstep(0.65, 0.95, a) * edge;
  vec3 fin = mix(base, col, a * edge);
  fin = mix(fin, highlight, hi);
  gl_FragColor = vec4(fin, 1.0);
}
`

export default function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext | null
    if (!gl) return

    const isWebGL2 = 'drawArraysInstanced' in gl
    const VS = isWebGL2 ? VS_ES300 : VS_ES100
    const FS = isWebGL2 ? FS_ES300 : FS_ES100

    const compile = (type: number, src: string): WebGLShader | null => {
      const s = gl.createShader(type)
      if (!s) return null
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s)
        return null
      }
      return s
    }

    const vs = compile(gl.VERTEX_SHADER, VS)
    const fs = compile(gl.FRAGMENT_SHADER, FS)
    if (!vs || !fs) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return

    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1])
    const vbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW)

    const locXY = gl.getAttribLocation(program, 'a_xy')
    const locTime = gl.getUniformLocation(program, 'u_time')

    let raf = 0
    const start = performance.now()

    function resize() {
      if (!canvas || !gl) return
      const dpr = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio : 1)
      const w = Math.floor((window.innerWidth || 800) * dpr)
      const h = Math.floor((window.innerHeight || 600) * dpr)
      canvas.width = w
      canvas.height = h
      canvas.style.width = '100vw'
      canvas.style.height = '100vh'
      gl.viewport(0, 0, w, h)
    }

    function draw() {
      if (!gl || !canvas) return
      gl.useProgram(program)
      gl.uniform1f(locTime, (performance.now() - start) * 0.001)
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
      gl.enableVertexAttribArray(locXY)
      gl.vertexAttribPointer(locXY, 2, gl.FLOAT, false, 0, 0)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      raf = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(raf)
      gl?.deleteProgram(program)
      gl?.deleteShader(vs)
      gl?.deleteShader(fs)
      gl?.deleteBuffer(vbo)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full block"
      style={{ background: BG }}
      aria-hidden
      suppressHydrationWarning
    />
  )
}
