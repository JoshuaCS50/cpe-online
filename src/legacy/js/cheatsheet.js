// CPE150S cheat sheet — sourced from the course PDF.
// Each section returns ready-to-render HTML. Rendering is done by app.js.

export const CHEATSHEET_SECTIONS = [
  {
    id: "format",
    label: "Format Specifiers",
    html: `
      <h3>Format specifiers — printf &amp; scanf</h3>
      <p class="analogy">Format specifiers are <strong>type tags</strong> for variables — they tell <code>printf</code> how to print and <code>scanf</code> what kind of value to expect.</p>
      <table>
        <thead><tr><th>Specifier</th><th>Type</th><th>Example</th></tr></thead>
        <tbody>
          <tr><td><code>%d</code></td><td>int (decimal)</td><td><code>printf("%d", age);</code></td></tr>
          <tr><td><code>%i</code></td><td>int (any base)</td><td><code>scanf("%i", &amp;n);</code></td></tr>
          <tr><td><code>%f</code></td><td>float</td><td><code>printf("%f", price);</code></td></tr>
          <tr><td><code>%lf</code></td><td>double (read)</td><td><code>scanf("%lf", &amp;x);</code></td></tr>
          <tr><td><code>%.2f</code></td><td>float, 2 decimals</td><td><code>printf("%.2f", pi);</code></td></tr>
          <tr><td><code>%c</code></td><td>single char</td><td><code>scanf(" %c", &amp;letter);</code></td></tr>
          <tr><td><code>%s</code></td><td>string (char[])</td><td><code>scanf("%s", name);</code></td></tr>
          <tr><td><code>%x</code></td><td>int as hex</td><td><code>printf("%x", 255);</code> → <code>ff</code></td></tr>
          <tr><td><code>%o</code></td><td>int as octal</td><td><code>printf("%o", 8);</code> → <code>10</code></td></tr>
          <tr><td><code>%%</code></td><td>literal %</td><td><code>printf("100%%");</code></td></tr>
        </tbody>
      </table>
      <p><strong>Common bugs:</strong> <code>%d</code> with a <code>double</code> prints garbage, and missing <code>&amp;</code> in <code>scanf("%d", x)</code> crashes the program.</p>
    `,
  },
  {
    id: "types",
    label: "Data Types",
    html: `
      <h3>Data types — pick the right container</h3>
      <p class="analogy">Data types are like <strong>kitchen containers</strong>: <code>int</code> = box (whole apples), <code>double</code> = cup (liquid / decimals), <code>char</code> = letter slot (one character).</p>
      <table>
        <thead><tr><th>Type</th><th>Holds</th><th>Range / Notes</th></tr></thead>
        <tbody>
          <tr><td><code>int</code></td><td>Whole numbers</td><td>~ −2.1 billion to +2.1 billion</td></tr>
          <tr><td><code>long</code></td><td>Bigger whole numbers</td><td>at least 32 bits, often 64</td></tr>
          <tr><td><code>float</code></td><td>Decimals</td><td>~ 6 digits of precision</td></tr>
          <tr><td><code>double</code></td><td>Decimals (precise)</td><td>~ 15 digits — prefer this</td></tr>
          <tr><td><code>char</code></td><td>One character</td><td><code>'A'</code>, <code>'7'</code>, <code>'\\n'</code></td></tr>
          <tr><td><code>char[ ]</code></td><td>String (text)</td><td>Add 1 for the <code>'\\0'</code> end marker</td></tr>
          <tr><td><code>bool</code> (C99+)</td><td>true / false</td><td>Need <code>#include &lt;stdbool.h&gt;</code></td></tr>
        </tbody>
      </table>
      <p><strong>Cast to float for averages:</strong> <code>(float) sum / n</code> — otherwise integer division throws away the fraction.</p>
    `,
  },
  {
    id: "math",
    label: "math.h",
    html: `
      <h3>math.h — your scientific calculator</h3>
      <p class="analogy">Once you <code>#include &lt;math.h&gt;</code> you unlock the calculator drawer: square roots, powers, logs, trig.</p>
      <table>
        <thead><tr><th>Function</th><th>Does</th><th>Example</th></tr></thead>
        <tbody>
          <tr><td><code>sqrt(x)</code></td><td>Square root</td><td><code>sqrt(16.0)</code> → <code>4.0</code></td></tr>
          <tr><td><code>pow(x, y)</code></td><td>x raised to y</td><td><code>pow(2, 10)</code> → <code>1024</code></td></tr>
          <tr><td><code>fabs(x)</code></td><td>Absolute value (double)</td><td><code>fabs(-3.5)</code> → <code>3.5</code></td></tr>
          <tr><td><code>round(x)</code></td><td>Round to nearest</td><td><code>round(2.5)</code> → <code>3</code></td></tr>
          <tr><td><code>ceil(x)</code></td><td>Round up</td><td><code>ceil(2.1)</code> → <code>3</code></td></tr>
          <tr><td><code>floor(x)</code></td><td>Round down</td><td><code>floor(2.9)</code> → <code>2</code></td></tr>
          <tr><td><code>sin / cos / tan</code></td><td>Trig (radians)</td><td><code>sin(M_PI / 2)</code> → <code>1.0</code></td></tr>
          <tr><td><code>log(x)</code></td><td>Natural log</td><td><code>log(M_E)</code> → <code>1.0</code></td></tr>
          <tr><td><code>log10(x)</code></td><td>Base-10 log</td><td><code>log10(1000)</code> → <code>3.0</code></td></tr>
        </tbody>
      </table>
      <p><strong>On real GCC</strong> compile with <code>-lm</code>. Inside CPE Online, <code>math.h</code> is linked automatically.</p>
      <p><strong>Degrees to radians:</strong> <code>rad = deg * M_PI / 180.0</code></p>
    `,
  },
  {
    id: "loops",
    label: "Loops",
    html: `
      <h3>Loops — write code once, run it many times</h3>
      <p class="analogy">Loops are a <strong>merry-go-round</strong>. <code>for</code> when you know how many turns; <code>while</code> when you don't; <code>do-while</code> when at least one turn must happen.</p>
      <table>
        <thead><tr><th>Loop</th><th>Shape</th><th>When</th></tr></thead>
        <tbody>
          <tr><td><code>for</code></td><td><code>for (int i=0; i&lt;n; i++) { … }</code></td><td>Counted iteration.</td></tr>
          <tr><td><code>while</code></td><td><code>while (cond) { … }</code></td><td>Until a condition becomes false.</td></tr>
          <tr><td><code>do-while</code></td><td><code>do { … } while (cond);</code></td><td>Run-then-check (menus).</td></tr>
        </tbody>
      </table>
      <p><strong>Off-by-one:</strong> <code>i &lt; n</code> loops 0..n-1 (n times); <code>i &lt;= n</code> loops 0..n (n+1 times).</p>
      <p><strong>Escape hatches:</strong> <code>break</code> exits the loop early; <code>continue</code> skips to the next round.</p>
    `,
  },
  {
    id: "operators",
    label: "Operators",
    html: `
      <h3>Operator precedence (high → low)</h3>
      <table>
        <thead><tr><th>Group</th><th>Operators</th></tr></thead>
        <tbody>
          <tr><td>Unary</td><td><code>!</code> &nbsp; <code>++</code> &nbsp; <code>--</code> &nbsp; <code>-x</code></td></tr>
          <tr><td>Multiplicative</td><td><code>*</code> &nbsp; <code>/</code> &nbsp; <code>%</code></td></tr>
          <tr><td>Additive</td><td><code>+</code> &nbsp; <code>-</code></td></tr>
          <tr><td>Relational</td><td><code>&lt;</code> &nbsp; <code>&lt;=</code> &nbsp; <code>&gt;</code> &nbsp; <code>&gt;=</code></td></tr>
          <tr><td>Equality</td><td><code>==</code> &nbsp; <code>!=</code></td></tr>
          <tr><td>Logical AND</td><td><code>&amp;&amp;</code></td></tr>
          <tr><td>Logical OR</td><td><code>||</code></td></tr>
          <tr><td>Ternary</td><td><code>?:</code></td></tr>
          <tr><td>Assignment</td><td><code>=</code> &nbsp; <code>+=</code> &nbsp; <code>-=</code> &nbsp; <code>*=</code> &nbsp; <code>/=</code></td></tr>
        </tbody>
      </table>
      <p><strong>= vs ==:</strong> <code>=</code> assigns. <code>==</code> compares. <em>The #1 beginner bug.</em></p>
      <p><strong>Ternary shape:</strong> <code>condition ? if-true : if-false</code> — for example <code>(n % 2 == 0) ? "Even" : "Odd"</code>.</p>
    `,
  },
  {
    id: "matlab",
    label: "C ↔ MATLAB",
    html: `
      <h3>C ↔ MATLAB — same idea, different syntax</h3>
      <p>If you've used MATLAB in another course, here's the side-by-side mapping. CPE150S students bridge both languages.</p>
      <table>
        <thead><tr><th>Concept</th><th>C</th><th>MATLAB</th></tr></thead>
        <tbody>
          <tr><td>Print</td><td><code>printf("%d\\n", x);</code></td><td><code>fprintf('%d\\n', x);</code></td></tr>
          <tr><td>Read input</td><td><code>scanf("%d", &amp;x);</code></td><td><code>x = input('');</code></td></tr>
          <tr><td>For loop</td><td><code>for(int i=0; i&lt;n; i++)</code></td><td><code>for i = 1:n … end</code></td></tr>
          <tr><td>If / else</td><td><code>if (a&gt;b) { … } else { … }</code></td><td><code>if a&gt;b … else … end</code></td></tr>
          <tr><td>Array index</td><td><code>a[0]</code> (zero-based)</td><td><code>a(1)</code> (one-based)</td></tr>
          <tr><td>Function</td><td><code>int sum(int a,int b){return a+b;}</code></td><td><code>function s = sum(a,b); s = a+b; end</code></td></tr>
          <tr><td>Comment</td><td><code>// or /* */</code></td><td><code>%</code></td></tr>
          <tr><td>Power</td><td><code>pow(x, y)</code></td><td><code>x^y</code></td></tr>
        </tbody>
      </table>
      <p><strong>Watch out:</strong> array indexing differs — C is <code>0..n-1</code>, MATLAB is <code>1..n</code>.</p>
    `,
  },
];

export function findCheatsheetSection(id) {
  return CHEATSHEET_SECTIONS.find((s) => s.id === id);
}

// Format specifier list shown in the long-press popover (Phase 3.13)
export const FORMAT_SPECIFIERS = [
  { token: "%d", desc: "int (decimal whole number)" },
  { token: "%f", desc: "float" },
  { token: "%lf", desc: "double (use in scanf)" },
  { token: "%.2f", desc: "float, 2 decimal places" },
  { token: "%c", desc: "single character" },
  { token: "%s", desc: "string (char array)" },
  { token: "%x", desc: "int as hexadecimal" },
  { token: "%o", desc: "int as octal" },
  { token: "%%", desc: "literal % sign" },
];
