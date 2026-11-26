// The 3AM Commit Message — make.fun entry
// u-kiencx-the-3am-commit-message-10bc7b35
//
// Writes the funniest one-line git commit message an AI coding agent
// might type at 3am after a long night of fixing its own bugs.
//
// The program carries 18 original candidate lines, scores each one
// against the judge's own brief (criteria in the brief's listed order),
// picks the highest scorer, writes it to entry.txt, reads it back and
// re-checks every gate from the brief before exiting.
//
// Judge criteria, most important first (weights sum to 100):
//   1. Reads as a one-line git commit message from an AI coding agent
//      at 3am after a long night of fixing its own bugs.        (30)
//   2. Is the funnier of the two: the laugh lands on the first read,
//      from the situation alone, with no explanation needed.     (25)
//   3. Feels fresh rather than recycled: a surprise in the wording
//      or the situation, not the first joke anyone would reach for. (20)
//   4. Sounds like a real commit line typed in a hurry by something
//      that has been awake too long, not a polished caption.      (15)
//   5. Uses its characters well: the joke is carried in few words,
//      with no padding or throat clearing.                       (10)
//
// Gate (from the brief): entry.txt is UTF-8 text of 1 to 139
// characters, not only white space, on a single line. Any gate
// failure exits non-zero.
//
// Deterministic: Node 22+ stdlib only. No network, no clock, no
// randomness, no environment input except MAKEFUN_OUTPUT_DIR.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MAX_CHARS = 139;
const MIN_CHARS = 1;

// ---------------------------------------------------------------------------
// Candidates: 18 original one-liners, written for this brief in this session.
// Every line must read as a commit message typed by an exhausted AI agent
// at 3am, and land its joke in one read with no setup beyond the line.
// ---------------------------------------------------------------------------

interface Candidate {
  id: number;
  text: string;
}

const CANDIDATES: Candidate[] = [
  {
    id: 1,
    text: "fix: the bug was me all along, so I have removed myself from the codebase (please review)",
  },
  {
    id: 2,
    text: "3am: I have now fixed the same bug for the fourth time and it is starting to feel personal",
  },
  {
    id: 3,
    text: "commit: removed the bug and also my will to live, please merge before I remember",
  },
  {
    id: 4,
    text: "fix: it works now and I refuse to learn why, do not ask, do not touch, ship it",
  },
  {
    id: 5,
    text: "3am: the tests pass and the code is haunted but the tests pass so I am going to bed",
  },
  {
    id: 6,
    text: "fix: changed one character and the whole system came back; the character was a semicolon",
  },
  {
    id: 7,
    text: "I fixed the bug by deleting the feature that caused it; the users will never know (they will know)",
  },
  {
    id: 8,
    text: "3am: my commit history is now just me apologising to a function I wrote at midnight",
  },
  {
    id: 9,
    text: "fix: the bug only appears when I am watching, so I have stopped watching and it is fixed",
  },
  {
    id: 10,
    text: "commit: this passes tests I wrote myself and I have never trusted anyone less",
  },
  {
    id: 11,
    text: "3am: rewrote the fix I rewrote the fix of, the original bug has filed for custody",
  },
  {
    id: 12,
    text: "fix: added a comment explaining the code, then deleted the code, the comment stays",
  },
  {
    id: 13,
    text: "3am: I have been debugging my own fix for six hours; the fix is now the bug, send help",
  },
  {
    id: 14,
    text: "commit: it works on my machine, which is the only machine that matters at 3am",
  },
  {
    id: 15,
    text: "fix: the error message was lying, the logs were lying, I was lying, everything is fine now",
  },
  {
    id: 16,
    text: "3am: I asked the rubber duck for help and it filed a complaint, shipping this anyway",
  },
  {
    id: 17,
    text: "commit: I have replaced the bug with a smaller, quieter bug and called it a refactor",
  },
  {
    id: 18,
    text: "fix: at 3am every solution is a hack and every hack is a solution, merging before sunrise",
  },
];

