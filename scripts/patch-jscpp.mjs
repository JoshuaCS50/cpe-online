#!/usr/bin/env node
// Builds public/vendor/JSCPP.es5.min.js from the untouched upstream bundle in
// vendor-src/, with these behaviour changes: input is pulled on demand;
// comparisons give 1 or 0; a function prototype followed by its definition
// counts as one function; scanf can fill an array element and read %lf.
//
// Upstream reads all of stdin once, when <stdio.h> or <iostream> is loaded, so
// a program can never ask for more input while it runs. The patched build
// starts with an empty buffer and calls `config.stdio.drain()` each time a
// read finds the buffer exhausted. A host that blocks inside `drain()` until
// the user types a line therefore gets a normal interactive terminal.
//
// Each replacement must match an exact number of times; if upstream changes,
// this script fails instead of producing a half-patched file.
//
// Usage: node scripts/patch-jscpp.mjs

import { readFileSync, writeFileSync } from "node:fs";

const SOURCE = "vendor-src/JSCPP.es5.min.orig.js";
const TARGET = "public/vendor/JSCPP.es5.min.js";

/** [description, expected matches, search, replacement] */
const PATCHES = [
  [
    "cstdio: start empty; add refill (skipped while sscanf borrows the buffer) and want (refill until the buffer can satisfy a read)",
    1,
    `M=N.drain(),j=function(){var a;if(a="",M.length>0)`,
    `M="",N.__refill=function(){if(N.__sscanf)return!1;var a=N.drain();return!!a&&(M+=a,!0)},N.__want=function(a){for(;!a.test(M)&&N.__refill(););},j=function(){var a;if(M.length>0||N.__refill(),a="",M.length>0)`,
  ],
  [
    "cstdio gets(): refill when the buffer is empty",
    1,
    `k=function(){var a,b;return a=M.indexOf("\\n"),`,
    `k=function(){var a,b;return M.length>0||N.__refill(),a=M.indexOf("\\n"),`,
  ],
  [
    "cstdio scanf token reader: refill until there is something the format can match (%c skips newlines, as upstream does)",
    1,
    `q=function(a,b,c,d){var e,f,g,h,i,j;return i=void 0,j=M,`,
    `q=function(a,b,c,d){var e,f,g,h,i,j;return i=void 0,N.__want("."===c?/[^\\n\\r]/:"[^\\n\\r]*"===c?/[^]/:/\\S/),j=M,`,
  ],
  [
    "cstdio sscanf: mark the buffer as borrowed",
    1,
    `k=M,M=l,j=f(c),`,
    `k=M,M=l,N.__sscanf=1,j=f(c),`,
  ],
  [
    "cstdio sscanf: release the buffer",
    1,
    `return M=k,n.val(n.intTypeLiteral,j.length)}`,
    `return M=k,N.__sscanf=0,n.val(n.intTypeLiteral,j.length)}`,
  ],
  ["iostream: start empty", 1, `buf:l.drain(),istream:l,`, `buf:"",istream:l,`],
  [
    "iostream >> (numbers, chars, strings): refill when nothing but whitespace is left",
    2,
    `f=b.v.buf,b.v.eofbit=0===f.length,`,
    `f=b.v.buf,/\\S/.test(f)||(f=b.v.buf=f+(b.v.istream.drain()||"")),b.v.eofbit=0===f.length,`,
  ],
  [
    "iostream getline: refill when the buffer is empty",
    1,
    `g=b.v.buf,b.v.eofbit=0===g.length,`,
    `g=b.v.buf,g.length>0||(g=b.v.buf=b.v.istream.drain()||""),b.v.eofbit=0===g.length,`,
  ],
  [
    "iostream get(): refill when the buffer is empty",
    1,
    `c=b.v.buf,b.v.eofbit=0===c.length,`,
    `c=b.v.buf,c.length>0||(c=b.v.buf=b.v.istream.drain()||""),b.v.eofbit=0===c.length,`,
  ],
  // Comparisons and && || ! produce JavaScript booleans inside the
  // interpreter. In C they are the int values 1 and 0, so printf("%d", a < b)
  // must print 1, not stop with "format argument 'true' not an integer".
  // scanf stores through a pointer. For a pointer into an array, upstream
  // always treats the target as a text buffer and copies characters from
  // position 0, so scanf("%d", &values[i]) fails with "Memory overflow".
  // A number now goes into the one element the pointer names; text (%s into
  // a char array) keeps the upstream path.
  // %c hands the store one character as text. char counts as a number type,
  // so upstream tried to turn "+" into a number and failed with "Memory
  // overflow". Text stored into a number type is now its character code.
  [
    "scanf %c into a char: store the character's code",
    1,
    `case"normal":return b.isNumericType(a.t.targetType)?(f=b.val(a.t.targetType,c,!0),a.v.target.v=f.v):`,
    `case"normal":return b.isNumericType(a.t.targetType)?(f=b.val(a.t.targetType,"string"==typeof c?c.charCodeAt(0):c,!0),a.v.target.v=f.v):`,
  ],
  [
    "scanf into an array element: scanf(\"%d\", &values[i]) stores values[i]",
    1,
    `case"array":if(i=b.makeCharArrayFromString(c),i.v.target.length>a.v.target.length)`,
    `case"array":if("string"!=typeof c||1===c.length&&a.v.position>0){if(a.v.position<0||a.v.position>=a.v.target.length)return b.raiseException("index out of bound "+a.v.position+" >= "+a.v.target.length);return f=b.val(a.t.eleType,"string"==typeof c?c.charCodeAt(0):c,!0),a.v.target[a.v.position].v=f.v}if(i=b.makeCharArrayFromString(c),i.v.target.length>a.v.target.length)`,
  ],
  // printf collects its arguments with its own pattern, which has no length
  // modifiers, so printf("%lf", d) and printf("%ld", n) found no argument
  // and stopped with "insufficient arguments". The formatter itself already
  // accepts h, l and L.
  [
    "printf %lf %ld %hd ...: length modifiers are allowed",
    1,
    String.raw`(?:\.(?:[0-9]+|\*))?([diuoxXfFeEgGaAcspn])/g`,
    String.raw`(?:\.(?:[0-9]+|\*))?(?:hh|h|ll|l|L)?([diuoxXfFeEgGaAcspn])/g`,
  ],
  [
    "scanf %lf (and %e %g %le %lg): read a decimal number, as %f does",
    1,
    `case"%f":f=o(c,b);break;default:`,
    `case"%f":case"%lf":case"%e":case"%le":case"%g":case"%lg":f=o(c,b);break;default:`,
  ],
  // <string.h>. Library functions take their arguments spread out,
  // fn(rt, this, x, y), but strcat, strncat and sprintf called strlen,
  // strcpy and strncpy as fn(rt, this, [x, y]), so all three crashed inside
  // the interpreter. strcat and strncat also built their "end of the
  // destination" pointer with a plain pointer type, which strcpy rejects.
  ["string.h internal calls: strlen(e)", 2, `)(a,null,[e])`, `)(a,null,e)`],
  ["string.h internal calls: strlen(c)", 4, `)(a,null,[c])`, `)(a,null,c)`],
  ["string.h internal calls: strlen(f)", 2, `)(a,null,[f])`, `)(a,null,f)`],
  ["string.h internal calls: strcpy(k, e) from strcat", 1, `)(a,null,[k,e])`, `)(a,null,k,e)`],
  ["string.h internal calls: strncpy(m, f, g) from strncat", 1, `)(a,null,[m,f,g])`, `)(a,null,m,f,g)`],
  [
    "sprintf: strcpy(dest, formatted), and return the text's length",
    1,
    `J(f,null,[g,d]),f.val(f.intTypeLiteral,d.length)`,
    `J(f,null,g,d),f.val(f.intTypeLiteral,d.v.target.length-1)`,
  ],
  // strcpy refused a string that fits exactly (a 3-letter word into char[4])
  // and, when the destination was too small, wrote the "\0" past its end
  // without complaint. The check is now "is there room for the \0".
  [
    "strcpy: room for the terminator",
    1,
    `g===e.length-1?a.raiseException("destination array is not big enough"):e[g]=a.val(a.charTypeLiteral,0)`,
    `g>=e.length?a.raiseException("destination array is not big enough"):e[g]=a.val(a.charTypeLiteral,0)`,
  ],
  [
    "strcat: the end of the destination is an array pointer",
    1,
    `k=a.val(d,a.makeArrayPointerValue(c.v.target,c.v.position+i))`,
    `k=a.val(c.t,a.makeArrayPointerValue(c.v.target,c.v.position+i))`,
  ],
  [
    "strncat: the end of the destination is an array pointer",
    1,
    `m=a.val(d,a.makeArrayPointerValue(c.v.target,c.v.position+k))`,
    `m=a.val(c.t,a.makeArrayPointerValue(c.v.target,c.v.position+k))`,
  ],
  // strcmp compared the second string at the first string's position and did
  // not stop at "\0", so two equal strings ran off the end and crashed.
  [
    "strcmp: compare position by position and stop at the end of the strings",
    1,
    `for(h=d.v.target,f=d.v.position,e=c.v.target,g=c.v.position;f<h.length&&g<e.length&&h[f].v===e[f].v;)f++,g++;return a.val(a.intTypeLiteral,e[f].v-h[f].v)`,
    `for(h=d.v.target,f=d.v.position,e=c.v.target,g=c.v.position;f<h.length&&g<e.length&&h[f].v===e[g].v&&0!==e[g].v;)f++,g++;return a.val(a.intTypeLiteral,(g<e.length?e[g].v:0)-(f<h.length?h[f].v:0))`,
  ],
  // strncpy and strncmp compared their count, a value object, with 0, so
  // strncpy copied nothing and strncmp compared nothing.
  [
    "strncpy and strncmp: use the count's value",
    2,
    `b.regFunc(function(a,b,c,d,e){var f,g,h,i;if(a.isArrayType(c.t)&&a.isArrayType(d.t)){for(i=d.v.target,g=d.v.position,f=c.v.target,h=c.v.position;e>0&&`,
    `b.regFunc(function(a,b,c,d,e){var f,g,h,i;if("object"==typeof e&&null!==e&&(e=e.v),a.isArrayType(c.t)&&a.isArrayType(d.t)){for(i=d.v.target,g=d.v.position,f=c.v.target,h=c.v.position;e>0&&`,
  ],
  // Arrays of arrays. arrayInit handles one dimension per level and recurses
  // per element, but its entry check only accepted a list of plain values,
  // so int grid[2][3] = {{1, 2, 3}, {4, 5, 6}}; failed with "dimensions do
  // not agree, 2 != 2". A nested list at an outer level now goes straight to
  // the per-element step; a lone literal 0 at an outer level (= {0}) means
  // every element is 0. Any other single value still reports an error.
  [
    "2D arrays: nested initialiser lists, and = {0}",
    1,
    `case 83:a.state="Initializer_array"===c.type&&i>=c.Initializers.length&&(0===c.Initializers.length||"Initializer_expr"===c.Initializers[0].type)?54:82;break;`,
    `case 83:a.state=d<b.length-1&&"Initializer_array"===c.type&&1===c.Initializers.length&&"Initializer_expr"===c.Initializers[0].type&&/"type":"(?:Decimal|Octal)Constant","value":"0"/.test(JSON.stringify(c.Initializers[0]))&&!/"value":"[1-9]/.test(JSON.stringify(c.Initializers[0]))?(c=null,53):d<b.length-1&&"Initializer_array"===c.type&&i>=c.Initializers.length&&c.Initializers.length>0&&"Initializer_array"===c.Initializers[0].type?53:"Initializer_array"===c.type&&i>=c.Initializers.length&&(0===c.Initializers.length||"Initializer_expr"===c.Initializers[0].type)?54:82;break;`,
  ],
  // A list with one value took a "fill every element with it" shortcut that
  // only works for 0, so int a[3] = {1}; failed with "too few initializers"
  // instead of giving {1, 0, 0}. The shortcut is now kept for a literal 0
  // (which the parser reads as an octal constant); anything else takes the
  // normal path, which fills the missing elements with 0.
  [
    "arrays: a one-value list such as {1} leaves the rest 0",
    1,
    `case 51:a.state=1===c.Initializers.length&&this.rt.isIntegerType(e)?15:47;break;`,
    `case 51:a.state=1===c.Initializers.length&&this.rt.isIntegerType(e)&&"Initializer_expr"===c.Initializers[0].type&&/"type":"(?:Decimal|Octal)Constant","value":"0"/.test(JSON.stringify(c.Initializers[0]))&&!/"value":"[1-9]/.test(JSON.stringify(c.Initializers[0]))?15:47;break;`,
  ],
  // Pointers. The pointer operators returned bare JavaScript values (true, a
  // number) where the interpreter expects its own value objects, so every
  // comparison and pointer subtraction crashed. != and +=/-= looked up the
  // wrong keys. ++ and -- changed the position object in place, and that
  // object is shared after `int *p = v;` or `q = p;`, so p++ also moved the
  // array v. Comparing with NULL (which is 0 here) and `if (p)` failed.
  [
    "pointer ==: return a value; a pointer equals 0 (NULL) when it points nowhere",
    1,
    `"o(==)":{"#default":function(a,b,c){return!!a.isTypeEqualTo(b.t,c.t)&&("array"===b.t.ptrType?b.v.target===c.v.target&&(null===b.v.target||b.v.position===c.v.position):b.v.target===c.v.target)}}`,
    `"o(==)":{"#default":function(a,b,c){return a.val(a.boolTypeLiteral,a.isNumericType(c.t)?0==c.v&&null==b.v.target:null==b.v.target||null==c.v.target?null==b.v.target&&null==c.v.target:!!a.isTypeEqualTo(b.t,c.t)&&("array"===b.t.ptrType?b.v.target===c.v.target&&b.v.position===c.v.position:b.v.target===c.v.target))}}`,
  ],
  // NULL is a void pointer. Casting it, or any void pointer, to int * (as in
  // int *p = NULL;) is allowed in C; upstream refused, and its error message
  // read a field plain pointers do not have, so it crashed instead.
  [
    "pointer casts: void * converts to and from any plain pointer",
    1,
    `else if(this.isNormalPointerType(a)){if(this.isTypeEqualTo(a.targetType,b.t.targetType))return b;this.raiseException(this.makeTypeString(a.targetType)+" is not equal to "+this.makeTypeString(b.t.eleType))}`,
    `else if(this.isNormalPointerType(a)){if(this.isTypeEqualTo(a.targetType,b.t.targetType))return b;if("primitive"===a.targetType.type&&"void"===a.targetType.name||b.t.targetType&&"primitive"===b.t.targetType.type&&"void"===b.t.targetType.name)return this.val(a,b.v);this.raiseException(this.makeTypeString(a.targetType)+" is not equal to "+this.makeTypeString(b.t.targetType||b.t))}`,
  ],
  [
    "pointer !: !p is true when p points nowhere",
    1,
    `this.types.pointer={"o(==)":`,
    `this.types.pointer={"o(!)":{"#default":function(a,b){return a.val(a.boolTypeLiteral,null==b.v.target)}},"o(==)":`,
  ],
  [
    "pointer !=: use the o(==) operator and return a value",
    1,
    `"o(!=)":{"#default":function(a,b,c){return!a.types.pointer["=="]["#default"](a,b,c)}}`,
    `"o(!=)":{"#default":function(a,b,c){return a.val(a.boolTypeLiteral,!a.types.pointer["o(==)"]["#default"](a,b,c).v)}}`,
  ],
  ["pointer <: return a value", 1, `return b.v.position<c.v.position;`, `return a.val(a.boolTypeLiteral,b.v.position<c.v.position);`],
  ["pointer >: return a value", 1, `return b.v.position>c.v.position;`, `return a.val(a.boolTypeLiteral,b.v.position>c.v.position);`],
  ["pointer <=: return a value", 1, `return b.v.position<=c.v.position;`, `return a.val(a.boolTypeLiteral,b.v.position<=c.v.position);`],
  ["pointer >=: return a value", 1, `return b.v.position>=c.v.position;`, `return a.val(a.boolTypeLiteral,b.v.position>=c.v.position);`],
  [
    "pointer - pointer: return the distance as an int value",
    1,
    `if(b.v.target===c.v.target)return b.v.position-c.v.position;`,
    `if(b.v.target===c.v.target)return a.val(a.intTypeLiteral,b.v.position-c.v.position);`,
  ],
  ["pointer += and -=: use the o(=) operator", 2, `a.types.pointer["="]["#default"](a,b,c)`, `a.types.pointer["o(=)"]["#default"](a,b,c)`],
  [
    "pointer ++: give the pointer a new position instead of moving one it shares",
    1,
    `"o(++)":{"#default":function(a,b,c){return b.left||a.raiseException(a.makeValString(b)+" is not a left value"),c?a.val(b.t,a.makeArrayPointerValue(b.v.target,b.v.position++)):(b.v.position++,b)}}`,
    `"o(++)":{"#default":function(a,b,c){var d;return b.left||a.raiseException(a.makeValString(b)+" is not a left value"),d=b.v,b.v=a.makeArrayPointerValue(d.target,d.position+1),c?a.val(b.t,a.makeArrayPointerValue(d.target,d.position)):b}}`,
  ],
  [
    "pointer --: give the pointer a new position instead of moving one it shares",
    1,
    `"o(--)":{"#default":function(a,b,c){return b.left||a.raiseException(a.makeValString(b)+" is not a left value"),c?a.val(b.t,a.makeArrayPointerValue(b.v.target,b.v.position--)):(b.v.position--,b)}}`,
    `"o(--)":{"#default":function(a,b,c){var d;return b.left||a.raiseException(a.makeValString(b)+" is not a left value"),d=b.v,b.v=a.makeArrayPointerValue(d.target,d.position-1),c?a.val(b.t,a.makeArrayPointerValue(d.target,d.position)):b}}`,
  ],
  [
    "*p on a NULL or never-set pointer: a clear error instead of an interpreter crash",
    1,
    `"o(*)":{"#default":function(a,b,c){return void 0===c?b.v.target:void a.raiseException("you cannot multiply a pointer")}}`,
    `"o(*)":{"#default":function(a,b,c){return void 0===c?(null==b.v.target&&a.raiseException("null pointer: this pointer is NULL or was never given an address, so there is nothing to read or change through it"),b.v.target):void a.raiseException("you cannot multiply a pointer")}}`,
  ],
  [
    "if (p): a pointer counts as true when it points somewhere; int *p = 0; makes a pointer that points nowhere",
    1,
    `prototype.cast=function(a,b){var c,d,e,f;if(this.isTypeEqualTo(b.t,a))return b;`,
    `prototype.cast=function(a,b){var c,d,e,f;if(this.isTypeEqualTo(b.t,a))return b;if("primitive"===a.type&&"bool"===a.name&&this.isPointerType(b.t))return this.val(a,null!=b.v.target);if(this.isNormalPointerType(a)&&"primitive"===b.t.type&&this.isNumericType(b.t)&&0==b.v)return this.val(a,this.nullPointerValue);`,
  ],
  // %p mapped to a void pointer, and casting a pointer to it crashed. It now
  // prints a made-up but consistent address: the same variable always shows
  // the same number, and neighbouring array elements differ by their size.
  [
    "printf %p: print a consistent address",
    1,
    `k=e[d++],a=j.cast(l,k),j.isStringType(a.t)?h.push(m=j.getStringFromCharArray(a)):h.push(m=a.v)`,
    `k=e[d++],"p"===b[1]?h.push(m=function(r,v){var t=v&&v.v&&v.v.target,base,size;if(null==t||"object"!=typeof t)return"(nil)";r.__addr||(r.__addr=new WeakMap,r.__nextAddr=4096);base=r.__addr.get(t);void 0===base&&(base=r.__nextAddr,r.__addr.set(t,base),r.__nextAddr+=1024);size="array"===v.t.ptrType&&v.t.eleType&&"char"===v.t.eleType.name?1:"array"===v.t.ptrType&&v.t.eleType&&"double"===v.t.eleType.name?8:4;return"0x"+(1879048192+base+("array"===v.t.ptrType?size*v.v.position:0)).toString(16)}(j,k)):(a=j.cast(l,k),j.isStringType(a.t)?h.push(m=j.getStringFromCharArray(a)):h.push(m=a.v))`,
  ],
  ["printf %p: format the address as text", 1, `e=g.apply(null,[a].concat(i.call(d)))`, `e=g.apply(null,[a.replace(/%p/g,"%s")].concat(i.call(d)))`],
  // A prototype (`int square(int x);`) and the later definition are both
  // registered. A call whose argument types need converting, such as
  // square(7) where 7 is unsigned, finds both, and they are the same
  // function; count it once instead of calling the call ambiguous.
  [
    "function calls: a prototype and its definition are one function, not two",
    1,
    `e.length>1?this.raiseException("ambiguous method invoking, "+e.length+" compatible methods"):g=e[0]`,
    `(e=e.filter(function(a,b,c){return c.indexOf(a)===b}),e.length>1?this.raiseException("ambiguous method invoking, "+e.length+" compatible methods"):g=e[0])`,
  ],
  [
    "cast to int, char, float...: a comparison result becomes 1 or 0, so `int t = a < b; if (t == 1)` works",
    1,
    `if("bool"===a.name)return this.val(a,b.v?1:0);`,
    `if("bool"===a.name)return this.val(a,b.v?1:0);"boolean"==typeof b.v&&(b=this.val(b.t,b.v?1:0));`,
  ],
  [
    "printf %d %i %u %x %o: print a comparison result as 1 or 0",
    1,
    `f.prototype.formatInt=function(a){var b=parseInt(a.arg);`,
    `f.prototype.formatInt=function(a){"boolean"==typeof a.arg&&(a.arg=+a.arg);var b=parseInt(a.arg);`,
  ],
  [
    "printf %f %e %g: print a comparison result as 1 or 0",
    1,
    `f.prototype.formatDouble=function(a){var b=parseFloat(a.arg);`,
    `f.prototype.formatDouble=function(a){"boolean"==typeof a.arg&&(a.arg=+a.arg);var b=parseFloat(a.arg);`,
  ],
];

let text = readFileSync(SOURCE, "utf8");
for (const [description, expected, search, replacement] of PATCHES) {
  const found = text.split(search).length - 1;
  if (found !== expected) {
    console.error(`Patch failed: "${description}" matched ${found} time(s), expected ${expected}.`);
    process.exit(1);
  }
  text = text.split(search).join(replacement);
}

const banner =
  "/* JSCPP (MIT, github.com/felixhao28/JSCPP), patched by scripts/patch-jscpp.mjs: stdin is pulled on demand; comparisons are 1 or 0; prototypes work; scanf fills array elements and reads %lf and %c; string.h and 2D initialisers fixed. */\n";
writeFileSync(TARGET, banner + text);
console.log(`Wrote ${TARGET} (${PATCHES.length} patches applied).`);
