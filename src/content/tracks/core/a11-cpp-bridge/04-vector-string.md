---
id: core.cpp.vector-string
kind: lesson
track: core
unit: a11
order: 4
title: vector and string
titleKid: Lists and words that grow by themselves
language: cpp
concepts: [vector, string, push-back, range-for, standard-library]
prereqs: [core.cpp.classes, core.c.arrays, core.c.strings]
links:
  - to: core.c.malloc
    kind: contrast
    note: In C, a list that grows needs malloc, realloc and free; vector does it for you.
est_minutes: 16
checks:
  - type: io-cases
    cases:
      - stdin: ["relay", "servo", "potentiometer", "led", "end"]
        expect: "4 words\nLongest: potentiometer (13 letters)\nBackwards: led potentiometer servo relay\n"
      - stdin: ["motor", "end"]
        expect: "1 words\nLongest: motor (5 letters)\nBackwards: motor\n"
      - stdin: ["ab", "cd", "e", "end"]
        expect: "3 words\nLongest: ab (2 letters)\nBackwards: e cd ab\n"
  - type: code-contains
    pattern: 'vector\s*<\s*string\s*>'
    message: 'Keeps the words in a vector<string>'
hints:
  - 'In the loop, add each word to the end of the list with words.push_back(word);'
  - 'For the longest, go through the list and remember the first word whose length() is bigger than the best so far.'
  - 'For backwards, count down: for (int i = words.size() - 1; i >= 0; i--) and print words[i] with a space before every word but the first.'
hintsKid:
  - 'Add each word to the list with `push_back`.'
  - 'Find the word with the biggest `length()`.'
  - 'Print the list from the last word to the first.'
---
In C, a list of values is an array of fixed size, and text is a `char` array ending in `'\0'`, with `strcpy`, `strlen` and enough room to think about. C++'s standard library offers two classes that look after all of that themselves: `vector` for lists and `string` for text.

## string

```cpp
#include <string>

string name = "Pump";
name = name + " 2";               // joining with +
cout << name.length() << endl;    // 6
if (name == "Pump 2") { ... }     // comparing with ==
cout << name[0] << endl;          // P: one character
cout << name.substr(0, 4) << endl;        // "Pump": 4 characters from position 0
cout << name.find("2") << endl;           // 5: where "2" starts
```

A `string` grows as needed, so there is no size to choose and no way to write past its end by joining. `==`, `<` and `+` work as you would expect, which `char` arrays never did. `getline(cin, line)` reads a whole line into a string.

## vector

A `vector` is a list that grows. The type of its values goes in angle brackets:

```cpp
#include <vector>

vector<int> readings;          // empty
readings.push_back(21);        // add to the end
readings.push_back(23);
cout << readings.size() << endl;     // 2
cout << readings[0] << endl;         // 21
readings[1] = 24;                    // change one

vector<double> gains = {1.5, 0.2, 0.05};   // with starting values
```

`push_back` adds at the end, making room as needed. `size()` says how many values there are, so it never has to be passed around separately as with C arrays. The memory is freed automatically when the vector is no longer used: no `malloc`, no `free`.

## Going through a vector

The **range-based for loop** visits every value without an index:

```cpp
int total = 0;
for (int value : readings) {
    total += value;
}
```

When you need the position, use an ordinary `for` loop with `i < readings.size()`.

## Safety

`readings[i]` with a bad position is as dangerous as in C. `readings.at(i)` checks the position and stops the program when it is outside the vector, which is often worth the small cost while learning.

## Passing to functions

Pass a vector or string that the function only reads as a `const` reference (lesson 2), so it is not copied: `double average(const vector<int> &values)`.

::: kid
A vector is a list that grows by itself.

Add things to the end with `push_back`.

It always knows how many things it holds.

A string is a word that grows by itself too.

You can join words with `+` and compare them with `==`.
:::

```cpp {role=example file=log.cpp}
#include <iostream>
#include <string>
#include <vector>
using namespace std;

double average(const vector<double> &values) {
    double total = 0;
    for (double value : values) {
        total += value;
    }
    return total / values.size();
}

int main() {
    vector<double> temps = {21.5, 22.0, 23.5};
    temps.push_back(19.0);

    string report = "Temps:";
    for (double t : temps) {
        report += " " + to_string(int(t));
    }
    cout << report << endl;
    cout << temps.size() << " readings, average " << average(temps) << endl;

    string part = "servo-motor";
    cout << part.substr(0, part.find("-")) << " has " << part.length() << " characters" << endl;
    return 0;
}
```

::: try
The program reads words, one per line, until it reads `end`. Keep them in a `vector<string>`, then print how many there are, the longest one with its number of letters (the first one if several tie), and all the words in reverse order, separated by spaces.
:::

::: try-kid
Keep every word in a growing list.

Say how many words there are.

Find the longest one.

Then print the list backwards.
:::

```cpp {role=starter file=words.cpp}
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    vector<string> words;
    string word;

    cin >> word;
    while (word != "end") {
        // Keep the word.
        cin >> word;
    }

    cout << words.size() << " words" << endl;
    // Print the longest word and the words backwards.

    return 0;
}
```

```cpp {role=solution file=words.cpp}
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    vector<string> words;
    string word;

    cin >> word;
    while (word != "end") {
        words.push_back(word);
        cin >> word;
    }

    cout << words.size() << " words" << endl;

    string longest = words[0];
    for (const string &w : words) {
        if (w.length() > longest.length()) {
            longest = w;
        }
    }
    cout << "Longest: " << longest << " (" << longest.length() << " letters)" << endl;

    cout << "Backwards:";
    for (int i = words.size() - 1; i >= 0; i--) {
        cout << " " << words[i];
    }
    cout << endl;
    return 0;
}
```
