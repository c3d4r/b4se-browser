// ── Promise for CodeMirror module readiness ──────────
var _editorResolve;
window.editorReady = new Promise(function (r) { _editorResolve = r; });
var _editorView = null;

// ── KaTeX extension for marked ──────────────────────
var mathExtension = {
  extensions: [
    {
      name: "blockMath",
      level: "block",
      start: function (src) { var m = src.match(/\$\$/); return m ? m.index : undefined; },
      tokenizer: function (src) {
        var match = src.match(/^\$\$([\s\S]+?)\$\$/);
        if (match) {
          return { type: "blockMath", raw: match[0], text: match[1].trim() };
        }
      },
      renderer: function (token) {
        try {
          return '<div class="math-display">' + katex.renderToString(token.text, { displayMode: true, throwOnError: false }) + '</div>';
        } catch (e) {
          return '<div class="math-display math-error">' + token.text + '</div>';
        }
      }
    },
    {
      name: "inlineMath",
      level: "inline",
      start: function (src) { var m = src.match(/\$/); return m ? m.index : undefined; },
      tokenizer: function (src) {
        var match = src.match(/^\$([^\$\n]+?)\$/);
        if (match) {
          return { type: "inlineMath", raw: match[0], text: match[1].trim() };
        }
      },
      renderer: function (token) {
        try {
          return katex.renderToString(token.text, { displayMode: false, throwOnError: false });
        } catch (e) {
          return '<span class="math-error">' + token.text + '</span>';
        }
      }
    }
  ]
};
marked.use(mathExtension);

