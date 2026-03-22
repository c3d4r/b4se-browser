// ── CodeMirror 6 imports (ESM from cdn) ──────────────
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, Decoration, ViewPlugin, WidgetType } from "https://esm.sh/@codemirror/view@6";
import { EditorState, StateField, StateEffect } from "https://esm.sh/@codemirror/state@6";
import { markdown, markdownLanguage } from "https://esm.sh/@codemirror/lang-markdown@6";
import { syntaxHighlighting, HighlightStyle, defaultHighlightStyle, bracketMatching, syntaxTree } from "https://esm.sh/@codemirror/language@6";
import { tags } from "https://esm.sh/@lezer/highlight@1";
import { history, historyKeymap, defaultKeymap } from "https://esm.sh/@codemirror/commands@6";
import { closeBrackets } from "https://esm.sh/@codemirror/autocomplete@6";
import { highlightSelectionMatches } from "https://esm.sh/@codemirror/search@6";

// ── Obsidian-like highlight style ────────────────────
const obsidianHighlight = HighlightStyle.define([
  { tag: tags.heading1, class: "cm-header cm-header-1" },
  { tag: tags.heading2, class: "cm-header cm-header-2" },
  { tag: tags.heading3, class: "cm-header cm-header-3" },
  { tag: [tags.heading4, tags.heading5, tags.heading6], class: "cm-header" },
  { tag: tags.strong, class: "cm-strong" },
  { tag: tags.emphasis, class: "cm-em" },
  { tag: tags.link, class: "cm-link" },
  { tag: tags.url, class: "cm-url" },
  { tag: tags.quote, class: "cm-quote" },
  { tag: tags.meta, class: "cm-meta" },
  { tag: [tags.monospace, tags.processingInstruction], class: "cm-monospace" },
  { tag: tags.contentSeparator, class: "cm-hr" },
]);

// ── HR widget for live preview ───────────────────────
class HrWidget extends WidgetType {
  toDOM() {
    const el = document.createElement("hr");
    el.className = "lp-hr";
    return el;
  }
}

// ── Checkbox widget for live preview ─────────────────
class CheckboxWidget extends WidgetType {
  constructor(checked) { super(); this.checked = checked; }
  toDOM() {
    const el = document.createElement("input");
    el.type = "checkbox";
    el.checked = this.checked;
    el.disabled = true;
    el.className = "lp-checkbox";
    return el;
  }
}

// ── Live Preview plugin (hides syntax on non-cursor lines) ──
const livePreviewPlugin = ViewPlugin.fromClass(class {
  constructor(view) {
    this.decorations = this.build(view);
  }

  update(update) {
    if (update.docChanged || update.selectionSet || update.viewportChanged)
      this.decorations = this.build(update.view);
  }

  build(view) {
    const decs = [];
    const doc = view.state.doc;
    const sel = view.state.selection.main;

    // Collect all lines touched by cursor/selection
    const activeLines = new Set();
    for (let pos = sel.from; pos <= sel.to;) {
      const line = doc.lineAt(pos);
      activeLines.add(line.number);
      pos = line.to + 1;
    }

    const { from: vpFrom, to: vpTo } = view.viewport;

    syntaxTree(view.state).iterate({
      from: vpFrom,
      to: vpTo,
      enter(node) {
        const line = doc.lineAt(node.from);
        if (activeLines.has(line.number)) return;

        switch (node.name) {
          // Hide # marks and trailing space
          case "HeaderMark": {
            const end = doc.sliceString(node.to, node.to + 1) === " "
              ? node.to + 1 : node.to;
            decs.push(Decoration.replace({}).range(node.from, end));
            break;
          }

          // Hide * / ** / _ / __ emphasis markers
          case "EmphasisMark": {
            decs.push(Decoration.replace({}).range(node.from, node.to));
            break;
          }

          // Hide backticks around inline code
          case "CodeMark": {
            // Only for inline code (1 char), not fenced blocks (3 chars)
            if (node.to - node.from <= 1) {
              decs.push(Decoration.replace({}).range(node.from, node.to));
            }
            break;
          }

          // Replace --- / *** with a visual HR
          case "HorizontalRule": {
            decs.push(Decoration.replace({ widget: new HrWidget() }).range(node.from, node.to));
            break;
          }

          // Hide > quote marks (CSS handles the left border)
          case "QuoteMark": {
            const end = doc.sliceString(node.to, node.to + 1) === " "
              ? node.to + 1 : node.to;
            decs.push(Decoration.replace({}).range(node.from, end));
            break;
          }

          // Replace [ ] and [x] task markers with checkboxes
          case "TaskMarker": {
            const text = doc.sliceString(node.from, node.to);
            const checked = text.includes("x") || text.includes("X");
            decs.push(Decoration.replace({ widget: new CheckboxWidget(checked) }).range(node.from, node.to));
            break;
          }

          // Hide list markers (-, *, +) — the bullet is added via CSS
          case "ListMark": {
            const end = doc.sliceString(node.to, node.to + 1) === " "
              ? node.to + 1 : node.to;
            // Only hide unordered list marks (single char like -, *, +)
            if (node.to - node.from === 1) {
              decs.push(Decoration.replace({ widget: new BulletWidget() }).range(node.from, end));
            }
            break;
          }
        }
      }
    });

    // Must be sorted by position
    decs.sort((a, b) => a.from - b.from);
    return Decoration.set(decs);
  }
}, {
  decorations: v => v.decorations
});

