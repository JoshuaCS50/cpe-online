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
  // Dynamic memory. Upstream JSCPP has no malloc, calloc, realloc or free.
  // malloc(n) hands out an untyped block that remembers its size in bytes;
  // the first time it is assigned or cast to a pointer type (int *v =
  // malloc(...)), it becomes n / sizeof(int) elements of that type, so v[i],
  // *(v + i) and p++ work as on any array. free marks the block as given
  // back: using it afterwards, freeing it twice, or freeing an address that
  // did not come from malloc stops with a clear error, as the memory-bug
  // lessons need. Unlike real C, new memory always starts at 0.
  [
    "heap: helpers on the runtime (allocate, type a block, free, resize)",
    1,
    `d.prototype.makeArrayPointerValue=function(a,b){return{target:a,position:b}},`,
    `d.prototype.makeArrayPointerValue=function(a,b){return{target:a,position:b}},` +
      `d.prototype.__heapAlloc=function(n){var t=[];return n=Math.max(0,Math.floor(Number(n)||0)),t.__heapBlock=!0,t.__bytes=n,this.val(this.arrayPointerType(this.voidTypeLiteral,0),this.makeArrayPointerValue(t,0))},` +
      `d.prototype.__elemSize=function(t){if("class"===t.type)return this.getSizeByType(t);var l="primitive"===t.type&&this.config.limits[t.name];return l&&l.bytes?l.bytes:"primitive"===t.type&&/double/.test(t.name)?8:4},` +
      `d.prototype.__heapAdopt=function(t,b){var k=b.v.target,s=this.__elemSize(t),n=Math.floor(k.__bytes/s),i;for(i=0;i<n;i++)k.push(this.defaultValue(t,!0));return k.__adoptedAs=t,this.val(this.arrayPointerType(t,n),this.makeArrayPointerValue(k,b.v.position))},` +
      `d.prototype.__heapFree=function(p){var t=p&&p.v&&p.v.target;if(null==t)return;if(!Array.isArray(t)||!t.__heapBlock)return this.raiseException("bad free: free() was given an address that did not come from malloc, calloc or realloc");if(t.__freed)return this.raiseException("double free: this memory was already given back with free()");if(0!==p.v.position)return this.raiseException("bad free: free() must be given the address malloc returned, not one moved along from it");t.__freed=!0},` +
      `d.prototype.__heapRealloc=function(p,n){var t=p&&p.v&&p.v.target,r,k,e,s,c,i;if(null==t)return this.__heapAlloc(n);if(!Array.isArray(t)||!t.__heapBlock)return this.raiseException("bad realloc: realloc() was given an address that did not come from malloc, calloc or realloc");if(t.__freed)return this.raiseException("use after free: this memory was already given back with free(), so it must not be used any more");if(r=this.__heapAlloc(n),!t.__adoptedAs)return t.__freed=!0,r;for(e=t.__adoptedAs,k=r.v.target,s=this.__elemSize(e),c=Math.floor(k.__bytes/s),i=0;i<c;i++)k.push(i<t.length?this.val(e,t[i].v,!0):this.defaultValue(e,!0));return k.__adoptedAs=e,t.__freed=!0,this.val(this.arrayPointerType(e,c),this.makeArrayPointerValue(k,0))},`,
  ],
  [
    "heap: malloc, calloc, realloc and free in <stdlib.h>",
    1,
    `rt.scope[0].NULL=rt.nullPointer,`,
    `rt.scope[0].NULL=rt.nullPointer,` +
      `rt.regFunc(function(r,t,s){return r.__heapAlloc(s.v)},"global","malloc",[rt.unsignedintTypeLiteral],rt.voidPointerType),` +
      `rt.regFunc(function(r,t,n,s){return r.__heapAlloc(n.v*s.v)},"global","calloc",[rt.unsignedintTypeLiteral,rt.unsignedintTypeLiteral],rt.voidPointerType),` +
      `rt.regFunc(function(r,t,p,s){return r.__heapRealloc(p,s.v)},"global","realloc",[rt.voidPointerType,rt.unsignedintTypeLiteral],rt.voidPointerType),` +
      `rt.regFunc(function(r,t,p){r.__heapFree(p)},"global","free",[rt.voidPointerType],rt.voidTypeLiteral),`,
  ],
  [
    "heap: a block from malloc takes the type it is first assigned to; any array pointer converts to void *",
    1,
    `if(this.isTypeEqualTo(a.targetType,b.t.eleType))return b;this.raiseException(this.makeTypeString(a.targetType)+" is not equal to array element type "+this.makeTypeString(b.t.eleType))`,
    `if(this.isTypeEqualTo(a.targetType,b.t.eleType))return b;if(b.v.target&&b.v.target.__heapBlock&&!b.v.target.__adoptedAs)return this.__heapAdopt(a.targetType,b);if("primitive"===a.targetType.type&&"void"===a.targetType.name)return b;this.raiseException(this.makeTypeString(a.targetType)+" is not equal to array element type "+this.makeTypeString(b.t.eleType))`,
  ],
  // A pointer variable that has been given an array becomes an array
  // pointer, so `p = NULL;` after free(p) went through the plain-pointer to
  // array-pointer branch, which refused void * and crashed in its message.
  [
    "pointer casts: NULL (void *) can be assigned to a pointer that held an array",
    1,
    `else if(this.isArrayType(a)){if(this.isTypeEqualTo(a.eleType,b.t.targetType))return b;this.raiseException("array element type "+this.makeTypeString(a.eleType)+" is not equal to "+this.makeTypeString(b.t.eleType))}`,
    `else if(this.isArrayType(a)){if(this.isTypeEqualTo(a.eleType,b.t.targetType))return b;if(b.t.targetType&&"primitive"===b.t.targetType.type&&"void"===b.t.targetType.name)return b;this.raiseException("array element type "+this.makeTypeString(a.eleType)+" is not equal to "+this.makeTypeString(b.t.targetType||b.t))}`,
  ],
  // A cast's type name ignored its pointer part, so (int *) x cast to int.
  [
    "casts: (int *) and other pointer type names keep their *",
    1,
    `TypeName:function(b,c,d){var e,f,g,h,i;for(a=b.rt,i=[],h=c.base,f=0,g=h.length;f<g;f++)e=h[f],"const"!==e&&i.push(e);return a.simpleType(i)}`,
    `TypeName:function(b,c,d){var e,f,g,h,i;for(a=b.rt,i=[],h=c.base,f=0,g=h.length;f<g;f++)e=h[f],"const"!==e&&!(Array.isArray(e)&&!e.length)&&i.push(e);return b.buildRecursivePointerType(c.extra&&c.extra.Pointer,a.simpleType(i),0)}`,
  ],
  [
    "heap: using memory after free() stops with a clear error",
    1,
    `(d=b.v.target,b.v.position>=d.length?`,
    `(d=b.v.target,d.__freed&&a.raiseException("use after free: this memory was already given back with free(), so it must not be used any more"),b.v.position>=d.length?`,
  ],
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
  // ---- Structs. Upstream parsed a struct definition but threw its member
  // list away, so every struct type was "not defined". The parser now keeps
  // each member list by struct name, and the first time a struct type is
  // named it is built from that list. A struct value is
  // {members: {name: value}}; copying one copies every member, arrays too.
  [
    "structs: forget the struct definitions of the previous program before each parse",
    1,
    `if(peg$result=peg$startRuleFunction(),`,
    `if(globalThis.__cpeStructDefs=Object.create(null),globalThis.__cpeAnon=0,peg$result=peg$startRuleFunction(),`,
  ],
  [
    "structs: the parser keeps each struct's member list (a struct with no name gets a made-up one)",
    1,
    `peg$savedPos=c,d=peg$c27(d),c=d`,
    `peg$savedPos=c,null==d&&(d="(no name "+(globalThis.__cpeAnon=(globalThis.__cpeAnon||0)+1)+")"),(globalThis.__cpeStructDefs||(globalThis.__cpeStructDefs=Object.create(null)))[d]=f,d=peg$c27(d),c=d`,
  ],
  [
    "structs: `struct Point {...};` on its own declares no variable",
    1,
    `g=a.simpleType(d.DeclarationSpecifiers),t=d.InitDeclaratorList,`,
    `g=a.simpleType(d.DeclarationSpecifiers),t=d.InitDeclaratorList||[],`,
  ],
  [
    "structs: a struct type is built the first time it is named",
    1,
    `(b={type:"class",name:a},this.getTypeSignature(b)in this.types?b:void this.raiseException(`,
    `(b={type:"class",name:a},this.getTypeSignature(b)in this.types||this.__defineStruct(a)?b:void this.raiseException(`,
  ],
  [
    "structs: helpers that define a struct type, copy struct values and size them",
    1,
    `d.prototype.newClass=function(a,b){`,
    `d.prototype.__defineStruct=function(a){var m=/^struct (.+)$/.exec(a),D=globalThis.__cpeStructDefs,rt=this,F,T,S,fields,seen=Object.create(null),num;if(!m||!D||!Object.prototype.hasOwnProperty.call(D,m[1]))return!1;` +
      `F=D[m[1]],T={type:"class",name:a},S=Object.create(null),fields=[],S.__fields=fields,` +
      `S["o(=)"]={"#default":function(r,b,c){return b.left||r.raiseException(r.makeValString(b)+" is not a left value"),c=r.cast(b.t,c),r.__copyStruct(b,c),b}},` +
      `S["o(&)"]={"#default":function(r,b,c){return void 0===c?b.array?r.val(r.arrayPointerType(b.t,b.array.length),r.makeArrayPointerValue(b.array,b.arrayIndex)):r.val(r.normalPointerType(b.t),r.makeNormalPointerValue(b)):void r.raiseException("& between two values needs numbers, not a struct")}},` +
      `this.types[this.getTypeSignature(T)]=S;` +
      `num=function(x){for(;x&&"ConstantExpression"===x.type;)x=x.Expression;if(x&&"DecimalConstant"===x.type)return parseInt(x.value,10);if(x&&"HexConstant"===x.type)return parseInt(x.value,16);if(x&&"OctalConstant"===x.type)return parseInt(x.value,8);rt.raiseException("an array inside a struct needs a plain number for its size, such as [20]",x)};` +
      `F.forEach(function(q){var base=rt.simpleType(q[0]),list=[q[1][0]].concat((q[1][1]||[]).map(function(x){return x[1]}));list.forEach(function(dd){var name,dims=[],t;` +
      `dd&&"DirectDeclarator"===dd.type&&dd.left&&"Identifier"===dd.left.type||rt.raiseException("this kind of member is not supported inside a struct",dd),name=dd.left.Identifier,` +
      `(dd.right||[]).forEach(function(r){"DirectDeclarator_modifier_array"===r.type?dims.push(num(r.Expression)):rt.raiseException("this kind of member is not supported inside a struct",r)}),` +
      `name in seen&&rt.raiseException("the struct already has a member named "+name,dd),seen[name]=1,t=rt.interp.buildRecursivePointerType(dd.Pointer,base,0),` +
      `fields.push({name:name,type:dims.length?rt.interp.arrayType(dims,0,t):t,isArray:dims.length>0,dims:dims,eleType:t})})});return!0},` +
      `d.prototype.__copyStruct=function(d,s){var S=this.types[this.getTypeSignature(d.t)],i,f,x,y;for(i=0;i<S.__fields.length;i++)f=S.__fields[i],x=d.v.members[f.name],y=s.v.members[f.name],f.isArray?this.__copyArray(x,y,f,0):this.isClassType(f.type)?this.__copyStruct(x,y):(x.t=y.t,x.v=y.v)},` +
      `d.prototype.__copyArray=function(d,s,f,k){var a=d.v.target,b=s.v.target,i,x,y;for(i=0;i<a.length&&i<b.length;i++)x=a[i],y=b[i],k<f.dims.length-1?this.__copyArray(x,y,f,k+1):this.isClassType(f.eleType)?this.__copyStruct(x,y):(x.t=y.t,x.v=y.v)},` +
      `d.prototype.__sizeAlign=function(t){var S,i,f,sa,n,k,off=0,al=1;if(!this.isClassType(t))return n=this.isPointerType(t)?this.config.limits.pointer.bytes:this.__elemSize(t),[n,n];` +
      `S=this.types[this.getTypeSignature(t)],S&&S.__fields||this.raiseException("not implemented");for(i=0;i<S.__fields.length;i++){for(f=S.__fields[i],sa=this.__sizeAlign(f.eleType),n=sa[0],k=0;k<f.dims.length;k++)n*=f.dims[k];off=Math.ceil(off/sa[1])*sa[1]+n,al=Math.max(al,sa[1])}return[Math.ceil(off/al)*al,al]},` +
      `d.prototype.__sizeofTypedef=function(x){for(;x&&"ParenthesesExpression"===x.type;)x=x.Expression;return x&&"IdentifierExpression"===x.type&&Object.prototype.hasOwnProperty.call(this.typedefs,x.Identifier)?{t:this.typedefs[x.Identifier],v:{}}:null},` +
      `d.prototype.newClass=function(a,b){`,
  ],
  [
    "structs: sizeof(Node) where Node is a typedef name, which the parser reads as a variable",
    1,
    `UnaryExpression_Sizeof_Expr:$traceurRuntime.initGeneratorFunction(function b(c,d,e){var f,g,h,i,j,k,l;return $traceurRuntime.createGeneratorInstance(function(b){for(;;)switch(b.state){case 0:a=c.rt,b.state=22;break;`,
    `UnaryExpression_Sizeof_Expr:$traceurRuntime.initGeneratorFunction(function b(c,d,e){var f,g,h,i,j,k,l;return $traceurRuntime.createGeneratorInstance(function(b){for(;;)switch(b.state){case 0:a=c.rt,f=a.__sizeofTypedef(d.Expression),b.state=f?18:22;break;`,
  ],
  [
    "structs: -> on a NULL pointer stops with the null pointer error",
    1,
    `"o(->)":{"#default":function(a,b,c){return a.getMember(b.v.target,c)}}`,
    `"o(->)":{"#default":function(a,b,c){return null==b.v.target&&a.raiseException("null pointer: this pointer is NULL or was never given an address, so there is nothing to read or change through it"),a.getMember(b.v.target,c)}}`,
  ],
  [
    "structs: a new struct starts with every member at 0, arrays too",
    1,
    `else if("class"===a.type)this.raiseException("no default value for object");`,
    `else if("class"===a.type){var S=this.types[this.getTypeSignature(a)],M,i;if(S&&S.__fields){for(M={},i=0;i<S.__fields.length;i++)M[S.__fields[i].name]=this.defaultValue(S.__fields[i].type,!0);return this.val(a,{members:M},b)}this.raiseException("no default value for object")}`,
  ],
  [
    "structs: passing, returning or copying a struct copies every member, arrays included",
    1,
    `d.prototype.clone=function(a){return this.val(a.t,a.v)}`,
    `d.prototype.clone=function(a){var n;return a.t&&"class"===a.t.type&&a.v&&a.v.members?(n=this.defaultValue(a.t),this.__copyStruct(n,a),n):this.val(a.t,a.v)}`,
  ],
  [
    "structs: sizeof a struct adds up its members, with the padding a typical compiler adds",
    1,
    `this.isPrimitiveType(a)?this.config.limits[a.name].bytes:void this.raiseException("not implemented")},d.prototype.getMember=`,
    `this.isPrimitiveType(a)?this.config.limits[a.name].bytes:this.__sizeAlign(a)[0]},d.prototype.getMember=`,
  ],
  [
    "structs: a member name the struct does not have gives a clear error",
    1,
    `if(b in a.v.members)return a.v.members[b]}else`,
    `if(b in a.v.members)return a.v.members[b];this.raiseException(this.makeTypeString(c)+" has no member named "+b)}else`,
  ],
  [
    "structs: . on a pointer suggests ->",
    1,
    `else this.raiseException("only a class can have members")`,
    `else this.raiseException(this.isPointerType(c)?"this is a pointer to a struct, so use -> instead of . to reach "+b:"only a struct can have members")`,
  ],
  [
    "structs: a visitor that fills a struct from a { } list, member by member",
    1,
    `Initializer_expr:$traceurRuntime.initGeneratorFunction(function b(c,d,e){`,
    `__CpeStructInit:function(){var G=function*(b,c,d){var r=b.rt,t=c.structType,S=r.types[r.getTypeSignature(t)],v=r.defaultValue(t,!0),it=c.init.Initializers,i,f,g,x,m;` +
      `for(it.length>S.__fields.length&&r.raiseException("too many values in the { } list for "+r.makeTypeString(t),c.init),i=0;i<it.length;i++)f=S.__fields[i],g=it[i],m=v.v.members[f.name],` +
      `f.isArray?(x=yield*b.arrayInit(f.dims,g,0,f.eleType,d),r.__copyArray(m,x,f,0)):` +
      `"Initializer_array"===g.type?r.isClassType(f.type)?(x=yield*G(b,{init:g,structType:f.type},d),r.__copyStruct(m,x)):r.raiseException("the value for "+f.name+" has { } around it, but "+f.name+" is not an array or a struct",g):` +
      `(x="shorthand"in g?g.shorthand:yield*b.visit(b,g.Expression,d),x=r.cast(f.type,x),r.isClassType(f.type)?r.__copyStruct(m,x):(m.t=x.t,m.v=x.v));return v};` +
      `return Object.defineProperty(G,"constructor",{value:h.constructor}),G}(),Initializer_expr:$traceurRuntime.initGeneratorFunction(function b(c,d,e){`,
  ],
  [
    "structs: struct P p = {...}; fills p member by member",
    1,
    `case 137:b.state=null==l?131:127;break;`,
    `case 137:null!=l&&"Initializer_array"===l.type&&a.isClassType(x)&&(l={Expression:{type:"__CpeStructInit",init:l,structType:x}}),b.state=null==l?131:127;break;`,
  ],
  [
    "structs: an array of structs may list each struct in its own { }",
    1,
    `"Initializer_array"===c.type&&i>=c.Initializers.length&&(0===c.Initializers.length||"Initializer_expr"===c.Initializers[0].type)?54:82`,
    `"Initializer_array"===c.type&&i>=c.Initializers.length&&(0===c.Initializers.length||"Initializer_expr"===c.Initializers[0].type||d===b.length-1&&this.rt.isClassType(e))?54:82`,
  ],
  [
    "structs: keep each struct's own { } list until its element is filled",
    1,
    `case 43:a.state="shorthand"in g?39:35`,
    `case 43:a.state="shorthand"in g||"Initializer_array"===g.type?39:35`,
  ],
  [
    "structs: a struct's { } list inside an array fills that element",
    1,
    `case 157:c&&"Initializer_expr"!==c.type&&`,
    `case 157:c&&"Initializer_array"===c.type&&this.rt.isClassType(e)&&(c={type:"Initializer_expr",Expression:{type:"__CpeStructInit",init:c,structType:e}}),c&&"Initializer_expr"!==c.type&&`,
  ],
  // Two upstream bugs in array starting values. The { } list was rewritten
  // in place the first time it ran, so a function's int a[3] = {n}; kept the
  // first call's values on every later call. And each element was the very
  // value it was given, so int a[2] = {x, x}; made a[0], a[1] and x one box.
  [
    "array starting values: work on a copy of the { } list, not the program itself",
    1,
    `case 0:h=void 0,j=void 0,m=void 0,l=void 0,a.state=163;break;`,
    `case 0:h=void 0,j=void 0,m=void 0,l=void 0,c&&"Initializer_array"===c.type&&(c=Object.assign({},c)),a.state=163;break;`,
  ],
  [
    "array starting values: each element gets its own copy of the value",
    1,
    `case 150:m=this.rt.cast(e,l),m.left=!0`,
    `case 150:m=this.rt.clone(this.rt.cast(e,l)),m.left=!0`,
  ],
  [
    "debugger: show a struct's members instead of <object>",
    1,
    `else this.isClassType(a.t)&&(c="<object>");return c}`,
    `else this.isClassType(a.t)&&(c=a.v&&a.v.members?"{"+Object.keys(a.v.members).map(function(k){return k+": "+this.makeValueString(a.v.members[k],b)},this).join(", ")+"}":a.v&&a.v.file?"<file "+a.v.file.name+">":"<object>");return c}`,
  ],
  [
    "debugger: show a NULL pointer as NULL instead of crashing",
    1,
    `b.noPointer?c="->?":(b.noPointer=!0,c="->"+this.makeValueString(a.v.target))`,
    `null==a.v.target?c="NULL":b.noPointer?c="->?":(b.noPointer=!0,c="->"+this.makeValueString(a.v.target,b))`,
  ],
  [
    "stdio.h: defines NULL, as in real C (upstream only stdlib.h did)",
    1,
    `return L=b.normalPointerType(b.charTypeLiteral),N=b.config.stdio,`,
    `return b.scope[0].NULL=b.nullPointer,L=b.normalPointerType(b.charTypeLiteral),N=b.config.stdio,`,
  ],
  // scanf("%s", word) swapped in new character values instead of filling
  // the array's own, wrote one slot past the terminator (leaving a hole in
  // the array), and ignored where the pointer pointed (buf + 2).
  [
    "scanf %s: fill the array's own characters, from where the pointer points, and nothing past the end of the word",
    1,
    `if(i=b.makeCharArrayFromString(c),i.v.target.length>a.v.target.length)return b.raiseException("Not enough memory on pointer");for(h=[],d=e=0,g=i.v.target.length;0<=g?e<=g:e>=g;d=0<=g?++e:--e)try{h.push(a.v.target[d]=i.v.target[d])}catch(a){h.push(b.raiseException("Not enough memory on pointer"))}return h;`,
    `if(i=b.makeCharArrayFromString(c),i.v.target.length>a.v.target.length-a.v.position)return b.raiseException("Not enough memory on pointer");for(h=[],d=0;d<i.v.target.length;d++)h.push(a.v.target[a.v.position+d].v=i.v.target[d].v);return h;`,
  ],
  [
    "arrays of pointers: int *a[3]; makes three pointers, not three ints",
    1,
    `case 50:N=c.arrayInit,O=N.call(c,j,l,0,g,e)`,
    `case 50:N=c.arrayInit,O=N.call(c,j,l,0,c.buildRecursivePointerType(h.Declarator.Pointer,g,0),e)`,
  ],
  // Upstream's %s pattern was garbled: it only matched letters, digits and
  // a few symbols one at a time, so "([]{})" lost its first character and
  // kept the newline. Real %s reads every character up to the next space.
  [
    "scanf %s: read every character up to the next space or newline",
    1,
    String.raw`c=q(a,b,"([\\w\\]=-]|\\S[^\\][^\\ ])+(\\\\[\\w\\ ][\\w\\:]*)*","STR")`,
    String.raw`c=q(a,b,"\\S+","STR")`,
  ],
  // ---- scanf's result, getchar at the end, EOF. Upstream scanf and sscanf
  // returned the number of % codes, not how many values were read, and a
  // failed match crashed with "Memory overflow". getchar() gave 0 at the end
  // of input, and EOF did not exist.
  [
    "scanf: read one % code at a time, stop at the first that fails, and return how many values were stored, or EOF",
    1,
    `F=function(){var a,b,c,d,e,g,h,j,k,l;for(k=arguments[0],a=arguments[1],j=arguments[2],b=4<=arguments.length?i.call(arguments,3):[],c=k.getStringFromCharArray(j),h=f(c),d=e=0,g=h.length;e<g;d=++e)l=h[d],G(b[d],l);return k.val(k.intTypeLiteral,h.length)}`,
    String.raw`N.__scan=function(fmt,args){var parts=fmt.match(/[^%]*%[A-Za-z][^%]*/g)||[],n=0,x,k;for(k=0;k<parts.length;k++){if(x=l(parts[k]),null==x||"number"==typeof x&&isNaN(x)||""===x)break;k>=args.length&&b.raiseException("scanf has more % codes than variables to store into");G(args[k],x),n++}return 0===n&&parts.length>0&&!/\S/.test(M)?-1:n},` +
      `F=function(){var b,c,j,k;return k=arguments[0],j=arguments[2],b=4<=arguments.length?i.call(arguments,3):[],c=k.getStringFromCharArray(j),k.val(k.intTypeLiteral,N.__scan(c,b))}`,
  ],
  [
    "sscanf: the same, reading from the string",
    1,
    `I=function(){var a,b,c,d,e,g,h,j,k,l,m,n,o;for(n=arguments[0],a=arguments[1],m=arguments[2],d=arguments[3],b=5<=arguments.length?i.call(arguments,4):[],c=n.getStringFromCharArray(d),l=n.getStringFromCharArray(m),k=M,M=l,N.__sscanf=1,j=f(c),e=g=0,h=j.length;g<h;e=++g)o=j[e],G(b[e],o);return M=k,N.__sscanf=0,n.val(n.intTypeLiteral,j.length)}`,
    `I=function(){var b,c,d,k,l,m,n,r;n=arguments[0],m=arguments[2],d=arguments[3],b=5<=arguments.length?i.call(arguments,4):[],c=n.getStringFromCharArray(d),l=n.getStringFromCharArray(m),k=M,M=l,N.__sscanf=1;try{r=N.__scan(c,b)}finally{M=k,N.__sscanf=0}return n.val(n.intTypeLiteral,r)}`,
  ],
  [
    "getchar: return EOF (-1) at the end of input, not 0",
    1,
    `w=function(a,b){var c,e;try{return c=j(),a.val(a.intTypeLiteral,c.charCodeAt(0))}catch(b){return e=b,a.val(a.intTypeLiteral,d)}}`,
    `w=function(a,b){var c,e;try{return c=j(),a.val(a.intTypeLiteral,c.charCodeAt(0))}catch(b){return e=b,a.val(a.intTypeLiteral,-1)}}`,
  ],
  // ---- Files. Upstream had none. Files live in config.files, a plain
  // object of name -> text that the host fills before the run and reads
  // back afterwards, so what a program writes can be shown or kept.
  [
    "stdio.h: FILE, fopen, fclose, fprintf, fputs, fputc, fgetc, getc, fgets, fscanf, feof, rewind, fflush, stdin, stdout, stderr and EOF",
    1,
    `b.regFunc(I,"global","sscanf",[L,L,"?"],b.intTypeLiteral)}}}`,
    String.raw`b.regFunc(I,"global","sscanf",[L,L,"?"],b.intTypeLiteral),function(){` +
      `var rt=b,FS=rt.config.files||(rt.config.files={}),FT={type:"class",name:"FILE"},FP,mk,getF,canRead,canWrite,put,readChar,str,I32=rt.intTypeLiteral,num,std,MODES=["r","w","a","r+","w+","a+","rb","wb","ab","rb+","wb+","ab+","r+b","w+b","a+b"];` +
      `rt.types[rt.getTypeSignature(FT)]=Object.create(null),FP=rt.normalPointerType(FT);` +
      `mk=function(F){return rt.val(FP,rt.makeNormalPointerValue(rt.val(FT,{file:F},!0)))};` +
      `str=function(v){return rt.getStringFromCharArray(v)};num=function(n){return rt.val(I32,n)};` +
      `std={stdin:{name:"stdin",std:"in",read:!0,write:!1,eof:0},stdout:{name:"stdout",std:"out",read:!1,write:!0,eof:0},stderr:{name:"stderr",std:"out",read:!1,write:!0,eof:0}};` +
      `rt.scope[0].stdin=mk(std.stdin),rt.scope[0].stdout=mk(std.stdout),rt.scope[0].stderr=mk(std.stderr),rt.scope[0].EOF=num(-1);` +
      `getF=function(p){var t=p&&p.v&&p.v.target,F;null==t&&rt.raiseException("null file: this FILE pointer is NULL, usually because fopen could not open the file. Check it with if (f == NULL) before using it");t.v&&t.v.file||rt.raiseException("this is not a file from fopen");F=t.v.file;F.closed&&rt.raiseException("file already closed: "+F.name+" was closed with fclose, so it cannot be used any more");return F};` +
      `canRead=function(F){F.read||rt.raiseException("file not open for reading: "+F.name+' was opened with "'+F.mode+'", so it can only be written. Open it with "r" to read it')};` +
      `canWrite=function(F){F.write||rt.raiseException("file not open for writing: "+F.name+' was opened with "r", so it can only be read. Open it with "w" or "a" to write to it')};` +
      `put=function(F,s){var t;if(canWrite(F),"out"===F.std)return void N.write(s);F.append?FS[F.name]+=s:(t=FS[F.name],FS[F.name]=t.slice(0,F.pos)+s+t.slice(F.pos+s.length),F.pos+=s.length)};` +
      `readChar=function(F){var s,c;if(canRead(F),"in"===F.std)return M.length>0||N.__refill(),M.length>0?(c=M.charCodeAt(0),M=M.substr(1),c):(F.eof=1,-1);s=FS[F.name];return F.pos>=s.length?(F.eof=1,-1):s.charCodeAt(F.pos++)};` +
      `rt.regFunc(function(r,t,name,mode){var n=str(name),m=str(mode),F;MODES.indexOf(m)<0&&rt.raiseException('fopen: the mode must be "r" (read), "w" (write) or "a" (add to the end), not "'+m+'"');F={name:n,mode:m,pos:0,eof:0,read:"r"===m[0]||m.indexOf("+")>=0,write:"r"!==m[0]||m.indexOf("+")>=0,append:"a"===m[0]};if("r"===m[0]&&!Object.prototype.hasOwnProperty.call(FS,n))return rt.val(FP,rt.nullPointerValue);"w"===m[0]?FS[n]="":"a"===m[0]&&(FS[n]=FS[n]||"");return mk(F)},"global","fopen",[L,L],FP);` +
      `rt.regFunc(function(r,t,p){var F=getF(p);return F.std||(F.closed=!0),num(0)},"global","fclose",[FP],I32);` +
      `rt.regFunc(function(r,t,p){var c=arguments.length>4?i.call(arguments,4):[],F=getF(p),s=str(e.apply(null,[arguments[3]].concat(c)));return put(F,s),num(s.length)},"global","fprintf",[FP,L,"?"],I32);` +
      `rt.regFunc(function(r,t,s,p){return put(getF(p),str(s)),num(0)},"global","fputs",[L,FP],I32);` +
      `rt.regFunc(function(r,t,c,p){return put(getF(p),String.fromCharCode(c.v)),num(c.v)},"global","fputc",[I32,FP],I32);` +
      `rt.regFunc(function(r,t,p){return num(readChar(getF(p)))},"global","fgetc",[FP],I32);` +
      `rt.regFunc(function(r,t,p){return num(readChar(getF(p)))},"global","getc",[FP],I32);` +
      `rt.regFunc(function(r,t,buf,n,p){var F=getF(p),max=n.v-1,out="",c,k,tg;for(canRead(F);out.length<max&&(c=readChar(F),!(c<0))&&(out+=String.fromCharCode(c),10!==c););if(!out.length)return rt.val(L,rt.nullPointerValue);rt.isArrayType(buf.t)||rt.raiseException("fgets needs a char array to read into");tg=buf.v.target;tg.length-buf.v.position<out.length+1&&rt.raiseException("fgets was told the array holds "+n.v+" characters, but it only has room for "+(tg.length-buf.v.position)+". Use sizeof(line) for the size");for(k=0;k<out.length;k++)tg[buf.v.position+k].v=out.charCodeAt(k);return tg[buf.v.position+out.length].v=0,buf},"global","fgets",[L,I32,FP],L);` +
      `rt.regFunc(function(r,t,p,fmt){var args=arguments.length>4?i.call(arguments,4):[],F=getF(p),c=str(fmt),s,k,res;if(canRead(F),"in"===F.std)return num(N.__scan(c,args));s=FS[F.name].slice(F.pos),k=M,M=s,N.__sscanf=1;try{res=N.__scan(c,args),F.pos+=s.length-M.length,res<0&&(F.eof=1)}finally{M=k,N.__sscanf=0}return num(res)},"global","fscanf",[FP,L,"?"],I32);` +
      `rt.regFunc(function(r,t,p){return num(getF(p).eof?1:0)},"global","feof",[FP],I32);` +
      `rt.regFunc(function(r,t,p){var F=getF(p);F.pos=0,F.eof=0},"global","rewind",[FP],rt.voidTypeLiteral);` +
      `rt.regFunc(function(r,t,p){return getF(p),num(0)},"global","fflush",[FP],I32)` +
      `}()}}}`,
  ],
  // strchr, strrchr and strstr returned a plain pointer holding an array
  // position, which printf("%s") showed as [object Object] and p[1] could
  // not index. They now return a pointer into the array, like p = &s[2].
  [
    "%s and other text reads start where the pointer points, so printf(\"%s\", s + 2) skips two characters",
    1,
    `if(this.isStringType(a.t)){for(e=a.v.target,d="",c=0;`,
    `if(this.isStringType(a.t)){for(e=a.v.target,d="",c=a.v.position||0;`,
  ],
  [
    "string.h: strchr returns a usable pointer into the string",
    1,
    `f[g].v===e.v?a.val(d,a.makeArrayPointerValue(f,g))`,
    `f[g].v===e.v?a.val(a.arrayPointerType(a.charTypeLiteral,f.length),a.makeArrayPointerValue(f,g))`,
  ],
  [
    "string.h: strrchr returns a usable pointer into the string",
    1,
    `h>=0?a.val(d,a.makeArrayPointerValue(f,h))`,
    `h>=0?a.val(a.arrayPointerType(a.charTypeLiteral,f.length),a.makeArrayPointerValue(f,h))`,
  ],
  [
    "string.h: strstr returns a usable pointer into the string",
    1,
    `:a.val(d,a.makeArrayPointerValue(g,h))}return a.raiseException("str1 or str2 is not an array")`,
    `:a.val(a.arrayPointerType(a.charTypeLiteral,g.length),a.makeArrayPointerValue(g,h))}return a.raiseException("str1 or str2 is not an array")`,
  ],
  [
    "string.h: strstr compares the right characters and stops at the end of the word it looks for",
    1,
    `for(i=e.v.position,f=h;i<j.length&&c[f].v===e[i];)f++,i++;if(i===j.length)break;h++`,
    `for(i=e.v.position,f=h;i<j.length&&0!==j[i].v&&f<g.length&&g[f].v===j[i].v;)f++,i++;if(i>=j.length||0===j[i].v)break;h++`,
  ],
  [
    "string.h: strstr takes two strings, not a string and a char",
    1,
    `"global","strstr",[d,b.charTypeLiteral],d)`,
    `"global","strstr",[d,d],d)`,
  ],
  [
    "scanf %d: read a decimal number only, so letters are left for the next read and 010 is ten",
    1,
    `r=function(a,b){var c;return c=q(a,b,"[-]?[A-Za-z0-9]+"),c?"0"===c[0]?"x"===c[1]||"X"===c[1]?y(c):A(c):parseInt(c):null}`,
    `r=function(a,b){var c;return c=q(a,b,"[-+]?[0-9]+"),c?parseInt(c,10):null}`,
  ],
  // scanf looked for a match anywhere in the waiting input, so with "abc"
  // and then "40" typed, %d skipped the letters and read 40. Real scanf
  // skips spaces and line breaks, then must match right there.
  [
    "scanf: a value must start where the input is (after spaces), not anywhere further on",
    1,
    `:h=E(a)+h,(g=j.match(new RegExp(h)))`,
    String.raw`:h=("."===c?"":"^\\s*")+E(a)+h,(g=j.match(new RegExp(h)))`,
  ],
  // The preprocessor split each line into names and other characters and
  // replaced every name that was a macro, even inside text, so after
  // #define DEBUG 1, printf("DEBUG x") printed "1 x". Real C never changes
  // the inside of a string or character literal.
  [
    "preprocessor: leave names inside \"text\" and 'c' alone when replacing macros",
    1,
    `Code:function(a,b,c){var d,e;if(a.doinclude[a.doinclude.length-1])for(d=0;d<b.val.length;)e=a.work(b.val[d]),a.ret+=e,d++}`,
    `Code:function(a,b,c){var d,e,s={q:0,c:0,x:0};if(a.doinclude[a.doinclude.length-1])for(d=0;d<b.val.length;)e=a.__workRaw(b.val[d],s),a.ret+=e,d++}`,
  ],
  [
    "preprocessor: the same inside the brackets of a call such as printf(...)",
    1,
    `if(!this.isMacroFunction(a)){for(d=a.Args,j=[],e=0;e<d.length;){for(k="",f=0;f<d[e].length;)k+=this.work(d[e][f]),f++;j.push(k),e++}return a.Identifier.val+"("+j.join(",")+")"+a.space}`,
    `if(!this.isMacroFunction(a)){for(d=a.Args,j=[],e=0,g={q:0,c:0,x:0};e<d.length;){for(k="",f=0;f<d[e].length;)k+=this.__workRaw(d[e][f],g),f++;j.push(k),e++}return a.Identifier.val+"("+j.join(",")+")"+a.space}`,
  ],
  [
    "preprocessor: a helper that replaces macros only outside text, tracking quotes across tokens",
    1,
    `e.prototype.work=function(a){`,
    String.raw`e.prototype.__workRaw=function(t,s){var r,k,ch;if(r=(s.q||s.c)&&"Identifier"===t.type?t.val+(t.space||""):this.work(t),"Seperator"!==t.type)s.x=0;else for(k=0;k<t.val.length;k++)ch=t.val[k],s.x?s.x=0:"\\"===ch&&(s.q||s.c)?s.x=1:'"'!==ch||s.c?"'"!==ch||s.q||(s.c=!s.c):s.q=!s.q;return r},e.prototype.work=function(a){`,
  ],
  [
    "string.h: strtok, which splits text at any of the given characters",
    1,
    `"global","strchr",[d,b.charTypeLiteral],d),`,
    `"global","strchr",[d,b.charTypeLiteral],d),b.regFunc(function(a,t,s,dl){var st,tg,p,set,start;if(set=a.getStringFromCharArray(dl),null!=s.v.target){a.isArrayType(s.t)||a.raiseException("strtok needs a char array it may change");a.__strtok={t:s.v.target,p:s.v.position}}st=a.__strtok;if(!st||!st.t)return a.val(d,a.nullPointerValue);for(tg=st.t,p=st.p;p<tg.length&&0!==tg[p].v&&set.indexOf(String.fromCharCode(tg[p].v))>=0;)p++;if(p>=tg.length||0===tg[p].v)return st.t=null,a.val(d,a.nullPointerValue);for(start=p;p<tg.length&&0!==tg[p].v&&set.indexOf(String.fromCharCode(tg[p].v))<0;)p++;p<tg.length&&0!==tg[p].v?(tg[p].v=0,st.p=p+1):st.p=p;return a.val(a.arrayPointerType(a.charTypeLiteral,tg.length),a.makeArrayPointerValue(tg,start))},"global","strtok",[d,d],d),`,
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
  "/* JSCPP (MIT, github.com/felixhao28/JSCPP), patched by scripts/patch-jscpp.mjs: stdin is pulled on demand; comparisons are 1 or 0; prototypes work; scanf fills array elements and reads %lf and %c; string.h and 2D initialisers fixed; pointers, malloc and structs work. */\n";
writeFileSync(TARGET, banner + text);
console.log(`Wrote ${TARGET} (${PATCHES.length} patches applied).`);