function countWords(text) {
  var t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

// ── Note previews (populated from loaded notes) ──────
var notePreviews = {};

function findPreviewKey(el) {
  var text = (el.textContent || '').trim().toLowerCase();
  var href = (el.getAttribute('href') || '').toLowerCase();
  if (notePreviews[text]) return text;
  for (var key in notePreviews) {
    if (text.indexOf(key) !== -1 || href.indexOf(key) !== -1) return key;
    var spaced = key.replace(/-/g, ' ');
    if (text.indexOf(spaced) !== -1) return key;
  }
  if (href.startsWith('http')) return '_external_';
  return null;
}

// ── Alpine component ─────────────────────────────────
document.addEventListener("alpine:init", function () {
  Alpine.data("markdownApp", function () {
    return {
      editing: false,
      livePreview: true,
      content: (function() {
        var el = document.getElementById('initial-data');
        if (el && el.dataset.content) {
          try { return JSON.parse(el.dataset.content); } catch(e) {}
        }
        return '# No Content';
      })(),
      editorLoading: false,
      lhsState: 'gone',
      lhsSection: 'files',
      rhsOpen: false,
      rhsTab: 'links',
      previewVisible: false,
      previewTitle: '',
      previewHtml: '',
      previewX: 0,
      previewY: 0,

      init() {
        this.initLinkPreview();
        this.initHtmx();
      },

      // Listen for HTMX note loads and update Alpine state
      initHtmx() {
        var self = this;
        document.body.addEventListener('htmx:afterSwap', function(e) {
          if (e.detail.target.id === 'note-display') {
            var dataEl = document.getElementById('note-data');
            if (dataEl && dataEl.dataset.content) {
              try {
                self.content = JSON.parse(dataEl.dataset.content);
              } catch(err) {}
            }
            self.editing = false;
            if (window.lucide) lucide.createIcons();
          }
        });
      },

      // Load new note content (called from HTMX partial scripts)
      loadNote(content) {
        if (this.editing && _editorView) {
          _editorView.destroy();
          _editorView = null;
        }
        this.content = content;
        this.editing = false;
      },

      get title() {
        var m = this.content.match(/^#\s+(.+)/m);
        return m ? m[1] : "Untitled";
      },

      get rendered() {
        return marked.parse(this.content);
      },

      get wordCount() {
        return countWords(this.content);
      },

      get modeLabel() {
        if (!this.editing) return "Reading";
        return this.livePreview ? "Live Preview" : "Source";
      },

      toggleLhs() {
        if (this.lhsState === 'gone') {
          this.lhsState = 'icons';
        } else {
          this.lhsState = 'gone';
        }
      },

      selectLhsSection(section) {
        if (this.lhsState === 'full' && this.lhsSection === section) {
          this.lhsState = 'icons';
        } else {
          this.lhsSection = section;
          this.lhsState = 'full';
        }
      },

      toggleRhs() {
        this.rhsOpen = !this.rhsOpen;
      },

      initLinkPreview() {
        var self = this;
        var container = document.body;
        var isTouchDevice = 'ontouchstart' in window;

        if (isTouchDevice) {
          container.addEventListener('click', function(e) {
            var link = e.target.closest('a, .lhs-item, .rhs-link-item');
            if (!link) {
              if (self.previewVisible) self.previewVisible = false;
              return;
            }
            var key = findPreviewKey(link);
            if (!key) return;
            e.preventDefault();
            e.stopPropagation();
            if (self.previewVisible) {
              self.previewVisible = false;
              return;
            }
            var rect = link.getBoundingClientRect();
            var x = rect.left + rect.width / 2;
            var y = rect.top;
            self._showPreview(link, x, y);
          }, true);
        } else {
          var hoverTimer = null;
          container.addEventListener('mouseover', function(e) {
            var link = e.target.closest('a, .lhs-item, .rhs-link-item');
            if (!link) return;
            clearTimeout(hoverTimer);
            hoverTimer = setTimeout(function() {
              var rect = link.getBoundingClientRect();
              var x = rect.left + rect.width / 2;
              var y = rect.top;
              self._showPreview(link, x, y);
            }, 400);
          });
          container.addEventListener('mouseout', function(e) {
            var link = e.target.closest('a, .lhs-item, .rhs-link-item');
            if (!link) return;
            clearTimeout(hoverTimer);
            self.previewVisible = false;
          });
        }
      },

      _showPreview(el, x, y) {
        var key = findPreviewKey(el);
        var preview = key && key !== '_external_' ? notePreviews[key] : null;
        if (!preview && !key) return;
        if (!preview) {
          var href = el.getAttribute('href') || el.textContent;
          this.previewTitle = el.textContent || href;
          this.previewHtml = '<p class="text-stone-400 text-xs italic">External link</p><p class="text-indigo-400 text-xs break-all">' + href + '</p>';
        } else {
          this.previewTitle = preview.title;
          this.previewHtml = marked.parse(preview.body);
        }
        var pad = 12;
        var cardW = 280;
        var cardH = 200;
        var vw = window.innerWidth;
        var left = Math.min(Math.max(pad, x - cardW / 2), vw - cardW - pad);
        var top = y - cardH - 12;
        if (top < pad) top = y + 32;
        this.previewX = left;
        this.previewY = top;
        this.previewVisible = true;
      },

      toggle() {
        if (this.editing && _editorView) {
          this.content = _editorView.state.doc.toString();
        }
        this.editing = !this.editing;
        if (this.editing) {
          this.mountEditor();
        }
      },

      toggleSource() {
        if (!this.editing) return;
        if (_editorView) {
          this.content = _editorView.state.doc.toString();
        }
        this.livePreview = !this.livePreview;
        this.mountEditor();
      },

      async mountEditor() {
        var parent = document.getElementById("editor");
        this.editorLoading = true;
        var createEditor = await window.editorReady;
        this.editorLoading = false;
        if (_editorView) { _editorView.destroy(); _editorView = null; }
        parent.innerHTML = "";
        var self = this;
        _editorView = createEditor(parent, this.content, function (newDoc) {
          self.content = newDoc;
        }, this.livePreview);
        _editorView.focus();
      }
    };
  });
});

// ── Lucide icons init ────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  lucide.createIcons();
  var _iconTimer = null;
  var _iconBusy = false;
  var observer = new MutationObserver(function() {
    if (_iconBusy) return;
    clearTimeout(_iconTimer);
    _iconTimer = setTimeout(function() {
      if (!document.querySelector('i[data-lucide]')) return;
      _iconBusy = true;
      lucide.createIcons();
      requestAnimationFrame(function() { _iconBusy = false; });
    }, 100);
  });
  observer.observe(document.body, { childList: true, subtree: true });
});
