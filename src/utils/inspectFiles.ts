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
        el.setAttribute('data-vibe-id', stableId(el))
      })
    }

    function removeIds() {
      document.querySelectorAll('[data-vibe-id]').forEach(function(el) {
        el.removeAttribute('data-vibe-id')
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
      return { id: el.getAttribute('data-vibe-id') || '', tagName: tag, className: el.getAttribute('class') || '', children: kids }
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

    function getInfo(el) {
      var rect = el.getBoundingClientRect()
      return {
        id: el.getAttribute('data-vibe-id') || '',
        tagName: el.tagName.toLowerCase(),
        className: el.getAttribute('class') || '',
        inlineStyle: el.getAttribute('style') || '',
        forgeBlockId: getForgeBlockId(el),
        attributes: getAttributes(el),
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
      }
    }

    function onDocMove(e) {
      var el = e.target
      if (el && el !== document.body && el !== document.documentElement) {
        window.parent.postMessage(Object.assign({ type: 'FORGE_ELEMENT_HOVERED' }, getInfo(el)), '*')
      }
    }

    var selectedElRef = null
    var resizeObs = null
    var scrollRafId = null
    var resizeRafId = null

    function sendSelectedRect() {
      if (selectedElRef && document.body.contains(selectedElRef)) {
        window.parent.postMessage(Object.assign({ type: 'FORGE_ELEMENT_RESIZED' }, getInfo(selectedElRef)), '*')
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
          window.parent.postMessage(Object.assign({ type: 'FORGE_ELEMENT_RESIZED' }, getInfo(selectedElRef)), '*')
        }
      })
      resizeObs.observe(el)
    }

    function onDocClick(e) {
      e.preventDefault()
      e.stopPropagation()
      var el = e.target
      if (!el || el === document.body || el === document.documentElement) return
      var isReselect = el === selectedElRef
      watchSelected(el)
      window.parent.postMessage(Object.assign({ type: 'FORGE_ELEMENT_SELECTED', isReselect: isReselect }, getInfo(el)), '*')
    }

    var cursorStyle = null

    function activate() {
      activeRef.current = true
      assignIds()
      sendTree()
      if (selectedElRef && document.body.contains(selectedElRef)) {
        window.parent.postMessage(Object.assign({ type: 'FORGE_ELEMENT_RESIZED' }, getInfo(selectedElRef)), '*')
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
      document.removeEventListener('click', onDocClick, true)
      document.removeEventListener('mousemove', onDocMove, true)
      if (cursorStyle) { cursorStyle.remove(); cursorStyle = null }
      removeIds()
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
        var el = document.querySelector('[data-vibe-id="' + e.data.id + '"]')
        if (!el) return
        try { el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) } catch(x) {}
        window.parent.postMessage(Object.assign({ type: 'FORGE_ELEMENT_SELECTED', stayInLayers: !!e.data.stayInLayers }, getInfo(el)), '*')
      } else if (t === 'FORGE_HOVER_BY_ID') {
        var el2 = document.querySelector('[data-vibe-id="' + e.data.id + '"]')
        if (el2) window.parent.postMessage(Object.assign({ type: 'FORGE_ELEMENT_HOVERED' }, getInfo(el2)), '*')
      } else if (t === 'FORGE_REFRESH_TREE') {
        if (activeRef.current) { assignIds(); sendTree() }
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

createRoot(document.getElementById('root')).render(
  React.createElement(ForgeInspect, null, React.createElement(App, null))
)
`;
