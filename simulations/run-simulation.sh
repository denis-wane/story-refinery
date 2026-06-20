#!/bin/bash
# Simulation runner for Story Refinery pipeline
# Runs stories through all agents sequentially, skipping review gates.
# Outputs each step to a timestamped directory.
#
# Usage: ./run-simulation.sh <simulation_name> <input_file>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
AGENTS_DIR="$PROJECT_DIR/agents"
MODEL="claude-sonnet-4-6"
MAX_REVISIONS=3
MAX_RETRIES=6
BASE_DELAY=5
MAX_DELAY=120
TMPFILE=$(mktemp)
ERRLOG=$(mktemp)
trap "rm -f $TMPFILE $ERRLOG" EXIT

# Check if an error log contains a rate-limit or transient error
is_retryable_error() {
  local errfile="$1"
  [ ! -s "$errfile" ] && return 1
  grep -qiE '(rate.?limit|429|too many requests|overloaded|529|500|502|503|service unavailable|internal server error|timed? ?out)' "$errfile"
}

# Calculate delay with exponential backoff + jitter
calc_delay() {
  local attempt="$1"
  local exp_delay=$(( BASE_DELAY * (1 << attempt) ))
  local jitter=$(( RANDOM % BASE_DELAY ))
  local delay=$(( exp_delay + jitter ))
  if [ "$delay" -gt "$MAX_DELAY" ]; then
    delay="$MAX_DELAY"
  fi
  echo "$delay"
}

# Check if output is a meta-response or summary placeholder
is_meta_response() {
  local file="$1"
  [ ! -s "$file" ] && return 1
  local lines
  lines=$(wc -l < "$file" | tr -d ' ')

  # Short files with meta-response openers are pure meta-responses
  # Long files (50+ lines) with a preamble line are fine — the model just prefaced real content
  if [ "$lines" -lt 50 ]; then
    if head -5 "$file" | grep -qiE "(I have successfully|I understand you want|I can see that|I will now|I need to see|Could you please (provide|clarify|confirm)|I've completed|I've generated|I've written|I've produced|I've created|I notice (that|a )|I need the actual|discrepancy|However,? the input)"; then
      return 0
    fi
  fi
  # Check for summary/placeholder sections (any length)
  # NOTE: "Coverage Summary" alone is NOT a meta-response — the AC writer legitimately
  # produces a Coverage Summary table. Only flag it if it's the ONLY substantive content
  # (i.e., no actual Given/When/Then AC blocks exist in the file).
  if grep -qiE '(Summary:? Remaining|The complete test specifications cover|The remaining (stories|tests|AC)|specifications provide comprehensive coverage|all .* stories with comprehensive|Key AC Characteristics)' "$file"; then
    return 0
  fi
  # Coverage Summary without any actual AC content = meta-response
  if grep -qiE 'Coverage Summary' "$file" && ! grep -qiE '^\*\*Given\*\*|^Given ' "$file"; then
    return 0
  fi
  return 1
}

# Check if output ends with a continuation signal (model wants to keep going)
has_continuation_signal() {
  local file="$1"
  [ ! -s "$file" ] && return 1
  tail -5 "$file" | grep -qiE "(I'll continue|I will continue|continued in|to be continued|remaining stories|next response|next batch)"
}

# Extract story headers from a stories file, returning line numbers for splitting
# Outputs: "line_number:story_title" for each story
extract_story_boundaries() {
  local file="$1"
  grep -n '^## \|^### Story' "$file" | head -100
}

