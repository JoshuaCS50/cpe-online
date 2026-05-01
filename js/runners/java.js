// Java runner — placeholder for Phase 2. Full JVM-in-browser (DoppioJVM / TeaVM)
// is a large dependency we defer until the C flow is solid.

export async function runJava({ code, consoleIO }) {
  consoleIO.writeInfo(
    "Java runtime is not bundled yet — coming in a future update.\n" +
      "For now, you can still write, save, and share .java files.\n" +
      "If you need to test Java code today, try https://www.jdoodle.com or a local JDK.\n"
  );
  return { ok: false, exitCode: -1 };
}
