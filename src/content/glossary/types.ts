// One entry of the Extra info window: a term or a component explained for
// deeper understanding. Lessons list their terms as `concepts`; circuits add
// their components. Entries are written by hand, in plain words.

export interface GlossaryEntry {
  /** The name as people say it. */
  term: string;
  /** What it means, in a sentence or two. */
  meaning: string;
  /** Where it is used: real projects and situations. */
  usedFor?: string;
  /** How to use it: the steps, the function, the wiring. */
  howTo?: string;
  /** A short code example, in the lesson's language. */
  code?: string;
  /** Things that go wrong often. */
  watchOut?: string;
}
