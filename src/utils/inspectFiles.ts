export const FORGE_INSPECT_SOURCE = `
import React, { useEffect, useRef } from 'react'

export function ForgeInspect({ children }) {
  const activeRef = useRef(false)

  useEffect(() => {
    function stableId(el) {
      var parts = []
      var cur = el
      while (cur && cur !== document.documentElement) {
        var parent = cur.parentElement
        if (!parent) break
        var idx = 0
        for (var i = 0; i < parent.children.length; i++) {
          if (parent.children[i] === cur) { idx = i; break }
        }
        parts.unshift(cur.tagName + idx)
        cur = parent
      }
      return parts.join('_')
    }

    function assignIds() {
      document.querySelectorAll('*').forEach(function(el) {
        el.setAttribute('data-forge-id', stableId(el))
      })
    }

    function removeIds() {
      document.querySelectorAll('[data-forge-id]').forEach(function(el) {
        el.removeAttribute('data-forge-id')
      })
    }

    function domNode(el, depth) {
      if (depth > 12) return null
      var tag = el.tagName.toLowerCase()
      if (['script', 'style', 'head', 'link', 'meta'].indexOf(tag) !== -1) return null
      var kids = []
      for (var i = 0; i < el.children.length; i++) {
        var n = domNode(el.children[i], depth + 1)
        if (n) kids.push(n)
      }
      return { id: el.getAttribute('data-forge-id') || '', tagName: tag, className: el.getAttribute('class') || '', children: kids }
    }

    function sendTree() {
      var root = document.getElementById('root')
      if (!root) return
      var tree = []
      for (var i = 0; i < root.children.length; i++) {
        var n = domNode(root.children[i], 0)
        if (n) tree.push(n)
      }
      window.parent.postMessage({ type: 'FORGE_DOM_TREE', tree: tree }, '*')
    }

    function getForgeBlockId(el) {
      var cur = el
      while (cur && cur !== document.documentElement) {
        var bid = cur.getAttribute('data-forge-block-id')
        if (bid) return bid
        cur = cur.parentElement
      }
      return ''
    }

    function getAttributes(el) {
      var names = ['href', 'src', 'alt', 'target', 'placeholder', 'type', 'name', 'rows']
      var attrs = {}
      for (var i = 0; i < names.length; i++) {
        var v = el.getAttribute(names[i])
        if (v !== null) attrs[names[i]] = v
      }
      return attrs
    }

    var TEXT_TAGS_SET = { h1: 1, h2: 1, h3: 1, h4: 1, h5: 1, h6: 1, p: 1, span: 1, a: 1, button: 1, label: 1, blockquote: 1, li: 1 }
    function getDirectText(el) {
      if (!TEXT_TAGS_SET[el.tagName.toLowerCase()]) return undefined
      for (var i = 0; i < el.childNodes.length; i++) {
        if (el.childNodes[i].nodeType === 1) return undefined
      }
      return (el.textContent || '').trim() || undefined
    }

    function getInfo(el) {
      var rect = el.getBoundingClientRect()
      return {
        id: el.getAttribute('data-forge-id') || '',
        tagName: el.tagName.toLowerCase(),
        className: el.getAttribute('class') || '',
        inlineStyle: el.getAttribute('style') || '',
        isBlockRoot: el.hasAttribute('data-forge-block-id'),
        forgeBlockId: getForgeBlockId(el),
        attributes: getAttributes(el),
        textContent: getDirectText(el),
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
      }
    }

    var selectedElRef = null
    var resizeObs = null
    var scrollRafId = null
    var resizeRafId = null
    var lastHoveredId = null

    // Overlay DOM elements — created in activate(), removed in deactivate()
    var hoverBox = null
    var selectedBox = null
    var selectedTagLabel = null
    var selectedDeleteBtn = null

    function updateBoxRect(box, rect) {
      box.style.top = rect.top + 'px'
      box.style.left = rect.left + 'px'
      box.style.width = rect.width + 'px'
      box.style.height = rect.height + 'px'
    }

    function sendSelectedRect() {
      if (selectedElRef && document.body.contains(selectedElRef)) {
        var info = getInfo(selectedElRef)
        if (selectedBox) updateBoxRect(selectedBox, info.rect)
        window.parent.postMessage(Object.assign({ type: 'FORGE_ELEMENT_RESIZED' }, info), '*')
      }
    }

    function onScroll() {
      if (scrollRafId) return
      scrollRafId = requestAnimationFrame(function() {
        scrollRafId = null
        sendSelectedRect()
      })
    }

    function onViewportResize() {
      if (resizeRafId) return
      // Hide stale hover immediately — element positions shift on viewport resize
      if (hoverBox) { hoverBox.style.display = 'none' }
      lastHoveredId = null
      resizeRafId = requestAnimationFrame(function() {
        resizeRafId = null
        sendSelectedRect()
      })
    }

    function watchSelected(el) {
      if (resizeObs) { resizeObs.disconnect(); resizeObs = null }
      selectedElRef = el
      if (!el || typeof ResizeObserver === 'undefined') return
      var skipFirst = true
      resizeObs = new ResizeObserver(function() {
        if (skipFirst) { skipFirst = false; return }
        if (selectedElRef && document.body.contains(selectedElRef)) {
          var info = getInfo(selectedElRef)
          if (selectedBox) updateBoxRect(selectedBox, info.rect)
          window.parent.postMessage(Object.assign({ type: 'FORGE_ELEMENT_RESIZED' }, info), '*')
        }
      })
      resizeObs.observe(el)
    }

    function onDocMove(e) {
      var el = e.target
      if (el && el !== document.body && el !== document.documentElement) {
        var id = el.getAttribute('data-forge-id') || ''
        if (id === lastHoveredId) return
        lastHoveredId = id
        if (el !== selectedElRef) {
          updateBoxRect(hoverBox, el.getBoundingClientRect())
          hoverBox.style.display = 'block'
        } else {
          hoverBox.style.display = 'none'
        }
        window.parent.postMessage(Object.assign({ type: 'FORGE_ELEMENT_HOVERED' }, getInfo(el)), '*')
      }
    }

    function onDocClick(e) {
      e.preventDefault()
      e.stopPropagation()
      var el = e.target
      if (!el || el === document.body || el === document.documentElement) return
      var isReselect = el === selectedElRef
      watchSelected(el)
      hoverBox.style.display = 'none'
      lastHoveredId = null
      var rect = el.getBoundingClientRect()
      updateBoxRect(selectedBox, rect)
      selectedTagLabel.textContent = el.tagName.toLowerCase()
      var bid = getForgeBlockId(el)
      selectedDeleteBtn.style.display = bid ? 'flex' : 'none'
      selectedBox.style.display = 'block'
      window.parent.postMessage(Object.assign({ type: 'FORGE_ELEMENT_SELECTED', isReselect: isReselect }, getInfo(el)), '*')
    }

    var cursorStyle = null

    function activate() {
      activeRef.current = true
      assignIds()
      sendTree()

      hoverBox = document.createElement('div')
      hoverBox.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;box-sizing:border-box;border:1px dashed rgba(56,189,248,0.7);background:rgba(56,189,248,0.05);display:none;'
      document.body.appendChild(hoverBox)

      selectedBox = document.createElement('div')
      selectedBox.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;box-sizing:border-box;border:1px solid #e07055;display:none;'
      var label = document.createElement('div')
      label.style.cssText = 'position:absolute;top:-20px;left:0;display:flex;align-items:center;gap:2px;pointer-events:auto;'
      selectedTagLabel = document.createElement('span')
      selectedTagLabel.style.cssText = 'background:#e07055;color:#fff;font:10px/1 sans-serif;padding:2px 6px;border-radius:2px;white-space:nowrap;'
      selectedDeleteBtn = document.createElement('button')
      selectedDeleteBtn.style.cssText = 'background:#ef4444;color:#fff;border:none;cursor:pointer;padding:2px 4px;border-radius:2px;display:none;align-items:center;'
      selectedDeleteBtn.innerHTML = '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>'
      selectedDeleteBtn.addEventListener('click', function(e) {
        e.stopPropagation(); e.preventDefault()
        var bid = selectedElRef ? getForgeBlockId(selectedElRef) : ''
        if (bid) window.parent.postMessage({ type: 'FORGE_REMOVE_BLOCK', forgeBlockId: bid }, '*')
      })
      label.appendChild(selectedTagLabel)
      label.appendChild(selectedDeleteBtn)
      selectedBox.appendChild(label)
      document.body.appendChild(selectedBox)

      if (selectedElRef && document.body.contains(selectedElRef)) {
        var info = getInfo(selectedElRef)
        updateBoxRect(selectedBox, info.rect)
        selectedTagLabel.textContent = selectedElRef.tagName.toLowerCase()
        var bid2 = getForgeBlockId(selectedElRef)
        selectedDeleteBtn.style.display = bid2 ? 'flex' : 'none'
        selectedBox.style.display = 'block'
        window.parent.postMessage(Object.assign({ type: 'FORGE_ELEMENT_RESIZED' }, info), '*')
      }

      if (!cursorStyle) {
        cursorStyle = document.createElement('style')
        cursorStyle.textContent = '* { cursor: crosshair !important; }'
        document.head.appendChild(cursorStyle)
      }
      window.addEventListener('scroll', onScroll, true)
      window.addEventListener('resize', onViewportResize)
      document.addEventListener('click', onDocClick, true)
      document.addEventListener('mousemove', onDocMove, true)
    }

    function deactivate() {
      activeRef.current = false
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onViewportResize)
      if (scrollRafId) { cancelAnimationFrame(scrollRafId); scrollRafId = null }
      if (resizeRafId) { cancelAnimationFrame(resizeRafId); resizeRafId = null }
      if (resizeObs) { resizeObs.disconnect(); resizeObs = null }
      selectedElRef = null
      lastHoveredId = null
      document.removeEventListener('click', onDocClick, true)
      document.removeEventListener('mousemove', onDocMove, true)
      if (cursorStyle) { cursorStyle.remove(); cursorStyle = null }
      removeIds()
      if (hoverBox) { hoverBox.remove(); hoverBox = null }
      if (selectedBox) { selectedBox.remove(); selectedBox = null }
      selectedTagLabel = null; selectedDeleteBtn = null
    }

    function onMessage(e) {
      if (!e.data || typeof e.data !== 'object') return
      var t = e.data.type
      if (!t || t.indexOf('FORGE_') !== 0) return
      if (t === 'FORGE_INSPECT_TOGGLE') {
        var on = !!e.data.enabled
        if (on === activeRef.current) return
        if (on) activate(); else deactivate()
      } else if (t === 'FORGE_SELECT_BY_ID') {
        var el = document.querySelector('[data-forge-id="' + e.data.id + '"]')
        if (!el) return
        try { el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) } catch(x) {}
        watchSelected(el)
        if (selectedBox) {
          var rect = el.getBoundingClientRect()
          updateBoxRect(selectedBox, rect)
          selectedTagLabel.textContent = el.tagName.toLowerCase()
          var bid3 = getForgeBlockId(el)
          selectedDeleteBtn.style.display = bid3 ? 'flex' : 'none'
          selectedBox.style.display = 'block'
          hoverBox.style.display = 'none'
          lastHoveredId = null
        }
        window.parent.postMessage(Object.assign({ type: 'FORGE_ELEMENT_SELECTED', stayInLayers: !!e.data.stayInLayers }, getInfo(el)), '*')
      } else if (t === 'FORGE_HOVER_BY_ID') {
        var el2 = document.querySelector('[data-forge-id="' + e.data.id + '"]')
        if (el2) {
          if (hoverBox && el2 !== selectedElRef) {
            updateBoxRect(hoverBox, el2.getBoundingClientRect())
            hoverBox.style.display = 'block'
            lastHoveredId = el2.getAttribute('data-forge-id') || ''
          }
          window.parent.postMessage(Object.assign({ type: 'FORGE_ELEMENT_HOVERED' }, getInfo(el2)), '*')
        }
      } else if (t === 'FORGE_REFRESH_TREE') {
        if (activeRef.current) { assignIds(); sendTree() }
      } else if (t === 'FORGE_SELECT_BLOCK_ROOT') {
        var bid = e.data.forgeBlockId
        if (!bid) return
        var blockEl = document.querySelector('[data-forge-block-id="' + bid + '"]')
        if (!blockEl) return
        try { blockEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) } catch(x) {}
        watchSelected(blockEl)
        if (selectedBox) {
          var brect = blockEl.getBoundingClientRect()
          updateBoxRect(selectedBox, brect)
          selectedTagLabel.textContent = blockEl.tagName.toLowerCase()
          selectedDeleteBtn.style.display = 'flex'
          selectedBox.style.display = 'block'
          if (hoverBox) hoverBox.style.display = 'none'
          lastHoveredId = null
        }
        window.parent.postMessage(Object.assign({ type: 'FORGE_ELEMENT_SELECTED' }, getInfo(blockEl)), '*')
      } else if (t === 'FORGE_DESELECT') {
        if (selectedBox) selectedBox.style.display = 'none'
        if (hoverBox) hoverBox.style.display = 'none'
        if (resizeObs) { resizeObs.disconnect(); resizeObs = null }
        selectedElRef = null
        lastHoveredId = null
      }
    }

    window.addEventListener('message', onMessage)
    window.parent.postMessage({ type: 'FORGE_READY' }, '*')

    return function() {
      window.removeEventListener('message', onMessage)
      if (activeRef.current) deactivate()
    }
  }, [])

  return React.createElement(React.Fragment, null, children)
}
`;

export const FORGE_ENTRY_SOURCE = `
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ForgeInspect } from './__forgeInspect'
import './assets/images.css'
import './__forge_global.css'

createRoot(document.getElementById('root')).render(
  React.createElement(ForgeInspect, null, React.createElement(App, null))
)
`;
