import { DICTIONARY, PATTERNS, SEPARATORS } from './dictionary'

// The interface is written in Tajik. For Russian/English this module rewrites rendered texts and a few
// attributes in the DOM (text nodes, placeholder, title, aria-label, alt) and keeps doing so as React updates
// the page. The original Tajik text of every node is remembered, so switching languages is lossless.

export const LANGUAGES = [
  ['tg', 'TG'],
  ['ru', 'РУ'],
  ['en', 'EN'],
]
const INDEX = { ru: 0, en: 1 }
const HAS_CYRILLIC = /[А-Яа-яЁёӮӯҲҳҶҷҚқҒғӢӣ]/
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt']
const TEXT_SKIP = 'script,style,textarea,[data-no-translate]'

function translateCore(core, i) {
  const hit = DICTIONARY[core]
  if (hit) return hit[i]
  for (const [re, render] of PATTERNS) {
    const m = core.match(re)
    if (m) return render(m, i)
  }
  for (const sep of SEPARATORS) {
    if (!core.includes(sep)) continue
    const parts = core.split(sep)
    const done = parts.map((part) => translateCore(part, i))
    if (done.some((x) => x != null)) return parts.map((part, k) => done[k] ?? part).join(sep)
  }
  if (core.endsWith(':')) {
    const head = translateCore(core.slice(0, -1), i)
    if (head != null) return `${head}:`
  }
  return null
}

export function translate(text, lang) {
  if (lang === 'tg' || !text || !HAS_CYRILLIC.test(text)) return text
  const core = text.trim()
  const out = translateCore(core, INDEX[lang])
  if (out == null) return text
  return text.slice(0, text.indexOf(core)) + out + text.slice(text.indexOf(core) + core.length)
}

let lang = 'tg'
const source = new WeakMap() // text node -> Tajik original
const written = new WeakMap() // text node -> what we last wrote
const attrState = new WeakMap() // element -> { attr: [original, written] }
let originalTitle = ''

function renderText(node) {
  const out = translate(source.get(node), lang)
  written.set(node, out)
  if (node.nodeValue !== out) node.nodeValue = out
}

function handleText(node, force) {
  const value = node.nodeValue
  if (written.get(node) === value) {
    if (force) renderText(node)
    return
  }
  if (!HAS_CYRILLIC.test(value) || !node.parentElement || node.parentElement.closest(TEXT_SKIP)) return
  source.set(node, value)
  renderText(node)
}

function handleAttr(el, attr, force) {
  if (el.closest('[data-no-translate]')) return
  const value = el.getAttribute(attr)
  const state = attrState.get(el) ?? {}
  const [original, last] = state[attr] ?? []
  if (value == null) return
  if (value === last && !force) return
  const src = value === last ? original : value
  if (!HAS_CYRILLIC.test(src)) return
  const out = translate(src, lang)
  state[attr] = [src, out]
  attrState.set(el, state)
  if (value !== out) el.setAttribute(attr, out)
}

function walk(root, force = false) {
  if (root.nodeType === Node.TEXT_NODE) return handleText(root, force)
  if (root.nodeType !== Node.ELEMENT_NODE) return
  const texts = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  while (texts.nextNode()) handleText(texts.currentNode, force)
  const selector = ATTRS.map((a) => `[${a}]`).join(',')
  for (const el of [root, ...root.querySelectorAll(selector)]) {
    for (const attr of ATTRS) if (el.hasAttribute?.(attr)) handleAttr(el, attr, force)
  }
}

export function setLanguage(next) {
  lang = next
  document.documentElement.lang = next
  document.title = translate(originalTitle, next)
  walk(document.body, true)
}

export function startTranslator(initial) {
  originalTitle = document.title
  new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'characterData') handleText(r.target)
      else if (r.type === 'attributes') handleAttr(r.target, r.attributeName)
      else r.addedNodes.forEach((n) => walk(n))
    }
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS })
  setLanguage(initial)
}
