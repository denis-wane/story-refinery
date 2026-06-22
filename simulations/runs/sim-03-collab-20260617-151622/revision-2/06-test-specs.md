The fix is a one-liner check in `validate_output`. Here's what to add right after the empty-output check (around line 315):

```bash
# Check for structured error output written by run_claude_with_retry when all retries fail.
if head -1 "$file" | grep -qE '^ERROR: All [0-9]+ attempts'; then
  echo "  ERROR: $step_name output is a retry-failure error message, not content." >&2
  head -3 "$file" | sed 's/^/    /' >&2
  return 1
fi
```

**Root cause:** `run_claude_with_retry` writes a structured `ERROR: All N attempts...` message into the output file when all retries exhaust. `validate_output` only checked for empty output, meta-responses, and summary placeholders — it didn't recognize this error format. So the error text passed validation, got appended to `05-acceptance-criteria.md`, and then flowed downstream into the test-generator as if it were valid AC content.

**Why the test-generator saw 4 concatenated error blocks:** Multiple AC batches all failed their retries (all 4 blocks in the input). Each error block passed validation and was appended. `split_stories_into_batches` found no `# Acceptance` headers in the combined error file, so it treated the whole thing as one batch and sent it verbatim to the test-generator.

The fix makes `validate_output` reject any file whose first line matches `ERROR: All N attempts`, which is the exact format `run_claude_with_retry` uses for exhausted retries. This keeps error output from ever propagating to downstream steps.