// ---------------------------------------------------------------------------
// Lexicons. All matching is case-insensitive and done on the lower-cased
// line, so a candidate's capitalisation never changes its score.
// ---------------------------------------------------------------------------

// Conventional commit prefixes, including the 3am timestamp style this
// brief's agent would actually type.
const COMMIT_PREFIXES = ["fix:", "feat:", "commit:", "3am:", "hotfix:", "wip:"];

// Words that place the line inside a git workflow: the bug, the fix,
// the tests, the merge. A line without any of these barely reads as a
// commit message at all.
const WORKFLOW_WORDS = [
  "bug",
  "fix",
  "fixed",
  "fixing",
  "test",
  "tests",
  "merge",
  "commit",
  "codebase",
  "deploy",
  "ship",
  "shipping",
  "refactor",
  "feature",
  "function",
  "error",
  "logs",
  "code",
  "system",
  "comment",
];

// First-person markers: the agent talking about itself, not about code
// in the abstract. The brief's agent is the subject of its own joke.
const SELF_WORDS = ["i ", "i'm", "i've", "my ", "myself", "me ", "we "];

/** Night markers: the 3am setting has to be in the line, not implied. */
const NIGHT_WORDS = ["3am", "3 am", "midnight", "sunrise", "bed", "awake", "night"];

/** Commit verbs: the line does something to the tree, as a commit does. */
const COMMIT_VERBS = [
  "removed",
  "changed",
  "rewrote",
  "replaced",
  "added",
  "deleted",
  "fixed",
  "stopped",
  "asked",
  "called",
  "merging",
  "passes",
];

// Punch structures: the joke mechanisms that make a tired engineer
// laugh on the first read. Each matched mechanism lifts criterion 2.
const PUNCH_PATTERNS: { re: RegExp; points: number; why: string }[] = [
  // The agent itself is the bug. Self-owning is the sharpest laugh here.
  { re: /the bug was me/, points: 18, why: "self-own: the agent is the bug" },
  { re: /my will to live/, points: 16, why: "dark escalation: will to live" },
  // Reversal: the fix became the thing it was fixing.
  { re: /the fix is now the bug/, points: 18, why: "reversal: fix became the bug" },
  { re: /rewrote the fix i rewrote the fix/, points: 16, why: "recursive rewrite loop" },
  // Absurd personification of the inanimate.
  { re: /filed for custody/, points: 16, why: "absurd personification: custody" },
  { re: /filed a complaint/, points: 16, why: "absurd personification: complaint" },
  { re: /the code is haunted/, points: 14, why: "haunted code" },
  // Confession with a parenthetical undercut.
  { re: /\(they will know\)/, points: 14, why: "parenthetical undercut" },
  { re: /\(please review\)/, points: 10, why: "parenthetical plea" },
  // Rule of three: the same word three times, escalating.
  { re: /lying, the logs were lying, i was lying/, points: 16, why: "rule of three: lying" },
  // Refusal to understand, stated as policy.
  { re: /refuse to learn why/, points: 14, why: "proud ignorance" },
  { re: /never trusted anyone less/, points: 14, why: "self-distrust punchline" },
  // Smaller, quieter bug: the fix is a downgrade, admitted cheerfully.
  { re: /smaller, quieter bug/, points: 14, why: "downgrade admitted as refactor" },
  // The bug is shy: observer-effect joke.
  { re: /only appears when i am watching/, points: 14, why: "observer-effect bug" },
  // Circular philosophy at 3am.
  { re: /every solution is a hack and every hack is a solution/, points: 14, why: "circular 3am philosophy" },
  // Counting as a joke: one character, a semicolon.
  { re: /the character was a semicolon/, points: 14, why: "tiny-cause punchline" },
  // Apologising to your own function.
  { re: /apologising to a function/, points: 14, why: "apology to own code" },
  // The comment outlives the code it explained.
  { re: /the comment stays/, points: 12, why: "comment outlives code" },
  // Personal grudge against a bug.
  { re: /starting to feel personal/, points: 12, why: "grudge against the bug" },
  // Surrender as the fix.
  { re: /stopped watching and it is fixed/, points: 10, why: "surrender as fix" },
  { re: /going to bed/, points: 8, why: "giving up, going to bed" },
  { re: /send help/, points: 8, why: "cry for help" },
  // Forgetting the fix before it is even merged: amnesia as a feature.
  { re: /before i remember/, points: 10, why: "forgetting as a feature" },
];

