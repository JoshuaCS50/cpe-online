// The folder a Python program runs in. Shared by the worker and the tests,
// so both prepare it the same way.

/**
 * Python that makes `folder` the current folder and the first place import
 * looks, and forgets modules imported from it on earlier runs, so an edited
 * helpers.py is read again.
 */
export function workFolderSetup(folder: string): string {
  const quoted = JSON.stringify(folder);
  return [
    "import os, sys, importlib",
    `os.chdir(${quoted})`,
    `if ${quoted} not in sys.path: sys.path.insert(0, ${quoted})`,
    `for _name in [n for n, m in list(sys.modules.items()) if (getattr(m, "__file__", None) or "").startswith(${quoted} + "/")]: del sys.modules[_name]`,
    "importlib.invalidate_caches()",
  ].join("\n");
}
