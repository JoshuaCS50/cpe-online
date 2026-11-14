// The four tracks and their units. Lessons name a unit by id; the lesson
// check fails on a unit that is not listed here.

import type { TrackId } from "./schema";

export interface Unit {
  id: string;
  title: string;
  titleKid: string;
}

export interface Track {
  id: TrackId;
  title: string;
  titleKid: string;
  blurb: string;
  units: Unit[];
}

export const TRACKS: readonly Track[] = [
  {
    id: "core",
    title: "Core programming",
    titleKid: "Learn to code",
    blurb: "C, C++ and Python, and how to think like a developer.",
    units: [
      { id: "a1", title: "Thinking like a developer", titleKid: "Think in small steps" },
      { id: "a2", title: "First C program", titleKid: "Your first program" },
      { id: "a3", title: "Decisions", titleKid: "Making choices" },
      { id: "a4", title: "Loops", titleKid: "Doing things again" },
      { id: "a5", title: "Functions", titleKid: "Little helpers" },
      { id: "a6", title: "Arrays and strings", titleKid: "Rows of boxes" },
      { id: "a7", title: "Algorithms", titleKid: "Clever recipes" },
      { id: "a8", title: "Memory", titleKid: "Where things live" },
      { id: "a9", title: "Data structures", titleKid: "Ways to keep things" },
      { id: "a10", title: "Files and input", titleKid: "Reading and saving" },
      { id: "a11", title: "C++ bridge", titleKid: "From C to C++" },
      { id: "a12", title: "Python", titleKid: "Python" },
      { id: "a13", title: "Software habits", titleKid: "Good habits" },
      { id: "a14", title: "Debugging", titleKid: "Bug hunting" },
    ],
  },
  {
    id: "embedded",
    title: "Arduino and embedded",
    titleKid: "Tiny computers",
    blurb: "Pins, sensors and timing on Arduino and PIC boards.",
    units: [
      { id: "b1", title: "Meet the board", titleKid: "Meet your tiny computer" },
      { id: "b2", title: "Digital pins", titleKid: "Lights and buttons" },
      { id: "b3", title: "Analog input", titleKid: "Measuring with sensors" },
      { id: "b4", title: "PWM", titleKid: "Dimming and turning" },
      { id: "b5", title: "Timing", titleKid: "Keeping time" },
      { id: "b6", title: "Interrupts", titleKid: "Drop everything!" },
      { id: "b7", title: "PIC bridge", titleKid: "Another tiny computer" },
      { id: "b8", title: "Communication", titleKid: "Boards that talk" },
      { id: "b9", title: "Putting it together", titleKid: "Build a machine" },
      { id: "b10", title: "Debugging the board", titleKid: "Fixing the board" },
    ],
  },
  {
    id: "plc",
    title: "PLC, HMI and networks",
    titleKid: "Factory brains",
    blurb: "Ladder logic, operator screens and industrial networks.",
    units: [],
  },
  {
    id: "control",
    title: "Control systems",
    titleKid: "Keeping things steady",
    blurb: "How systems respond, and how to tune a controller.",
    units: [],
  },
];

export function findTrack(id: string): Track | undefined {
  return TRACKS.find((track) => track.id === id);
}

export function findUnit(trackId: string, unitId: string): Unit | undefined {
  return findTrack(trackId)?.units.find((unit) => unit.id === unitId);
}

/** Reading order: by track, then unit as listed in tracks.ts, then order. */
export function sortLessons<T extends { track: string; unit: string; order: number; id: string }>(lessons: readonly T[]): T[] {
  const trackIndex = (item: T): number => TRACKS.findIndex((track) => track.id === item.track);
  const unitIndex = (item: T): number => findTrack(item.track)?.units.findIndex((unit) => unit.id === item.unit) ?? -1;
  return [...lessons].sort(
    (a, b) => trackIndex(a) - trackIndex(b) || unitIndex(a) - unitIndex(b) || a.order - b.order || a.id.localeCompare(b.id),
  );
}
