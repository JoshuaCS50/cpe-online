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
    autoCloseBrackets: false, // stay lean on mobile
    matchBrackets: true,
    lineWrapping: wrap,
    viewportMargin: Infinity,
    inputStyle: "contenteditable", // better on mobile
    spellcheck: false,
    autocorrect: false,
    autocapitalize: false,
  });

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
    setDoc: (text) => cm.setValue(text),
    setLanguage: (lang) => cm.setOption("mode", cmModeForLang(lang)),
    setWrap: (w) => cm.setOption("lineWrapping", !!w),
    setFontSize: (px) => {
      wrapper.style.fontSize = px + "px";
      cm.refresh();
    },
    setTheme: (themeName) => cm.setOption("theme", themeName),
    focus: () => cm.focus(),
    destroy: () => {
      ro.disconnect();
      wrapper.remove();
    },
  };
}