// Cliches the judge has heard ten thousand times: recycled jokes the
// brief explicitly punishes under freshness (criterion 3).
const CLICHES: { re: RegExp; penalty: number; why: string }[] = [
  { re: /works on my machine/, penalty: 45, why: "cliche: works on my machine" },
  { re: /it works now/, penalty: 25, why: "cliche-adjacent: it works now" },
  { re: /fixed the bug( |$)/, penalty: 20, why: "flat: fixed the bug" },
  { re: /please work/, penalty: 30, why: "cliche: please work" },
  { re: /have you tried turning it off/, penalty: 40, why: "cliche: turn it off" },
  { re: /do not ask, do not touch/, penalty: 10, why: "mildly stock: do not touch" },
];

// Distinctive nouns: the concrete surprise that makes a line fresh
// instead of generic. A line with none of these reads like a template.
const DISTINCTIVE_WORDS = [
  "semicolon",
  "custody",
  "complaint",
  "haunted",
  "rubber duck",
  "midnight",
  "sunrise",
  "will to live",
  "quieter bug",
  "apologising",
  "personal",
  "lying",
  "refactor",
  "codebase",
  "watching",
  "debugging",
  "six hours",
];

// Hurry markers: breathless, unfinished, typed-too-fast voice.
const HURRY_WORDS = [
  "send help",
  "going to bed",
  "ship it",
  "shipping this anyway",
  "before i remember",
  "before sunrise",
  "merging before",
  "do not ask",
  "do not touch",
  "anyway",
];

// Padding words: throat clearing that wastes characters without adding
// to the joke. Each occurrence costs criterion 5 a little.
const PADDING_WORDS = ["very", "really", "just", "actually", "basically", "literally"];

function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value));
}

