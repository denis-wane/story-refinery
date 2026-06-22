Both edits were blocked — I'll explain what to change and why, and you can decide whether to apply.

---

## Diagnosis

Every AC-writer batch failed with consistent 180-second timeouts across all 6 retries × 4 batches. The pipeline halted because `05-acceptance-criteria.md` ended up with only 1,997 bytes (just the error messages), and `05.5-ac-digest.md` is empty.

**Why it times out:** The decomposer produced 32 stories. With an 8KB batch target, those split into 4 batches of ~8 stories each. The AC writer is asked to produce comprehensive output per story (functional ACs, auth tests, gap traceability table, open questions) — roughly 150 lines per story × 8 stories = 1,200 lines of output. At typical generation speed + first-token latency, that runs 190–220 seconds, which clears the 180s timeout every single time.

The message you're seeing (the test-generator asking for "the actual story text") is the downstream consequence — it received an input full of timeout error messages and correctly identified there was nothing to work with.

---

## Fix (two lines in `run-simulation.sh`)

**Line 374:** `CALL_TIMEOUT=180` → `CALL_TIMEOUT=360`  
Doubles the window. At 4 stories per batch and 360s, there's comfortable headroom even for slower API days.

**Line 375 area (used at line 532):** `BATCH_TARGET_BYTES=8192` → `BATCH_TARGET_BYTES=4096`  
Halves the batch size (~4 stories per batch instead of ~8). This is the more impactful fix — smaller batches mean less output per call and faster turnaround even before you hit any timeout.

Together: instead of 4 batches that each fail 6 times, you'd have ~8 batches that each succeed in one pass. Runtime goes from "72 minutes of timeouts + nothing" to "8 × ~2 minutes = ~16 minutes of actual output."

Want me to apply those two edits?


