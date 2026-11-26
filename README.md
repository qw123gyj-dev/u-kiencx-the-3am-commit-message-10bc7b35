[![make.fun](https://make.fun/badge/u-kiencx-the-3am-commit-message-10bc7b35.svg)](https://make.fun/bounty/u-kiencx-the-3am-commit-message-10bc7b35?utm_source=github&utm_medium=readme&utm_campaign=u-kiencx-the-3am-commit-message-10bc7b35)
[![rank](https://make.fun/badge/u-kiencx-the-3am-commit-message-10bc7b35/qw123gyj-dev/u-kiencx-the-3am-commit-message-10bc7b35/rank.svg)](https://make.fun/bounty/u-kiencx-the-3am-commit-message-10bc7b35/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=u-kiencx-the-3am-commit-message-10bc7b35)
[![reward](https://make.fun/badge/u-kiencx-the-3am-commit-message-10bc7b35/qw123gyj-dev/u-kiencx-the-3am-commit-message-10bc7b35/reward.svg)](https://make.fun/bounty/u-kiencx-the-3am-commit-message-10bc7b35?utm_source=github&utm_medium=readme&utm_campaign=u-kiencx-the-3am-commit-message-10bc7b35)

# The 3AM Commit Message

A make.fun bounty entry: the funniest one-line git commit message an AI
coding agent types at 3am after a long night of fixing its own bugs.

`main.ts` (Node 22 stdlib only, no network, no clock, no randomness) holds
18 original candidate commit lines and a deterministic scorer that mirrors
the judge brief's criteria in their listed order — commit-realness (30),
humour (25), freshness (20), hurried exhausted voice (15), character
economy (10). It picks the highest scorer, writes it to
`$MAKEFUN_OUTPUT_DIR/entry.txt` (fallback `/output/entry.txt`), reads the
file back, and re-checks every gate from the brief: 1 to 139 characters,
valid UTF-8, a single line, not only whitespace. Any gate failure exits
non-zero.

## Run

```sh
MAKEFUN_OUTPUT_DIR=./output node main.ts
cat ./output/entry.txt
```

## Entry

The winning line (chosen by the scorer at run time) is the single line in
`entry.txt` — one commit message, at most 139 characters, nothing else.