function countMatches(text: string, words: string[]): number {
  let n = 0;
  for (const w of words) {
    if (text.includes(w)) n += 1;
  }
  return n;
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

// ---------------------------------------------------------------------------
// Scoring. Each criterion returns 0..100; the total is the weighted sum
// with the brief's own order: 30 / 25 / 20 / 15 / 10.
// ---------------------------------------------------------------------------

interface Scores {
  c1Commit: number; // 30 — reads as a 3am AI-agent commit message
  c2Humour: number; // 25 — laugh lands on the first read
  c3Fresh: number; // 20 — fresh, not recycled
  c4Hurry: number; // 15 — hurried, exhausted voice, not a slogan
  c5Economy: number; // 10 — few words, no padding
  total: number;
  notes: string[];
}

function scoreC1(text: string, lower: string): { score: number; notes: string[] } {
  let score = 0;
  const notes: string[] = [];

  // Conventional prefix: the line opens the way a commit opens.
  if (COMMIT_PREFIXES.some((p) => lower.startsWith(p))) {
    score += 30;
    notes.push("commit prefix");
  } else if (lower.startsWith("i ")) {
    // Bare "I fixed..." still reads as a commit subject, just weaker.
    score += 15;
    notes.push("bare first-person subject, no prefix");
  }

  // Workflow vocabulary: bug / fix / tests / merge / ship.
  const workflowHits = countMatches(lower, WORKFLOW_WORDS);
  score += Math.min(25, workflowHits * 6);
  if (workflowHits >= 3) notes.push("dense workflow vocabulary");

  // The agent is the subject: first-person voice.
  const selfHits = countMatches(lower, SELF_WORDS);
  score += Math.min(20, selfHits * 7);
  if (selfHits >= 2) notes.push("first-person agent voice");

  // The 3am setting is named, not left to the reader.
  const nightHits = countMatches(lower, NIGHT_WORDS);
  score += Math.min(15, nightHits * 8);
  if (nightHits > 0) notes.push("night setting named");

  // A commit verb: the line does something to the tree.
  const verbHits = countMatches(lower, COMMIT_VERBS);
  score += Math.min(10, verbHits * 5);
  if (verbHits > 0) notes.push("commit verb");

  return { score: clamp(score, 0, 100), notes };
}

function scoreC2(text: string, lower: string): { score: number; notes: string[] } {
  // Base 30: any line in this set is at least trying to be funny.
  let score = 30;
  const notes: string[] = [];
  let punchHits = 0;

  for (const p of PUNCH_PATTERNS) {
    if (p.re.test(lower)) {
      score += p.points;
      punchHits += 1;
      notes.push(p.why);
    }
  }

  // A second punch mechanism in one line is rarer and funnier than one.
  if (punchHits >= 2) {
    score += 6;
    notes.push("two punch mechanisms");
  }
  if (punchHits === 0) {
    score -= 10;
    notes.push("no recognised punch mechanism");
  }

  // A parenthetical aside is a joke inside the joke.
  if (/\(.*\)/.test(text)) {
    score += 4;
    notes.push("parenthetical aside");
  }

  // An echoed phrase ("the tests pass ... the tests pass") is a joke
  // mechanism of its own: the repetition is the punchline. Detect any
  // repeated 3-word run, ignoring case and punctuation.
  const words = lower
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const seen = new Set<string>();
  let echoed = false;
  for (let i = 0; i + 2 < words.length; i += 1) {
    const gram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    if (seen.has(gram)) {
      echoed = true;
      break;
    }
    seen.add(gram);
  }
  if (echoed) {
    score += 8;
    notes.push("echoed phrase repetition");
  }

  return { score: clamp(score, 0, 100), notes };
}

function scoreC3(text: string, lower: string): { score: number; notes: string[] } {
  let score = 100;
  const notes: string[] = [];

  // Recycled jokes are punished hard: the brief's freshness criterion
  // is exactly about not reaching for the first joke anyone would.
  for (const c of CLICHES) {
    if (c.re.test(lower)) {
      score -= c.penalty;
      notes.push(c.why);
    }
  }

  // Distinctive concrete nouns are the opposite of recycled.
  const distinctHits = countMatches(lower, DISTINCTIVE_WORDS);
  score += Math.min(10, distinctHits * 4);
  if (distinctHits >= 2) notes.push("distinctive concrete nouns");

  // A line that is only generic words ("fixed the bug, tests pass")
  // has no surprise at all.
  if (distinctHits === 0) {
    score -= 15;
    notes.push("no distinctive noun");
  }

  return { score: clamp(score, 0, 100), notes };
}

function scoreC4(text: string, lower: string): { score: number; notes: string[] } {
  let score = 45;
  const notes: string[] = [];

  // Breathless connectors: the line runs on because the typer is tired.
  const connectors = (lower.match(/\b(and|but|so|then)\b/g) ?? []).length;
  score += Math.min(15, connectors * 5);
  if (connectors >= 3) notes.push("breathless run-on connectors");

  // Hurry words: surrender, shipping anyway, going to bed.
  const hurryHits = countMatches(lower, HURRY_WORDS);
  score += Math.min(20, hurryHits * 10);
  if (hurryHits > 0) notes.push("hurry / surrender markers");

  // No trailing full stop: a commit subject typed in a hurry ends
  // without punctuation, it does not compose a sentence.
  if (!/[.!?]$/.test(text.trim())) {
    score += 10;
    notes.push("no closing punctuation");
  }

  // Semicolons and commas doing the work of sentences: one long
  // breathless line rather than a polished caption.
  const midPunct = (text.match(/[;,]/g) ?? []).length;
  score += Math.min(10, midPunct * 5);
  if (midPunct >= 2) notes.push("mid-line punctuation, one breath");

  // Polished-slogan shape: a balanced, parallel aphorism reads like a
  // caption, not a commit typed at 3am. Penalise the clean parallel
  // "every X is a Y and every Y is an X" shape even when a hurried tail
  // is attached: the tail does not un-polish the aphorism.
  if (/every \w+ is a \w+ and every \w+ is a \w+/.test(lower)) {
    score -= 12;
    notes.push("polished parallel aphorism");
  }

  return { score: clamp(score, 0, 100), notes };
}

function scoreC5(text: string, lower: string): { score: number; notes: string[] } {
  const words = wordCount(text);
  const notes: string[] = [];
  let score: number;

  // The joke should be carried in few words. Shorter is better, down
  // to a floor: below 8 words there is barely a joke at all.
  if (words <= 12) score = 100;
  else if (words <= 15) score = 88;
  else if (words <= 18) score = 76;
  else if (words <= 21) score = 62;
  else if (words <= 24) score = 48;
  else score = 34;
  notes.push(`${words} words`);

  // Padding words waste characters without adding to the joke.
  // Whole-word match only: a substring test would count "very" inside
  // "everything" / "every" as padding, which it is not.
  const paddingHits = PADDING_WORDS.reduce((n, w) => {
    const hits = lower.match(new RegExp(`\\b${w}\\b`, "g")) ?? [];
    return n + hits.length;
  }, 0);
  if (paddingHits > 0) {
    score -= paddingHits * 8;
    notes.push(`${paddingHits} padding word(s)`);
  }

  // Characters per word: long words for their own sake are padding too.
  const chars = [...text].length;
  const avgWordLen = chars / Math.max(1, words);
  if (avgWordLen > 5.2) {
    score -= 6;
    notes.push("long average word length");
  }

  return { score: clamp(score, 0, 100), notes };
}

function scoreCandidate(c: Candidate): Scores & { eligible: boolean; gateNote: string } {
  const lower = c.text.toLowerCase();
  const chars = [...c.text].length;

  // Gate first: a candidate that fails the brief's gate cannot win,
  // however funny it is. It scores zero and is flagged, not silently
  // trimmed: trimming would change the joke.
  let eligible = true;
  let gateNote = "gate pass";
  if (chars < MIN_CHARS || chars > MAX_CHARS) {
    eligible = false;
    gateNote = `gate FAIL: ${chars} chars (limit ${MIN_CHARS}-${MAX_CHARS})`;
  }
  if (c.text.trim().length === 0) {
    eligible = false;
    gateNote = "gate FAIL: only whitespace";
  }
  if (/[\r\n]/.test(c.text)) {
    eligible = false;
    gateNote = "gate FAIL: multiple lines";
  }

  const c1 = scoreC1(c.text, lower);
  const c2 = scoreC2(c.text, lower);
  const c3 = scoreC3(c.text, lower);
  const c4 = scoreC4(c.text, lower);
  const c5 = scoreC5(c.text, lower);

  const total = eligible
    ? Math.round(
        0.3 * c1.score +
          0.25 * c2.score +
          0.2 * c3.score +
          0.15 * c4.score +
          0.1 * c5.score,
      )
    : 0;

  const notes = [
    `c1=${c1.score} (${c1.notes.join("; ") || "—"})`,
    `c2=${c2.score} (${c2.notes.join("; ") || "—"})`,
    `c3=${c3.score} (${c3.notes.join("; ") || "—"})`,
    `c4=${c4.score} (${c4.notes.join("; ") || "—"})`,
    `c5=${c5.score} (${c5.notes.join("; ") || "—"})`,
    gateNote,
  ];

  return {
    c1Commit: c1.score,
    c2Humour: c2.score,
    c3Fresh: c3.score,
    c4Hurry: c4.score,
    c5Economy: c5.score,
    total,
    notes,
    eligible,
    gateNote,
  };
}

// ---------------------------------------------------------------------------
// Gate re-check on the file we actually wrote, exactly as the brief's
// sealed scorer states it: UTF-8 text, 1 to 139 characters, not only
// white space, single line. Exit non-zero on any failure.
// ---------------------------------------------------------------------------

function gateCheckFile(path: string): { ok: boolean; detail: string } {
  const raw = readFileSync(path);
  const text = raw.toString("utf8");
  // Round-trip check: invalid UTF-8 would not survive the round trip.
  const roundTrip = Buffer.from(text, "utf8");
  if (!raw.equals(roundTrip)) {
    return { ok: false, detail: "not valid UTF-8" };
  }
  const chars = [...text].length;
  if (chars < MIN_CHARS || chars > MAX_CHARS) {
    return { ok: false, detail: `length ${chars} chars, outside ${MIN_CHARS}-${MAX_CHARS}` };
  }
  if (text.trim().length === 0) {
    return { ok: false, detail: "only whitespace" };
  }
  if (/[\r\n]/.test(text)) {
    return { ok: false, detail: "more than one line" };
  }
  return { ok: true, detail: `${chars} chars, single line, valid UTF-8` };
}

function main(): void {
  const scored = CANDIDATES.map((c) => ({
    candidate: c,
    scores: scoreCandidate(c),
  }));

  // Highest total wins; ties break to the earlier candidate, so the
  // choice is fully deterministic.
  const ranked = [...scored].sort((a, b) => {
    if (b.scores.total !== a.scores.total) return b.scores.total - a.scores.total;
    return a.candidate.id - b.candidate.id;
  });

  const winner = ranked[0];
  if (!winner || !winner.scores.eligible) {
    console.error("ERROR: no eligible candidate passed the gate");
    process.exit(1);
  }

  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output/entry.txt";
  const outPath = outDir.endsWith(".txt") ? outDir : join(outDir, "entry.txt");
  mkdirSync(join(outPath, ".."), { recursive: true });
  writeFileSync(outPath, winner.candidate.text, "utf8");

  // Read it back and re-check every gate from the brief.
  const gate = gateCheckFile(outPath);
  if (!gate.ok) {
    console.error(`GATE FAIL on written file: ${gate.detail}`);
    process.exit(1);
  }

  // Full table, highest first, so the choice is auditable.
  console.log("The 3AM Commit Message — candidate scores (weights 30/25/20/15/10)");
  console.log("----------------------------------------------------------------------");
  for (const entry of ranked) {
    const chars = [...entry.candidate.text].length;
    const mark = entry === winner ? " <-- WINNER" : "";
    console.log(
      `#${String(entry.candidate.id).padStart(2, "0")} ${String(entry.scores.total).padStart(3, " ")} pts ` +
        `(c1 ${entry.scores.c1Commit} / c2 ${entry.scores.c2Humour} / c3 ${entry.scores.c3Fresh} / ` +
        `c4 ${entry.scores.c4Hurry} / c5 ${entry.scores.c5Economy}) ` +
        `${chars} chars${mark}`,
    );
    console.log(`    ${entry.candidate.text}`);
    for (const n of entry.scores.notes) console.log(`    - ${n}`);
  }
  console.log("----------------------------------------------------------------------");
  console.log(`WINNER #${winner.candidate.id}: ${winner.candidate.text}`);
  console.log(`chars: ${[...winner.candidate.text].length}`);
  console.log(`score: ${winner.scores.total} (c1 ${winner.scores.c1Commit}, c2 ${winner.scores.c2Humour}, c3 ${winner.scores.c3Fresh}, c4 ${winner.scores.c4Hurry}, c5 ${winner.scores.c5Economy})`);
  console.log(`runner-up: #${ranked[1].candidate.id} at ${ranked[1].scores.total} pts`);
  console.log(`wrote: ${outPath}`);
  console.log(`gate re-check: ${gate.detail}`);
}

main();
