// CodeMirror 5 editor wrapper. CodeMirror is loaded globally as window.CodeMirror.

function cmModeForLang(lang) {
  switch (lang) {
    case "python":
      return "python";
    case "java":
      return { name: "text/x-java" };
    case "cpp":
      return { name: "text/x-c++src" };
    case "c":
    default:
      return { name: "text/x-csrc" };
  }
}

export function createEditor(parent, { initialDoc = "", language = "c", onChange, wrap = false, fontSize = 15 } = {}) {
  if (!window.CodeMirror) {
    const msg = document.createElement("div");
    msg.style.cssText = "padding:20px;color:#f38ba8;font-family:var(--mono);";
    msg.textContent = "Editor failed to load. Check your connection and reload once to cache the editor for offline use.";
    parent.appendChild(msg);
    throw new Error("CodeMirror not loaded");
  }

  parent.textContent = "";

  const cm = window.CodeMirror(parent, {
    value: initialDoc,
    mode: cmModeForLang(language),
    theme: "dracula",
    lineNumbers: true,
    indentUnit: 4,
    tabSize: 4,
    smartIndent: true,
    autoCloseBrackets: true, // beginner-friendly: { → }, ( → ), " → "
    matchBrackets: true,
    lineWrapping: wrap,
    viewportMargin: Infinity,
    inputStyle: "contenteditable", // better on mobile
    spellcheck: false,
    autocorrect: false,
    autocapitalize: false,
  });

  // Track an "error line" that we can highlight when JSCPP reports a problem.
  let errorLineHandle = null;

  function clearErrorLine() {
    if (errorLineHandle != null) {
      cm.removeLineClass(errorLineHandle, "background", "error-line");
      cm.removeLineClass(errorLineHandle, "gutter", "error-gutter");
      errorLineHandle = null;
    }
  }

  function highlightErrorLine(lineNumber1Based) {
    clearErrorLine();
    const idx = Math.max(0, (lineNumber1Based || 1) - 1);
    if (idx >= cm.lineCount()) return;
    errorLineHandle = cm.addLineClass(idx, "background", "error-line");
    cm.addLineClass(idx, "gutter", "error-gutter");
    cm.scrollIntoView({ line: idx, ch: 0 }, 80);
  }

  function insertText(text, cursorOffset) {
    const cursor = cm.getCursor();
    cm.replaceSelection(text);
    if (typeof cursorOffset === "number" && cursorOffset !== 0) {
      // Move the cursor by the offset (used so {} inserts and lands cursor between).
      const newCursor = cm.getCursor();
      cm.setCursor({ line: newCursor.line, ch: newCursor.ch + cursorOffset });
    }
    cm.focus();
  }

  function insertAtCursor(text) {
    insertText(text, 0);
  }

  // Make the editor fill the container.
  const wrapper = cm.getWrapperElement();
  wrapper.style.height = "100%";
  wrapper.style.fontSize = fontSize + "px";

  if (typeof onChange === "function") {
    cm.on("change", () => onChange(cm.getValue()));
  }

  // Refresh on resize so line numbers / scroll stay correct.
  const ro = new ResizeObserver(() => cm.refresh());
  ro.observe(parent);

  setTimeout(() => cm.refresh(), 0);

  return {
    cm,
    getDoc: () => cm.getValue(),
    setDoc: (text) => {
      clearErrorLine();
      cm.setValue(text);
    },
    setLanguage: (lang) => cm.setOption("mode", cmModeForLang(lang)),
    setWrap: (w) => cm.setOption("lineWrapping", !!w),
    setFontSize: (px) => {
      wrapper.style.fontSize = px + "px";
      cm.refresh();
    },
    setTheme: (themeName) => cm.setOption("theme", themeName),
    focus: () => cm.focus(),
    insertText,
    insertAtCursor,
    triggerKey: (key) => {
      if (key === "Tab") {
        // Mimic the indent action.
        if (cm.somethingSelected()) {
          cm.execCommand("indentMore");
        } else {
          cm.replaceSelection("    ");
        }
        cm.focus();
      }
    },
    highlightErrorLine,
    clearErrorLine,
    destroy: () => {
      ro.disconnect();
      wrapper.remove();
    },
  };
}