# Split stories file into batches by target byte size (not fixed count).
# Creates files: $out_prefix-batch-01.md, $out_prefix-batch-02.md, etc.
# Returns the number of batches created.
split_stories_into_batches() {
  local stories_file="$1"
  local out_prefix="$2"
  local target_bytes="${3:-8192}"
  local boundary_pattern="${4:-^## }"

  local line_nums=()

  # Get line numbers of section headers matching the boundary pattern
  while IFS= read -r line; do
    local num="${line%%:*}"
    line_nums+=("$num")
  done < <(grep -n "$boundary_pattern" "$stories_file")

  local total=${#line_nums[@]}
  if [ "$total" -eq 0 ]; then
    # No story headers found — treat whole file as one batch
    cp "$stories_file" "${out_prefix}-batch-01.md"
    echo 1
    return
  fi

  local total_lines
  total_lines=$(wc -l < "$stories_file" | tr -d ' ')
  local batch_num=0
  local i=0

  while [ "$i" -lt "$total" ]; do
    batch_num=$((batch_num + 1))
    local batch_file
    batch_file=$(printf "%s-batch-%02d.md" "$out_prefix" "$batch_num")
    local start_line="${line_nums[$i]}"
    local batch_start="$i"

    # Accumulate sections until we exceed the target byte size
    i=$((i + 1))
    while [ "$i" -lt "$total" ]; do
      local end_line=$((${line_nums[$i]} - 1))
      local chunk_bytes
      chunk_bytes=$(sed -n "${start_line},${end_line}p" "$stories_file" | wc -c | tr -d ' ')
      if [ "$chunk_bytes" -ge "$target_bytes" ] && [ "$i" -gt "$((batch_start + 1))" ]; then
        # This section would push us over — stop before it (but always include at least 1)
        break
      fi
      i=$((i + 1))
    done

    if [ "$i" -ge "$total" ]; then
      # Last batch: take everything to end of file
      sed -n "${start_line},\$p" "$stories_file" > "$batch_file"
    else
      local end_line=$((${line_nums[$i]} - 1))
      sed -n "${start_line},${end_line}p" "$stories_file" > "$batch_file"
    fi
  done

  echo "$batch_num"
}

# Wrapper: run claude CLI with retries on empty output, rate-limit errors, and meta-responses
run_claude_with_retry() {
  local outfile="$1"
  local attempt=0
  local retry_log="$OUT_DIR/.retry-log-$(basename "$outfile" .md).log"
  > "$retry_log"
  while [ "$attempt" -lt "$MAX_RETRIES" ]; do
    attempt=$((attempt + 1))
    echo "[attempt $attempt/$(date +%H:%M:%S)] calling claude..." >> "$retry_log"
    local exit_code=0
    gtimeout "$CALL_TIMEOUT" bash -c 'cat "$1" | claude -p --output-format text --model "$2" --max-turns 0 2>"$3"' _ "$PROMPT_FILE" "$MODEL" "$ERRLOG" > "$outfile" || exit_code=$?
    if [ "$exit_code" -eq 124 ]; then
      echo "  [attempt $attempt] TIMEOUT after ${CALL_TIMEOUT}s" >> "$retry_log"
      echo "  Retry $attempt/$MAX_RETRIES (timeout after ${CALL_TIMEOUT}s)..." >&2
      if [ "$attempt" -lt "$MAX_RETRIES" ]; then
        local delay
        delay=$(calc_delay "$attempt")
        sleep "$delay"
        continue
      fi
      {
        echo "ERROR: All $MAX_RETRIES attempts timed out after ${CALL_TIMEOUT}s each"
        cat "$retry_log"
      } > "$outfile"
      return 0  # let validate_output handle the final check
    fi

    # Check for non-zero exit code (CLI crash, signal, etc.)
    if [ "$exit_code" -ne 0 ]; then
      echo "  [attempt $attempt] non-zero exit ($exit_code), stderr: $(head -1 "$ERRLOG" 2>/dev/null || echo 'none')" >> "$retry_log"
      if [ "$attempt" -lt "$MAX_RETRIES" ]; then
        local delay
        delay=$(calc_delay "$attempt")
        echo "  Retry $attempt/$MAX_RETRIES (exit code $exit_code, waiting ${delay}s)..." >&2
        head -3 "$ERRLOG" | sed 's/^/    /' 2>/dev/null >&2
        sleep "$delay"
        continue
      fi
      # Final attempt still failing — write structured error
      {
        echo "ERROR: All $MAX_RETRIES attempts failed (last exit code: $exit_code)"
        echo "Prompt size: $(wc -c < "$PROMPT_FILE" | tr -d ' ') bytes"
        echo ""
        echo "Retry log:"
        cat "$retry_log"
        echo ""
        echo "Last stderr:"
        cat "$ERRLOG" 2>/dev/null
      } > "$outfile"
      return 0  # let validate_output handle the final check
    fi

    local bytes
    bytes=$(wc -c < "$outfile" | tr -d ' ')

    # Check for rate-limit / transient errors in stderr (even with exit 0)
    if is_retryable_error "$ERRLOG"; then
      echo "  [attempt $attempt] rate-limit/transient: $(head -1 "$ERRLOG")" >> "$retry_log"
      if [ "$attempt" -lt "$MAX_RETRIES" ]; then
        local delay
        delay=$(calc_delay "$attempt")
        echo "  Retry $attempt/$MAX_RETRIES (rate limit / transient error, waiting ${delay}s)..." >&2
        head -3 "$ERRLOG" | sed 's/^/    /' >&2
        sleep "$delay"
        continue
      fi
    fi

    # Check for empty output
    if [ "$bytes" -le 2 ]; then
      echo "  [attempt $attempt] empty output (${bytes}B), stderr: $(head -1 "$ERRLOG" 2>/dev/null || echo 'none')" >> "$retry_log"
      if [ "$attempt" -lt "$MAX_RETRIES" ]; then
        local delay
        delay=$(calc_delay "$attempt")
        echo "  Retry $attempt/$MAX_RETRIES (empty output, waiting ${delay}s)..." >&2
        sleep "$delay"
        continue
      fi
      # Final attempt still empty — write structured error
      {
        echo "ERROR: All $MAX_RETRIES attempts produced empty output"
        echo "Prompt size: $(wc -c < "$PROMPT_FILE" | tr -d ' ') bytes"
        echo ""
        echo "Retry log:"
        cat "$retry_log"
        echo ""
        echo "Last stderr:"
        cat "$ERRLOG" 2>/dev/null
      } > "$outfile"
      return 0  # let validate_output handle the final check
    fi

    # Check for meta-response or summary placeholder
    if is_meta_response "$outfile"; then
      echo "  [attempt $attempt] meta-response: $(head -1 "$outfile")" >> "$retry_log"
      if [ "$attempt" -lt "$MAX_RETRIES" ]; then
        local delay
        delay=$(calc_delay "$attempt")
        echo "  Retry $attempt/$MAX_RETRIES (meta-response detected, waiting ${delay}s)..." >&2
        head -2 "$outfile" | sed 's/^/    /' >&2
        sleep "$delay"
        continue
      fi
    fi

    # Check for continuation signal — make a follow-up call to get the rest
    if has_continuation_signal "$outfile"; then
      echo "  Continuation signal detected — making follow-up call..." >&2
      local cont_prompt
      cont_prompt=$(mktemp)
      cat "$PROMPT_FILE" > "$cont_prompt"
      printf "\n\n---\n\nIMPORTANT: You already started producing output. Here is what you wrote so far:\n\n" >> "$cont_prompt"
      cat "$outfile" >> "$cont_prompt"
      printf "\n\n---\n\nContinue EXACTLY where you left off. Do NOT repeat any content above. Do NOT add any preamble. Just continue producing the remaining content.\n" >> "$cont_prompt"
      local cont_out
      cont_out=$(mktemp)
      local saved_prompt="$PROMPT_FILE"
      PROMPT_FILE="$cont_prompt"
      local cont_attempt=0
      while [ "$cont_attempt" -lt 3 ]; do
        cont_attempt=$((cont_attempt + 1))
        cat "$PROMPT_FILE" | claude -p --output-format text --model "$MODEL" --max-turns 0 2>"$ERRLOG" > "$cont_out" || true
        local cont_bytes
        cont_bytes=$(wc -c < "$cont_out" | tr -d ' ')
        if [ "$cont_bytes" -gt 2 ] && ! is_meta_response "$cont_out"; then
          break
        fi
        if is_retryable_error "$ERRLOG" && [ "$cont_attempt" -lt 3 ]; then
          local cdelay
          cdelay=$(calc_delay "$cont_attempt")
          echo "  Continuation retry $cont_attempt/3 (waiting ${cdelay}s)..." >&2
          sleep "$cdelay"
        fi
      done
      # Append continuation to main output
      printf "\n" >> "$outfile"
      cat "$cont_out" >> "$outfile"
      PROMPT_FILE="$saved_prompt"
      rm -f "$cont_prompt" "$cont_out"
    fi

    echo "  [attempt $attempt] success (${bytes}B)" >> "$retry_log"
    return 0
  done
  return 0  # let validate_output handle the final check
}

# Minimum expected line counts per step (catches meta-responses / empty output)
MIN_LINES_ANALYSIS=30
MIN_LINES_STORIES=30
MIN_LINES_AC=50
MIN_LINES_TESTS=30
MIN_LINES_REVIEW=20
MIN_LINES_DIGEST=30

validate_output() {
  local file="$1"
  local step_name="$2"
  local min_lines="$3"
  local lines
  lines=$(wc -l < "$file" | tr -d ' ')

  # Check for empty output
  if [ "$lines" -lt 2 ]; then
    echo "  ERROR: $step_name produced empty output. Check $ERRLOG for errors." >&2
    if [ -s "$ERRLOG" ]; then
      echo "  stderr:" >&2
      head -20 "$ERRLOG" >&2
    fi
    return 1
  fi

  # Check for meta-response (model describing instead of doing)
  # Only flag short files — long files (50+ lines) with a preamble line are fine,
  # the model just prefaced real content with a sentence.
  if [ "$lines" -lt 50 ]; then
    if head -5 "$file" | grep -qiE "(I have successfully|I understand you want|I can see that|I will now|Let me|I need to see|Could you please (provide|clarify|confirm)|I've completed|I've generated|I've written|I've produced|I've created|I notice (that|a )|I need the actual|discrepancy|However,? the input)"; then
      echo "  WARNING: $step_name appears to be a meta-response (model described work instead of doing it)." >&2
      echo "  First 3 lines:" >&2
      head -3 "$file" >&2
      return 1
    fi
  fi

  # Check for summary/placeholder sections (model truncated and claimed coverage)
  # NOTE: "Coverage Summary" is legitimate when accompanied by actual AC content (Given/When/Then)
  if grep -qiE '(Summary:? Remaining|The complete test specifications cover|The remaining (stories|tests|AC)|specifications provide comprehensive coverage|all .* stories with comprehensive|Key AC Characteristics)' "$file"; then
    echo "  WARNING: $step_name contains summary placeholder text instead of actual content." >&2
    echo "  The model likely truncated and wrote a summary claiming coverage." >&2
    grep -n -iE '(Summary:? Remaining|The complete test specifications cover|The remaining|Coverage Summary|Key AC Characteristics)' "$file" | head -3 >&2
    return 1
  fi

  # Check minimum line count
  if [ "$lines" -lt "$min_lines" ]; then
    echo "  WARNING: $step_name only produced $lines lines (expected >= $min_lines). Output may be truncated." >&2
  fi

  return 0
}

# Content-based validation for specific step types
validate_ac_content() {
  local file="$1"
  local given_count
  given_count=$(grep -ciE '^\*\*Given\*\*|^Given ' "$file" || echo "0")
  if [ "$given_count" -lt 3 ]; then
    echo "  WARNING: AC output contains only $given_count Given/When/Then blocks — likely a meta-response or summary." >&2
    return 1
  fi
  return 0
}

validate_test_content() {
  local file="$1"
  local scenario_count
  scenario_count=$(grep -ciE 'Scenario:' "$file" || echo "0")
  if [ "$scenario_count" -lt 3 ]; then
    echo "  WARNING: Test output contains only $scenario_count Gherkin scenarios — likely a meta-response or summary." >&2
    return 1
  fi
  return 0
}

SIM_NAME="${1:?Usage: $0 <simulation_name> <input_file>}"
INPUT_FILE="${2:?Usage: $0 <simulation_name> <input_file>}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUT_DIR="$SCRIPT_DIR/runs/${SIM_NAME}-${TIMESTAMP}"
MANIFEST="$OUT_DIR/manifest.log"
CALL_TIMEOUT=180
MAX_PROMPT_BYTES=184320  # ~180KB

mkdir -p "$OUT_DIR"
cp "$INPUT_FILE" "$OUT_DIR/00-input.md"

# Log prompt size for each step (fix F)
log_prompt_size() {
  local step_name="$1"
  local bytes
  bytes=$(wc -c < "$PROMPT_FILE" | tr -d ' ')
  echo "step=$step_name bytes=$bytes ts=$(date +%H:%M:%S)" >> "$MANIFEST"
  if [ "$bytes" -gt "$MAX_PROMPT_BYTES" ]; then
    echo "  WARNING: Prompt size (${bytes}B) exceeds ${MAX_PROMPT_BYTES}B cap for $step_name" >&2
  fi
}

echo "=== Simulation: $SIM_NAME ==="
echo "=== Output: $OUT_DIR ==="
echo ""

# Build a prompt file from components
build_prompt() {
  local outfile="$1"
  shift
  # Remaining args are content strings or @file references
  > "$outfile"
  for arg in "$@"; do
    if [[ "$arg" == @* ]]; then
      cat "${arg#@}" >> "$outfile"
    else
      printf "%s\n" "$arg" >> "$outfile"
    fi
  done
}

# Read input
INPUT_FILE_ABS="$(cd "$(dirname "$INPUT_FILE")" && pwd)/$(basename "$INPUT_FILE")"

echo "[Step 1/8] Analyze Input (story-analyst)..."
PROMPT_FILE="$OUT_DIR/.prompt-tmp"
build_prompt "$PROMPT_FILE" \
  "# Agent Definition" \
  "" \
  "@$AGENTS_DIR/story-analyst.md" \
  "" \
  "# Task" \
  "Perform a Generate-mode analysis on the following input. Produce the \"Output: Generate mode (Analysis)\" format from your definition." \
  "IMPORTANT: Output the actual analysis content directly. Do NOT describe what you would do or summarize — produce the deliverable itself." \
  "" \
  "## Project Context" \
  "(No project context available — this is a simulation run)" \
  "" \
  "# Input" \
  "" \
  "@$INPUT_FILE_ABS"

log_prompt_size "story-analyst"
run_claude_with_retry "$OUT_DIR/01-analysis.md"
echo "  Done ($(wc -l < "$OUT_DIR/01-analysis.md") lines)"
if ! validate_output "$OUT_DIR/01-analysis.md" "Analysis" "$MIN_LINES_ANALYSIS"; then
  echo "  FATAL: Analysis step failed — cannot proceed without it." >&2
  exit 1
fi

echo "[Step 2/8] Clarify (clarifier)..."
build_prompt "$PROMPT_FILE" \
  "# Agent Definition" \
  "" \
  "@$AGENTS_DIR/clarifier.md" \
  "" \
  "# Task" \
  "Review the analysis below and produce your prioritized list of clarifying questions. Include default assumptions for each question so the pipeline can proceed even with partial answers." \
  "IMPORTANT: Output the actual clarifying questions document directly. Do NOT describe what you would do — produce the deliverable itself." \
  "" \
  "# Input" \
  "" \
  "## Analysis" \
  "" \
  "@$OUT_DIR/01-analysis.md" \
  "" \
  "## Original Input" \
  "" \
  "@$INPUT_FILE_ABS"

log_prompt_size "clarifier"
run_claude_with_retry "$OUT_DIR/02-questions.md"
echo "  Done ($(wc -l < "$OUT_DIR/02-questions.md") lines)"
if ! validate_output "$OUT_DIR/02-questions.md" "Clarifying Questions" "$MIN_LINES_ANALYSIS"; then
  echo "  FATAL: Clarify step failed — cannot proceed without it." >&2
  exit 1
fi

echo "[Step 3/8] Simulate Stakeholder Answers (stakeholder-sim)..."
build_prompt "$PROMPT_FILE" \
  "# Agent Definition" \
  "" \
  "@$AGENTS_DIR/stakeholder-sim.md" \
  "" \
  "# Task" \
  "You are the product owner for this project. Answer all clarifying questions below based on the original project input. Be decisive and realistic." \
  "IMPORTANT: Output the actual stakeholder responses directly. Do NOT describe what you would do — produce the deliverable itself." \
  "" \
  "# Input" \
  "" \
  "## Original Project Description" \
  "" \
  "@$INPUT_FILE_ABS" \
  "" \
  "## Clarifying Questions" \
  "" \
  "@$OUT_DIR/02-questions.md"

log_prompt_size "stakeholder-sim"
run_claude_with_retry "$OUT_DIR/03-answers.md"
echo "  Done ($(wc -l < "$OUT_DIR/03-answers.md") lines)"
if ! validate_output "$OUT_DIR/03-answers.md" "Stakeholder Answers" "$MIN_LINES_ANALYSIS"; then
  echo "  FATAL: Stakeholder step failed — cannot proceed without it." >&2
  exit 1
fi

echo "[Step 4/8] Decompose Features (story-decomposer)..."
build_prompt "$PROMPT_FILE" \
  "# Agent Definition" \
  "" \
  "@$AGENTS_DIR/story-decomposer.md" \
  "" \
  "# Task" \
  "Given the analysis and stakeholder clarifications below, decompose ALL identified features into well-scoped user stories. Follow your output format exactly. Use the stakeholder's answers to resolve any ambiguities — do not leave questions open that have been answered." \
  "IMPORTANT: Output the actual stories directly. Do NOT describe what you would do or summarize — produce the deliverable itself." \
  "" \
  "COVERAGE INSTRUCTION: Every feature in the analysis must produce at least one story. After writing all stories, include the Coverage Check table from your output format to prove completeness." \
  "" \
  "# Input" \
  "" \
  "## Original Requirements" \
  "" \
  "@$INPUT_FILE_ABS" \
  "" \
  "## Analysis" \
  "" \
  "@$OUT_DIR/01-analysis.md" \
  "" \
  "## Stakeholder Clarifications" \
  "" \
  "@$OUT_DIR/03-answers.md"

log_prompt_size "story-decomposer"
run_claude_with_retry "$OUT_DIR/04-stories.md"
echo "  Done ($(wc -l < "$OUT_DIR/04-stories.md") lines)"
if ! validate_output "$OUT_DIR/04-stories.md" "Stories" "$MIN_LINES_STORIES"; then
  echo "  FATAL: Decompose step failed — cannot proceed without stories." >&2
  exit 1
fi

echo "[Step 5/8] Draft Acceptance Criteria (ac-writer) — one story at a time..."
# Split stories by ### headers (individual stories within ## feature sections)
STORY_PREFIX="$OUT_DIR/.story"
STORY_LINES=()
while IFS= read -r line; do
  STORY_LINES+=("${line%%:*}")
done < <(grep -n '^### ' "$OUT_DIR/04-stories.md")

TOTAL_STORIES=${#STORY_LINES[@]}
if [ "$TOTAL_STORIES" -eq 0 ]; then
  echo "  No ### story headers found — treating entire file as one story"
  TOTAL_STORIES=1
  cp "$OUT_DIR/04-stories.md" "${STORY_PREFIX}-01.md"
else
  TOTAL_FILE_LINES=$(wc -l < "$OUT_DIR/04-stories.md" | tr -d ' ')
  # Extract preamble (everything before first story)
  PREAMBLE_END=$((${STORY_LINES[0]} - 1))
  PREAMBLE=""
  if [ "$PREAMBLE_END" -gt 0 ]; then
    PREAMBLE=$(sed -n "1,${PREAMBLE_END}p" "$OUT_DIR/04-stories.md")
  fi
  for s in $(seq 0 $((TOTAL_STORIES - 1))); do
    STORY_NUM=$(printf "%02d" $((s + 1)))
    START_LINE="${STORY_LINES[$s]}"
    if [ "$s" -lt $((TOTAL_STORIES - 1)) ]; then
      END_LINE=$((${STORY_LINES[$((s + 1))]} - 1))
    else
      END_LINE="$TOTAL_FILE_LINES"
    fi
    # Find the parent ## feature header for this story
    FEATURE_HEADER=""
    for fl in $(grep -n '^## ' "$OUT_DIR/04-stories.md" | cut -d: -f1); do
      if [ "$fl" -lt "$START_LINE" ]; then
        FEATURE_HEADER=$(sed -n "${fl}p" "$OUT_DIR/04-stories.md")
      fi
    done
    {
      if [ -n "$PREAMBLE" ]; then
        echo "$PREAMBLE"
        echo ""
      fi
      if [ -n "$FEATURE_HEADER" ]; then
        echo "$FEATURE_HEADER"
        echo ""
      fi
      sed -n "${START_LINE},${END_LINE}p" "$OUT_DIR/04-stories.md"
    } > "${STORY_PREFIX}-${STORY_NUM}.md"
  done
fi
echo "  Processing $TOTAL_STORIES stories individually"

> "$OUT_DIR/05-acceptance-criteria.md"
AC_FAILURES=0
for s in $(seq -f "%02g" 1 "$TOTAL_STORIES"); do
  STORY_FILE="${STORY_PREFIX}-${s}.md"
  STORY_TITLE=$(grep -m1 '^### ' "$STORY_FILE" | sed 's/^### //' || echo "Story $s")
  echo "  [Story $s/$TOTAL_STORIES] AC for: $STORY_TITLE"
  build_prompt "$PROMPT_FILE" \
    "# Agent Definition" \
    "" \
    "@$AGENTS_DIR/ac-writer.md" \
    "" \
    "# Task" \
    "Write complete acceptance criteria for the user story below. Follow your output format exactly." \
    "" \
    "CRITICAL INSTRUCTION: Start your VERY FIRST LINE with '# Acceptance Criteria:' for this story. No preamble, no introduction, no summary. Produce the actual deliverable directly." \
    "" \
    "COVERAGE INSTRUCTION: Write complete AC for this story with: functional AC (happy path + edge cases + errors), AC-AUTH-1 (401 test), AC-AUTH-2 (403 test), Gap Traceability table, and Open Questions." \
    "" \
    "GAP TRACEABILITY: The Story Analyst identified specific gaps in the Gap Analysis section below. Include a Gap Traceability table mapping every relevant gap to an AC, Out of Scope, or Open Question." \
    "" \
    "# Input" \
    "" \
    "## Gap Analysis (from Story Analyst)" \
    "" \
    "@$OUT_DIR/01-analysis.md" \
    "" \
    "## Story (${s} of ${TOTAL_STORIES})" \
    "" \
    "@$STORY_FILE"
  STORY_OUT="$OUT_DIR/.ac-story-${s}.md"
  log_prompt_size "ac-writer-story-$s"
  run_claude_with_retry "$STORY_OUT"
  story_lines=$(wc -l < "$STORY_OUT" | tr -d ' ')
  echo "    Done ($story_lines lines)"
  if validate_output "$STORY_OUT" "AC story $s" 20 && validate_ac_content "$STORY_OUT"; then
    cat "$STORY_OUT" >> "$OUT_DIR/05-acceptance-criteria.md"
    printf "\n\n" >> "$OUT_DIR/05-acceptance-criteria.md"
  else
    echo "  WARNING: AC for story $s failed validation — continuing with remaining stories" >&2
    AC_FAILURES=$((AC_FAILURES + 1))
  fi
  rm -f "$STORY_FILE"
done
echo "  AC complete: $(wc -l < "$OUT_DIR/05-acceptance-criteria.md") lines total ($AC_FAILURES story failures)"
if [ "$(wc -l < "$OUT_DIR/05-acceptance-criteria.md" | tr -d ' ')" -lt 10 ]; then
  echo "  ERROR: AC output is essentially empty after all stories. Stopping." >&2
  exit 1
fi

echo "[Step 5.5/8] Summarize AC Coverage (ac-summarizer)..."
build_prompt "$PROMPT_FILE" \
  "# Agent Definition" \
  "" \
  "@$AGENTS_DIR/ac-summarizer.md" \
  "" \
  "# Task" \
  "Produce a compact AC coverage digest from the full acceptance criteria below. The digest will be used by the Quality Reviewer instead of the full AC document. Follow your output format exactly." \
  "" \
  "CRITICAL INSTRUCTION: You MUST output the actual digest. Do NOT describe what you would summarize — produce the deliverable directly. Count AC blocks and steps precisely by scanning the actual content." \
  "" \
  "# Input" \
  "" \
  "## Gap Analysis (from Story Analyst — for cross-reference)" \
  "" \
  "@$OUT_DIR/01-analysis.md" \
  "" \
  "## Full Acceptance Criteria" \
  "" \
  "@$OUT_DIR/05-acceptance-criteria.md"

log_prompt_size "ac-summarizer"
run_claude_with_retry "$OUT_DIR/05.5-ac-digest.md"
echo "  Done ($(wc -l < "$OUT_DIR/05.5-ac-digest.md") lines)"
if ! validate_output "$OUT_DIR/05.5-ac-digest.md" "AC Digest" "$MIN_LINES_DIGEST"; then
  echo "  WARNING: AC digest failed validation — reviewer will use raw AC as fallback." >&2
  cp "$OUT_DIR/05-acceptance-criteria.md" "$OUT_DIR/05.5-ac-digest.md"
fi

echo "[Step 6/8] Generate Test Specs (test-generator) — chunked..."
# Re-split the combined AC output into batches for test generation
AC_BATCH_PREFIX="$OUT_DIR/.ac-for-tests"
NUM_AC_BATCHES=$(split_stories_into_batches "$OUT_DIR/05-acceptance-criteria.md" "$AC_BATCH_PREFIX" "$BATCH_TARGET_BYTES" '^# Acceptance')
echo "  Split AC into $NUM_AC_BATCHES batches"
> "$OUT_DIR/06-test-specs.md"
TEST_FAILURES=0
for b in $(seq -f "%02g" 1 "$NUM_AC_BATCHES"); do
  AC_BATCH_FILE="${AC_BATCH_PREFIX}-batch-${b}.md"
  BATCH_AC_COUNT=$(grep -c '^# Acceptance' "$AC_BATCH_FILE" || echo "0")
  echo "  [Batch $b/$NUM_AC_BATCHES] Tests for $BATCH_AC_COUNT stories..."
  build_prompt "$PROMPT_FILE" \
    "# Agent Definition" \
    "" \
    "@$AGENTS_DIR/test-generator.md" \
    "" \
    "# Task" \
    "Generate test specifications for the stories and acceptance criteria in this batch. Follow your output format exactly — include coverage matrix, test cases in Gherkin, test data, and preconditions." \
    "" \
    "CRITICAL INSTRUCTION: You MUST output the actual test specifications. Do NOT ask for more input, do NOT describe what you would generate, do NOT summarize. Produce the complete deliverable directly." \
    "" \
    "COVERAGE INSTRUCTION: Generate tests for EVERY story in this batch. Include mandatory 401/403 authorization tests for each story." \
    "" \
    "# Input" \
    "" \
    "## Stories with Acceptance Criteria (batch $b of $NUM_AC_BATCHES)" \
    "" \
    "@$AC_BATCH_FILE"
  TEST_BATCH_OUT="$OUT_DIR/.test-batch-${b}.md"
  log_prompt_size "test-generator-batch-$b"
  run_claude_with_retry "$TEST_BATCH_OUT"
  local_lines=$(wc -l < "$TEST_BATCH_OUT" | tr -d ' ')
  echo "    Done ($local_lines lines)"
  if validate_output "$TEST_BATCH_OUT" "Test batch $b" "$MIN_LINES_TESTS" && validate_test_content "$TEST_BATCH_OUT"; then
    cat "$TEST_BATCH_OUT" >> "$OUT_DIR/06-test-specs.md"
    printf "\n\n" >> "$OUT_DIR/06-test-specs.md"
  else
    echo "  WARNING: Test batch $b failed validation — continuing with remaining batches" >&2
    TEST_FAILURES=$((TEST_FAILURES + 1))
  fi
  rm -f "$AC_BATCH_FILE"
done
echo "  Tests complete: $(wc -l < "$OUT_DIR/06-test-specs.md") lines total ($TEST_FAILURES batch failures)"
if [ "$(wc -l < "$OUT_DIR/06-test-specs.md" | tr -d ' ')" -lt 10 ]; then
  echo "  ERROR: Test output is essentially empty after all batches. Stopping." >&2
  exit 1
fi

echo "[Step 7/8] Summarize Test Coverage (test-summarizer)..."
build_prompt "$PROMPT_FILE" \
  "# Agent Definition" \
  "" \
  "@$AGENTS_DIR/test-summarizer.md" \
  "" \
  "# Task" \
  "Produce a compact test coverage digest from the raw test specifications below. The digest will be used by the Quality Reviewer instead of the full Gherkin output. Follow your output format exactly." \
  "" \
  "CRITICAL INSTRUCTION: You MUST output the actual digest. Do NOT describe what you would summarize — produce the deliverable directly. Count scenarios and steps precisely by scanning the actual content." \
  "" \
  "# Input" \
  "" \
  "## Acceptance Criteria (for cross-reference)" \
  "" \
  "@$OUT_DIR/05-acceptance-criteria.md" \
  "" \
  "## Raw Test Specifications" \
  "" \
  "@$OUT_DIR/06-test-specs.md"

log_prompt_size "test-summarizer"
run_claude_with_retry "$OUT_DIR/06.5-test-digest.md"
echo "  Done ($(wc -l < "$OUT_DIR/06.5-test-digest.md") lines)"
if ! validate_output "$OUT_DIR/06.5-test-digest.md" "Test Digest" "$MIN_LINES_DIGEST"; then
  echo "  WARNING: Test digest failed validation — reviewer will use raw test specs as fallback." >&2
  cp "$OUT_DIR/06-test-specs.md" "$OUT_DIR/06.5-test-digest.md"
fi

echo "[Step 8/8] Quality Review (story-reviewer)..."
build_prompt "$PROMPT_FILE" \
  "# Agent Definition" \
  "" \
  "@$AGENTS_DIR/story-reviewer.md" \
  "" \
  "# Task" \
  "Perform a quality review of the complete story package below. Score each story against your 8-category rubric (80+ to pass). Provide specific, actionable feedback. Include per-agent feedback sections (To Story Analyst, To AC Writer, To Test Generator) if revision is needed." \
  "" \
  "CRITICAL INSTRUCTION: You MUST output the actual review with scores, verdicts, and feedback. Do NOT summarize or describe what you would review. Produce the complete deliverable directly." \
  "" \
  "TRACEABILITY CHECK: Verify that every gap in the Gap Analysis table is accounted for in the AC (as an AC, out-of-scope item, or open question). Score Gap Analysis Quality based on whether the analyst produced a structured gap table with resolution statuses." \
  "" \
  "NOTE: Both acceptance criteria and test specifications below are coverage digests (not the full documents). Use the coverage matrices, gap analysis, and statistics to evaluate quality." \
  "" \
  "# Input" \
  "" \
  "## Original Requirements" \
  "" \
  "@$INPUT_FILE_ABS" \
  "" \
  "## Gap Analysis (from Story Analyst)" \
  "" \
  "@$OUT_DIR/01-analysis.md" \
  "" \
  "## Complete Story Package" \
  "" \
  "### Stories" \
  "" \
  "@$OUT_DIR/04-stories.md" \
  "" \
  "### AC Coverage Digest" \
  "" \
  "@$OUT_DIR/05.5-ac-digest.md" \
  "" \
  "### Test Coverage Digest" \
  "" \
  "@$OUT_DIR/06.5-test-digest.md"

log_prompt_size "story-reviewer"
run_claude_with_retry "$OUT_DIR/07-review.md"
echo "  Done ($(wc -l < "$OUT_DIR/07-review.md") lines)"
if ! validate_output "$OUT_DIR/07-review.md" "Review" "$MIN_LINES_REVIEW"; then
  echo "  WARNING: Review step failed validation — proceeding with what we have." >&2
fi

# Parse score from review (macOS compatible grep)
SCORE=$(grep -oE 'Score:[[:space:]]*[0-9]+/100' "$OUT_DIR/07-review.md" | head -1 | grep -oE '[0-9]+' | head -1 || echo "")
VERDICT=$(grep -oE '(PASS|NEEDS-REVISION|BLOCK)' "$OUT_DIR/07-review.md" | head -1 || echo "UNKNOWN")

echo ""
echo "=== Initial Review: Score=$SCORE Verdict=$VERDICT ==="

# Revision loop
REVISION=0
while [ -n "$SCORE" ] && [ "$SCORE" -lt 80 ] && [ "$VERDICT" != "PASS" ] && [ "$REVISION" -lt "$MAX_REVISIONS" ]; do
  REVISION=$((REVISION + 1))
  REV_DIR="$OUT_DIR/revision-${REVISION}"
  mkdir -p "$REV_DIR"
  cp "$OUT_DIR/07-review.md" "$REV_DIR/00-reviewer-feedback.md" 2>/dev/null || true

  echo ""
  echo "=== Revision $REVISION/$MAX_REVISIONS (score was $SCORE) ==="

  echo "[Rev $REVISION - Step 5] Rewriting Acceptance Criteria — one story at a time..."
  # Re-split stories for revision (same logic as initial pass)
  REV_STORY_PREFIX="$REV_DIR/.story"
  REV_STORY_LINES=()
  while IFS= read -r line; do
    REV_STORY_LINES+=("${line%%:*}")
  done < <(grep -n '^### ' "$OUT_DIR/04-stories.md")
  REV_TOTAL_STORIES=${#REV_STORY_LINES[@]}
  if [ "$REV_TOTAL_STORIES" -eq 0 ]; then
    REV_TOTAL_STORIES=1
    cp "$OUT_DIR/04-stories.md" "${REV_STORY_PREFIX}-01.md"
  else
    REV_TOTAL_FILE_LINES=$(wc -l < "$OUT_DIR/04-stories.md" | tr -d ' ')
    REV_PREAMBLE_END=$((${REV_STORY_LINES[0]} - 1))
    REV_PREAMBLE=""
    if [ "$REV_PREAMBLE_END" -gt 0 ]; then
      REV_PREAMBLE=$(sed -n "1,${REV_PREAMBLE_END}p" "$OUT_DIR/04-stories.md")
    fi
    for s in $(seq 0 $((REV_TOTAL_STORIES - 1))); do
      REV_STORY_NUM=$(printf "%02d" $((s + 1)))
      START_LINE="${REV_STORY_LINES[$s]}"
      if [ "$s" -lt $((REV_TOTAL_STORIES - 1)) ]; then
        END_LINE=$((${REV_STORY_LINES[$((s + 1))]} - 1))
      else
        END_LINE="$REV_TOTAL_FILE_LINES"
      fi
      FEATURE_HEADER=""
      for fl in $(grep -n '^## ' "$OUT_DIR/04-stories.md" | cut -d: -f1); do
        if [ "$fl" -lt "$START_LINE" ]; then
          FEATURE_HEADER=$(sed -n "${fl}p" "$OUT_DIR/04-stories.md")
        fi
      done
      {
        if [ -n "$REV_PREAMBLE" ]; then
          echo "$REV_PREAMBLE"
          echo ""
        fi
        if [ -n "$FEATURE_HEADER" ]; then
          echo "$FEATURE_HEADER"
          echo ""
        fi
        sed -n "${START_LINE},${END_LINE}p" "$OUT_DIR/04-stories.md"
      } > "${REV_STORY_PREFIX}-${REV_STORY_NUM}.md"
    done
  fi
  echo "  Processing $REV_TOTAL_STORIES stories individually"

  > "$REV_DIR/05-acceptance-criteria.md"
  REV_AC_FAILURES=0
  for s in $(seq -f "%02g" 1 "$REV_TOTAL_STORIES"); do
    REV_STORY_FILE="${REV_STORY_PREFIX}-${s}.md"
    REV_STORY_TITLE=$(grep -m1 '^### ' "$REV_STORY_FILE" | sed 's/^### //' || echo "Story $s")
    echo "  [Story $s/$REV_TOTAL_STORIES] Revised AC for: $REV_STORY_TITLE"
    build_prompt "$PROMPT_FILE" \
      "# Agent Definition" \
      "" \
      "@$AGENTS_DIR/ac-writer.md" \
      "" \
      "# Task" \
      "Write complete acceptance criteria for the user story below. Address ALL feedback from the Quality Reviewer." \
      "" \
      "CRITICAL INSTRUCTION: Start your VERY FIRST LINE with '# Acceptance Criteria:' for this story. No preamble. Produce the actual deliverable directly." \
      "" \
      "COVERAGE INSTRUCTION: Write complete AC for this story with: functional AC (happy path + edge cases + errors), AC-AUTH-1 (401 test), AC-AUTH-2 (403 test), Gap Traceability table, and Open Questions." \
      "" \
      "GAP TRACEABILITY: Include a Gap Traceability table mapping analyst gaps to AC." \
      "" \
      "## Reviewer Feedback (Revision $REVISION/$MAX_REVISIONS)" \
      "The Quality Reviewer scored this package ${SCORE}/100 (${VERDICT}). Address the following feedback:" \
      "" \
      "@$REV_DIR/00-reviewer-feedback.md" \
      "" \
      "# Input" \
      "" \
      "## Gap Analysis (from Story Analyst)" \
      "" \
      "@$OUT_DIR/01-analysis.md" \
      "" \
      "## Story (${s} of ${REV_TOTAL_STORIES})" \
      "" \
      "@$REV_STORY_FILE"
    REV_STORY_OUT="$REV_DIR/.ac-story-${s}.md"
    log_prompt_size "rev-$REVISION-ac-story-$s"
    run_claude_with_retry "$REV_STORY_OUT"
    rev_story_lines=$(wc -l < "$REV_STORY_OUT" | tr -d ' ')
    echo "    Done ($rev_story_lines lines)"
    if validate_output "$REV_STORY_OUT" "Rev AC story $s" 20 && validate_ac_content "$REV_STORY_OUT"; then
      cat "$REV_STORY_OUT" >> "$REV_DIR/05-acceptance-criteria.md"
      printf "\n\n" >> "$REV_DIR/05-acceptance-criteria.md"
    else
      echo "  WARNING: Rev AC for story $s failed — continuing" >&2
      REV_AC_FAILURES=$((REV_AC_FAILURES + 1))
    fi
    rm -f "$REV_STORY_FILE"
  done
  echo "  Revised AC complete: $(wc -l < "$REV_DIR/05-acceptance-criteria.md") lines ($REV_AC_FAILURES failures)"
  if [ "$(wc -l < "$REV_DIR/05-acceptance-criteria.md" | tr -d ' ')" -lt 10 ]; then
    echo "  ERROR: Revised AC essentially empty. Breaking revision loop." >&2
    break
  fi

  echo "[Rev $REVISION - Step 5.5] Summarizing revised AC..."
  build_prompt "$PROMPT_FILE" \
    "# Agent Definition" \
    "" \
    "@$AGENTS_DIR/ac-summarizer.md" \
    "" \
    "# Task" \
    "Produce a compact AC coverage digest from the revised acceptance criteria below. Follow your output format exactly." \
    "" \
    "CRITICAL INSTRUCTION: You MUST output the actual digest. Count AC blocks precisely." \
    "" \
    "# Input" \
    "" \
    "## Gap Analysis (from Story Analyst — for cross-reference)" \
    "" \
    "@$OUT_DIR/01-analysis.md" \
    "" \
    "## Full Acceptance Criteria" \
    "" \
    "@$REV_DIR/05-acceptance-criteria.md"

  log_prompt_size "rev-$REVISION-ac-summarizer"
  run_claude_with_retry "$REV_DIR/05.5-ac-digest.md"
  echo "  Done ($(wc -l < "$REV_DIR/05.5-ac-digest.md") lines)"
  if ! validate_output "$REV_DIR/05.5-ac-digest.md" "Rev AC Digest" "$MIN_LINES_DIGEST"; then
    echo "  WARNING: Revised AC digest failed — reviewer will use raw AC as fallback." >&2
    cp "$REV_DIR/05-acceptance-criteria.md" "$REV_DIR/05.5-ac-digest.md"
  fi

  echo "[Rev $REVISION - Step 6] Regenerating Test Specs — chunked..."
  REV_AC_BATCH_PREFIX="$REV_DIR/.ac-for-tests"
  REV_NUM_AC_BATCHES=$(split_stories_into_batches "$REV_DIR/05-acceptance-criteria.md" "$REV_AC_BATCH_PREFIX" "$BATCH_TARGET_BYTES" '^# Acceptance')
  echo "  Split revised AC into $REV_NUM_AC_BATCHES batches"
  > "$REV_DIR/06-test-specs.md"
  REV_TEST_FAILURES=0
  for b in $(seq -f "%02g" 1 "$REV_NUM_AC_BATCHES"); do
    REV_AC_BATCH_FILE="${REV_AC_BATCH_PREFIX}-batch-${b}.md"
    echo "  [Batch $b/$REV_NUM_AC_BATCHES] Revised tests..."
    build_prompt "$PROMPT_FILE" \
      "# Agent Definition" \
      "" \
      "@$AGENTS_DIR/test-generator.md" \
      "" \
      "# Task" \
      "Generate test specifications for the stories and acceptance criteria in this batch. Address ALL reviewer feedback. Follow your output format exactly." \
      "" \
      "CRITICAL INSTRUCTION: You MUST output the actual test specifications. Produce the complete deliverable directly." \
      "" \
      "COVERAGE INSTRUCTION: Generate tests for EVERY story in this batch. Include mandatory 401/403 authorization tests." \
      "" \
      "# Input" \
      "" \
      "## Stories with Acceptance Criteria (batch $b of $REV_NUM_AC_BATCHES)" \
      "" \
      "@$REV_AC_BATCH_FILE"
    REV_TEST_BATCH_OUT="$REV_DIR/.test-batch-${b}.md"
    log_prompt_size "rev-$REVISION-test-batch-$b"
    run_claude_with_retry "$REV_TEST_BATCH_OUT"
    rev_test_lines=$(wc -l < "$REV_TEST_BATCH_OUT" | tr -d ' ')
    echo "    Done ($rev_test_lines lines)"
    if validate_output "$REV_TEST_BATCH_OUT" "Rev test batch $b" "$MIN_LINES_TESTS" && validate_test_content "$REV_TEST_BATCH_OUT"; then
      cat "$REV_TEST_BATCH_OUT" >> "$REV_DIR/06-test-specs.md"
      printf "\n\n" >> "$REV_DIR/06-test-specs.md"
    else
      echo "  WARNING: Rev test batch $b failed — continuing" >&2
      REV_TEST_FAILURES=$((REV_TEST_FAILURES + 1))
    fi
    rm -f "$REV_AC_BATCH_FILE"
  done
  echo "  Revised tests complete: $(wc -l < "$REV_DIR/06-test-specs.md") lines ($REV_TEST_FAILURES failures)"
  if [ "$(wc -l < "$REV_DIR/06-test-specs.md" | tr -d ' ')" -lt 10 ]; then
    echo "  ERROR: Revised tests essentially empty. Breaking revision loop." >&2
    break
  fi

  echo "[Rev $REVISION - Step 7] Summarizing revised tests..."
  build_prompt "$PROMPT_FILE" \
    "# Agent Definition" \
    "" \
    "@$AGENTS_DIR/test-summarizer.md" \
    "" \
    "# Task" \
    "Produce a compact test coverage digest from the raw test specifications below. Follow your output format exactly." \
    "" \
    "CRITICAL INSTRUCTION: You MUST output the actual digest. Count scenarios and steps precisely." \
    "" \
    "# Input" \
    "" \
    "## Acceptance Criteria (for cross-reference)" \
    "" \
    "@$REV_DIR/05-acceptance-criteria.md" \
    "" \
    "## Raw Test Specifications" \
    "" \
    "@$REV_DIR/06-test-specs.md"

  log_prompt_size "rev-$REVISION-test-summarizer"
  run_claude_with_retry "$REV_DIR/06.5-test-digest.md"
  echo "  Done ($(wc -l < "$REV_DIR/06.5-test-digest.md") lines)"
  if ! validate_output "$REV_DIR/06.5-test-digest.md" "Rev Test Digest" "$MIN_LINES_DIGEST"; then
    echo "  WARNING: Revised test digest failed validation — using raw test specs as fallback." >&2
    cp "$REV_DIR/06-test-specs.md" "$REV_DIR/06.5-test-digest.md"
  fi

  echo "[Rev $REVISION - Step 8] Re-reviewing..."
  build_prompt "$PROMPT_FILE" \
    "# Agent Definition" \
    "" \
    "@$AGENTS_DIR/story-reviewer.md" \
    "" \
    "# Task" \
    "Perform a quality review of the complete story package below. Score each story against your 8-category rubric (80+ to pass). Provide specific, actionable feedback." \
    "This is revision $REVISION of $MAX_REVISIONS. Compare against earlier reviews and note what improved." \
    "" \
    "CRITICAL INSTRUCTION: You MUST output the actual review with scores and verdicts. Do NOT summarize or describe what you would review. Produce the complete deliverable." \
    "" \
    "TRACEABILITY CHECK: Verify that every gap in the Gap Analysis table is accounted for in the AC (as an AC, out-of-scope item, or open question)." \
    "" \
    "NOTE: Both acceptance criteria and test specifications below are coverage digests (not the full documents). Use the coverage matrices, gap analysis, and statistics to evaluate quality." \
    "" \
    "# Input" \
    "" \
    "## Original Requirements" \
    "" \
    "@$INPUT_FILE_ABS" \
    "" \
    "## Gap Analysis (from Story Analyst)" \
    "" \
    "@$OUT_DIR/01-analysis.md" \
    "" \
    "## Complete Story Package" \
    "" \
    "### Stories" \
    "" \
    "@$OUT_DIR/04-stories.md" \
    "" \
    "### AC Coverage Digest" \
    "" \
    "@$REV_DIR/05.5-ac-digest.md" \
    "" \
    "### Test Coverage Digest" \
    "" \
    "@$REV_DIR/06.5-test-digest.md"

  log_prompt_size "rev-$REVISION-story-reviewer"
  run_claude_with_retry "$REV_DIR/07-review.md"
  echo "  Done ($(wc -l < "$REV_DIR/07-review.md") lines)"
  if ! validate_output "$REV_DIR/07-review.md" "Revised Review (rev $REVISION)" "$MIN_LINES_REVIEW"; then
    echo "  WARNING: Revised review failed validation — breaking revision loop." >&2
    break
  fi

  SCORE=$(grep -oE 'Score:[[:space:]]*[0-9]+/100' "$REV_DIR/07-review.md" | head -1 | grep -oE '[0-9]+' | head -1 || echo "")
  VERDICT=$(grep -oE '(PASS|NEEDS-REVISION|BLOCK)' "$REV_DIR/07-review.md" | head -1 || echo "UNKNOWN")

  echo "=== Revision $REVISION Review: Score=$SCORE Verdict=$VERDICT ==="

  # Copy latest review for next iteration
  cp "$REV_DIR/07-review.md" "$OUT_DIR/07-review.md"
done

echo ""
echo "=== Simulation complete ==="
echo "  Final score: $SCORE/100 ($VERDICT)"
echo "  Revisions: $REVISION/$MAX_REVISIONS"
echo "  Output: $OUT_DIR"

# Clean up temp files (keep manifest.log and retry logs for diagnostics)
rm -f "$OUT_DIR/.prompt-tmp" "$OUT_DIR"/.stories-batch-*.md "$OUT_DIR"/.ac-batch-*.md "$OUT_DIR"/.test-batch-*.md "$OUT_DIR"/.ac-for-tests-batch-*.md "$OUT_DIR"/.story-*.md "$OUT_DIR"/.ac-story-*.md

echo ""
echo "=== Prompt size manifest ==="
cat "$MANIFEST" 2>/dev/null || echo "  (no manifest)"