// ── Bullet widget ────────────────────────────────────
class BulletWidget extends WidgetType {
  toDOM() {
    const el = document.createElement("span");
    el.textContent = "\u2022 ";
    el.className = "lp-bullet";
    return el;
  }
}

// ── Line decorations for blockquotes in live preview ─
const blockquoteLinePlugin = ViewPlugin.fromClass(class {
  constructor(view) {
    this.decorations = this.build(view);
  }
  update(update) {
    if (update.docChanged || update.selectionSet || update.viewportChanged)
      this.decorations = this.build(update.view);
  }
  build(view) {
    const decs = [];
    const doc = view.state.doc;
    const sel = view.state.selection.main;
    const activeLines = new Set();
    for (let pos = sel.from; pos <= sel.to;) {
      const line = doc.lineAt(pos);
      activeLines.add(line.number);
      pos = line.to + 1;
    }
    const { from: vpFrom, to: vpTo } = view.viewport;

    syntaxTree(view.state).iterate({
      from: vpFrom,
      to: vpTo,
      enter(node) {
        if (node.name === "Blockquote") {
          // Add line decoration for each line in the blockquote
          for (let pos = node.from; pos <= node.to;) {
            const line = doc.lineAt(pos);
            if (!activeLines.has(line.number)) {
              decs.push(Decoration.line({ class: "lp-blockquote" }).range(line.from));
            }
            pos = line.to + 1;
          }
        }
      }
    });
    decs.sort((a, b) => a.from - b.from);
    // Deduplicate same-position line decorations
    const unique = [];
    for (const d of decs) {
      if (unique.length === 0 || unique[unique.length - 1].from !== d.from) unique.push(d);
    }
    return Decoration.set(unique);
  }
}, {
  decorations: v => v.decorations
});

// ── Toggle effect for live preview ───────────────────
const toggleLivePreview = StateEffect.define();
const livePreviewEnabled = StateField.define({
  create: () => true,
  update(val, tr) {
    for (const e of tr.effects) {
      if (e.is(toggleLivePreview)) val = e.value;
    }
    return val;
  }
});

// ── Shared extensions ────────────────────────────────
const baseExtensions = [
  highlightActiveLine(),
  highlightActiveLineGutter(),
  drawSelection(),
  bracketMatching(),
  closeBrackets(),
  history(),
  highlightSelectionMatches(),
  keymap.of([...defaultKeymap, ...historyKeymap]),
  markdown({ base: markdownLanguage }),
  syntaxHighlighting(obsidianHighlight),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  EditorView.lineWrapping,
  EditorView.theme({
    "&": { backgroundColor: "transparent" },
    ".cm-gutters": { backgroundColor: "transparent" },
  }),
];

// ── Factory function exposed to Alpine ───────────────
function createEditor(parent, content, onChange, livePreview) {
  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      onChange(update.state.doc.toString());
    }
  });

  const extensions = [...baseExtensions, updateListener];

  if (livePreview) {
    extensions.push(livePreviewPlugin, blockquoteLinePlugin);
  } else {
    extensions.push(lineNumbers());
  }

  return new EditorView({
    parent,
    state: EditorState.create({ doc: content, extensions }),
  });
}

// ── Signal to Alpine that the editor is ready ────────
_editorResolve(createEditor);
