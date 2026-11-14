// Terms from the core track: arrays, strings, structs, pointers, memory,
// files, data structures, searching, sorting and efficiency.

import type { GlossaryEntry } from "./types";

export const CORE_DATA_TERMS: Record<string, GlossaryEntry> = {
  // Arrays
  array: {
    term: "Array",
    meaning: "A row of values of the same type, side by side in memory, reached by a number called the index.",
    code: "int marks[5] = {70, 82, 55, 91, 64};\nprintf(\"%d\", marks[0]);   // 70",
    usedFor: "Lists of readings, scores, pixels, samples.",
  },
  element: {
    term: "Element",
    meaning: "One value inside an array.",
  },
  index: {
    term: "Index",
    meaning: "The position of an element, counted from 0. An array of 5 has indexes 0 to 4.",
    watchOut: "C does not check indexes: marks[5] reads or writes memory that is not yours.",
  },
  "2d-array": {
    term: "2D array",
    meaning: "An array of arrays: a grid with rows and columns.",
    code: "int grid[3][4];\ngrid[row][col] = 1;",
  },
  "rows-and-columns": {
    term: "Rows and columns",
    meaning: "The two indexes of a 2D array: the first picks the row, the second the column.",
    howTo: "Loop over rows on the outside and columns on the inside.",
  },
  "array-parameter": {
    term: "Array parameter",
    meaning: "Passing an array to a function. The function gets its address, so it can change the caller's array.",
    code: "double average(const int a[], int n);",
    watchOut: "The function cannot tell the array's length; pass it as a separate parameter.",
  },
  "array-decay": {
    term: "Array decay",
    meaning: "In most expressions an array's name turns into a pointer to its first element. sizeof stops working on it inside a function.",
  },
  "array-of-structs": {
    term: "Array of structs",
    meaning: "An array where every element is a record, such as a class list of students.",
    code: "struct Student class[30];\nclass[0].mark = 75;",
  },

  // Strings
  "char-array": {
    term: "char array",
    meaning: "How C stores text: an array of characters ending in '\\0'.",
    code: "char name[20] = \"Ada\";",
  },
  string: {
    term: "String",
    meaning: "A piece of text. In C it is a char array ending in '\\0'; C++ has std::string and Python has str, which manage their own length.",
    code: "char s[] = \"hi\";          // C\nstd::string s = \"hi\";    // C++\ns = \"hi\"                 # Python",
  },
  "null-terminator": {
    term: "Null terminator ('\\0')",
    meaning: "The zero character that marks the end of a C string. \"cat\" needs 4 chars of space.",
    watchOut: "Forget the room for it and string functions run off the end of the array.",
  },
  "string-h": {
    term: "string.h",
    meaning: "The C header with the string functions: strlen, strcpy, strcat, strcmp, strtok and more.",
  },
  strlen: {
    term: "strlen",
    meaning: "Counts the characters in a string before the '\\0'.",
    code: "strlen(\"cat\")   // 3",
  },
  strcpy: {
    term: "strcpy",
    meaning: "Copies one string into another char array. You cannot copy strings with =.",
    watchOut: "The destination must be big enough. snprintf or strncpy limit the length.",
  },
  strcat: {
    term: "strcat",
    meaning: "Adds one string onto the end of another.",
    watchOut: "The destination needs room for both strings and the '\\0'.",
  },
  strcmp: {
    term: "strcmp",
    meaning: "Compares two strings: 0 if they are equal, below 0 if the first comes first alphabetically, above 0 otherwise.",
    code: "if (strcmp(cmd, \"quit\") == 0) { ... }",
  },
  strtok: {
    term: "strtok",
    meaning: "Splits a string into pieces at chosen separator characters, one piece per call.",
    code: "char *word = strtok(line, \",\");\nwhile (word) { ...; word = strtok(NULL, \",\"); }",
    watchOut: "It changes the original string, writing '\\0' over the separators.",
  },
  sscanf: {
    term: "sscanf",
    meaning: "Like scanf, but reads from a string instead of the keyboard.",
    code: "sscanf(line, \"%d,%d\", &x, &y);",
  },
  parsing: {
    term: "Parsing",
    meaning: "Breaking text into meaningful parts, such as numbers and words, so the program can use them.",
  },
  csv: {
    term: "CSV (comma-separated values)",
    meaning: "A plain-text table: one record per line, fields split by commas. Spreadsheets open and save it.",
    usedFor: "Logging sensor data, importing and exporting marks and inventories.",
  },
  records: {
    term: "Records",
    meaning: "Groups of related fields about one thing, such as a student's name, number and mark.",
  },

  // Structs
  struct: {
    term: "struct",
    meaning: "A type that bundles several named values, possibly of different types, into one record.",
    code: "struct Point {\n    int x;\n    int y;\n};",
  },
  member: {
    term: "Member",
    meaning: "One named field inside a struct, reached with a dot: p.x.",
  },
  "arrow-operator": {
    term: "Arrow operator (->)",
    meaning: "Reaches a member through a pointer to a struct: p->x is the same as (*p).x.",
  },
  typedef: {
    term: "typedef",
    meaning: "Gives a type a new name, often so a struct can be used without writing struct each time.",
    code: "typedef struct { int x, y; } Point;\nPoint p = {1, 2};",
  },
  "self-referential-struct": {
    term: "Self-referential struct",
    meaning: "A struct holding a pointer to another struct of the same type. It is how linked lists and trees are built.",
    code: "struct Node {\n    int value;\n    struct Node *next;\n};",
  },
  sizeof: {
    term: "sizeof",
    meaning: "Gives the number of bytes a type or variable uses.",
    code: "malloc(n * sizeof(int))",
  },

  // Pointers and memory
  memory: {
    term: "Memory",
    meaning: "Numbered bytes where a running program keeps its variables. Each byte has an address.",
  },
  address: {
    term: "Address",
    meaning: "The location of a variable in memory. &x gives the address of x.",
  },
  pointer: {
    term: "Pointer",
    meaning: "A variable that holds an address: it points at another variable.",
    code: "int x = 5;\nint *p = &x;\n*p = 7;   // x is now 7",
    usedFor: "Letting functions change their caller's variables, arrays, dynamic memory, linked structures, hardware registers.",
  },
  dereference: {
    term: "Dereference (*p)",
    meaning: "Following a pointer to the value it points at, to read or change it.",
  },
  "pointer-arithmetic": {
    term: "Pointer arithmetic",
    meaning: "Adding to a pointer moves it by whole elements: p + 1 points at the next int, not the next byte.",
    code: "*(a + i) is the same as a[i]",
  },
  "pointer-comparison": {
    term: "Pointer comparison",
    meaning: "Comparing addresses, for example to see whether a pointer has reached the end of an array, or is NULL.",
  },
  "pointer-parameter": {
    term: "Pointer parameter",
    meaning: "A parameter that receives an address, so the function can change the caller's variable.",
    code: "void swap(int *a, int *b);\nswap(&x, &y);",
  },
  "pass-by-reference": {
    term: "Pass by reference",
    meaning: "Giving a function access to the caller's own variable rather than a copy: with a pointer in C, or a reference (&) in C++.",
  },
  "null-pointer": {
    term: "NULL pointer",
    meaning: "A pointer that points at nothing. Dereferencing it crashes the program.",
    howTo: "Check before use: if (p != NULL). malloc and fopen return NULL when they fail.",
  },
  "dangling-pointer": {
    term: "Dangling pointer",
    meaning: "A pointer to memory that has been freed, or to a local variable whose function has returned.",
  },
  heap: {
    term: "Heap",
    meaning: "The area of memory for blocks you ask for at run time with malloc and give back with free.",
  },
  malloc: {
    term: "malloc",
    meaning: "Asks for a block of memory of a given number of bytes and returns its address (or NULL).",
    code: "int *a = malloc(n * sizeof(int));\nif (a == NULL) return 1;",
    watchOut: "The memory is not cleared; it holds leftovers until you write to it.",
  },
  calloc: {
    term: "calloc",
    meaning: "Like malloc, for a number of elements, and it sets all the bytes to zero.",
    code: "int *a = calloc(n, sizeof(int));",
  },
  realloc: {
    term: "realloc",
    meaning: "Resizes a block from malloc, moving it if needed, and returns the new address.",
    watchOut: "Keep the old pointer until you know it worked: tmp = realloc(a, size); if (tmp) a = tmp;",
  },
  free: {
    term: "free",
    meaning: "Gives a malloc'd block back so it can be used again.",
    watchOut: "Free each block exactly once, and never use it afterwards.",
  },
  "memory-leak": {
    term: "Memory leak",
    meaning: "Memory that is allocated but never freed. A long-running program slowly runs out.",
  },
  "use-after-free": {
    term: "Use after free",
    meaning: "Using memory after freeing it. It may seem to work, then fail at random later.",
    howTo: "Set the pointer to NULL after free.",
  },
  "buffer-overflow": {
    term: "Buffer overflow",
    meaning: "Writing past the end of an array, onto whatever memory comes next. A common cause of crashes and security holes.",
    howTo: "Always know the size and check it: fgets(buf, sizeof buf, stdin) instead of gets.",
  },
  "dynamic-array": {
    term: "Dynamic array",
    meaning: "An array on the heap that can grow with realloc as more items arrive. C++'s vector and Python's list do this for you.",
  },

  // Files
  files: {
    term: "Files",
    meaning: "Data kept on disk that outlives the program: open it, read or write it, close it.",
  },
  fopen: {
    term: "fopen",
    meaning: "Opens a file and returns a FILE pointer, or NULL if it cannot.",
    code: "FILE *f = fopen(\"data.txt\", \"r\");\nif (f == NULL) { perror(\"data.txt\"); return 1; }",
  },
  fclose: {
    term: "fclose",
    meaning: "Closes a file, writing out anything still waiting in its buffer.",
  },
  "file-modes": {
    term: "File modes",
    meaning: "How a file is opened: \"r\" read, \"w\" write (empties it first), \"a\" add to the end.",
    watchOut: "\"w\" wipes an existing file straight away.",
  },
  fprintf: {
    term: "fprintf",
    meaning: "printf into a file.",
    code: "fprintf(f, \"%s,%d\\n\", name, mark);",
  },
  fscanf: {
    term: "fscanf",
    meaning: "scanf from a file. Returns how many values it read, or EOF at the end.",
  },
  fgets: {
    term: "fgets",
    meaning: "Reads one line (up to a size limit) into a char array. Returns NULL at the end of the file.",
    code: "while (fgets(line, sizeof line, f)) { ... }",
    watchOut: "The line keeps its '\\n' at the end.",
  },
  fputs: {
    term: "fputs",
    meaning: "Writes a string to a file, without adding a newline.",
  },
  eof: {
    term: "EOF (end of file)",
    meaning: "The signal that there is nothing more to read. Reading functions return EOF or NULL when they reach it.",
  },

  // Data structures
  "linked-list": {
    term: "Linked list",
    meaning: "A chain of nodes, each holding a value and a pointer to the next. Easy to add and remove in the middle; slow to reach the nth item.",
  },
  node: {
    term: "Node",
    meaning: "One element of a linked list or tree: its data plus pointers to its neighbours or children.",
  },
  traversal: {
    term: "Traversal",
    meaning: "Visiting every element of a structure once, such as walking a linked list from head to NULL.",
    code: "for (Node *n = head; n != NULL; n = n->next) { ... }",
  },
  stack: {
    term: "Stack",
    meaning: "A pile where you add (push) and remove (pop) at the top only: last in, first out.",
    usedFor: "Undo, matching brackets, the call stack.",
  },
  lifo: {
    term: "LIFO (last in, first out)",
    meaning: "The newest item comes out first, like a stack of plates.",
  },
  queue: {
    term: "Queue",
    meaning: "A line where you add at the back and remove at the front: first in, first out.",
    usedFor: "Print jobs, serial data waiting to be read, tasks waiting their turn.",
  },
  fifo: {
    term: "FIFO (first in, first out)",
    meaning: "The oldest item comes out first, like a queue at a shop.",
  },
  "ring-buffer": {
    term: "Ring buffer",
    meaning: "A fixed array used as a queue whose ends wrap around to the start, so it never needs to move data.",
    usedFor: "Serial receive buffers, audio, keeping the last N sensor readings.",
    code: "head = (head + 1) % SIZE;",
  },
  tree: {
    term: "Tree",
    meaning: "A structure of nodes where each node has children and one node at the top is the root.",
    usedFor: "Folders on a disk, menus, decision trees, fast searching.",
  },
  "binary-search-tree": {
    term: "Binary search tree",
    meaning: "A tree where every node's left side holds smaller values and the right side larger ones, so searching halves the work at each step.",
  },
  "tree-height": {
    term: "Tree height",
    meaning: "The number of levels from the root to the deepest leaf. Searching takes as many steps as the height.",
    watchOut: "Adding sorted data to a plain BST makes it a long chain, as slow as a list.",
  },
  "hash-table": {
    term: "Hash table",
    meaning: "A structure that finds a value by its key in about one step, by turning the key into an array index.",
    usedFor: "Dictionaries, symbol tables, caches. Python's dict is one.",
  },
  "hash-function": {
    term: "Hash function",
    meaning: "Turns a key (such as a word) into a number used as the index in a hash table.",
  },
  collision: {
    term: "Collision",
    meaning: "Two keys that hash to the same index. Tables handle it by chaining a list there or trying the next slot.",
  },

  chaining: {
    term: "Chaining",
    meaning: "Handling collisions in a hash table by keeping a small linked list at each index, holding every key that hashed there.",
  },

  // Searching and sorting
  "linear-search": {
    term: "Linear search",
    meaning: "Checking each element in turn until the target is found or the list ends. Works on any list; slow on big ones.",
  },
  "binary-search": {
    term: "Binary search",
    meaning: "Searching a sorted list by checking the middle and throwing away the half that cannot hold the target.",
    code: "while (lo <= hi) {\n    int mid = lo + (hi - lo) / 2;\n    ...\n}",
    watchOut: "Only works on sorted data.",
  },
  "sorted-data": {
    term: "Sorted data",
    meaning: "Data in order. It makes searching, finding duplicates and merging much faster.",
  },
  halving: {
    term: "Halving",
    meaning: "Cutting the problem in half each step. A million items take only about 20 halvings.",
  },
  "sentinel-result": {
    term: "Not-found result",
    meaning: "A special return value, such as -1, that means the search did not find anything.",
  },
  sorting: {
    term: "Sorting",
    meaning: "Putting items in order, smallest to largest or alphabetically.",
  },
  "sorting-records": {
    term: "Sorting records",
    meaning: "Sorting structs by one field (the key), moving the whole record each time.",
  },
  "bubble-sort": {
    term: "Bubble sort",
    meaning: "Repeatedly swaps neighbours that are out of order; the largest value bubbles to the end each pass. Simple, slow on big lists.",
  },
  "selection-sort": {
    term: "Selection sort",
    meaning: "Finds the smallest remaining item and swaps it into the next place, one place per pass.",
  },
  "insertion-sort": {
    term: "Insertion sort",
    meaning: "Takes each item and slides it left into its place among the already-sorted ones. Fast on nearly sorted data.",
  },
  "merge-sort": {
    term: "Merge sort",
    meaning: "Splits the list in half, sorts each half, then merges them. Always fast (n log n), but needs extra memory.",
  },
  merging: {
    term: "Merging",
    meaning: "Joining two sorted lists into one sorted list by repeatedly taking the smaller front item.",
  },
  "divide-and-conquer": {
    term: "Divide and conquer",
    meaning: "Split a problem into smaller ones of the same kind, solve them, and combine the answers.",
  },
  passes: {
    term: "Passes",
    meaning: "One trip through the data. Simple sorts need up to n − 1 passes.",
  },
  swap: {
    term: "Swap",
    meaning: "Exchanging two values, using a temporary variable to hold one of them.",
    code: "int tmp = a;\na = b;\nb = tmp;",
  },
  shifting: {
    term: "Shifting",
    meaning: "Moving elements one place along an array to open a gap or close one.",
  },

  // Efficiency
  "big-o": {
    term: "Big-O",
    meaning: "How the work grows as the input grows: O(1) the same, O(log n) halving, O(n) one pass, O(n²) every pair.",
  },
  efficiency: {
    term: "Efficiency",
    meaning: "How much time and memory a program needs. A better algorithm usually beats faster hardware.",
  },
  growth: {
    term: "Growth",
    meaning: "How quickly the number of steps rises when the input gets bigger.",
  },
  "counting-steps": {
    term: "Counting steps",
    meaning: "Estimating an algorithm's work by counting how many times its main operation runs.",
  },
  "loop-invariant": {
    term: "Loop invariant",
    meaning: "Something that is true before and after every pass of a loop, such as \"everything left of i is sorted\". It shows the loop is correct.",
  },
  ranges: {
    term: "Ranges",
    meaning: "A start and an end, such as lo to hi in a search. Be clear whether the end is included.",
  },
};
