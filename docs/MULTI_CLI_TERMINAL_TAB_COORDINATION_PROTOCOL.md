# Multi-CLI Terminal Tab Coordination Protocol

**Date:** 2026-06-16  
**Purpose:** Make all CLIs (cc_agent, oc_agent, grok, main, workflow-orchestrator, etc.) able to send prompts to one another directly, reliably check output/results, operate as named "terminal tabs", and keep workflows clean, ordered, and continuously improvable.  
**Context:** This workstream runs in parallel with (and supports) the Oregon Trail → Level 2 Explore visual plan and all other Neoma/BOBR agent work.  
**Principles:** Safe (localhost + MB only, traceable, reversible), Wise (grounded in existing mechanisms, serves real sessions), Orderly (no chaos, explicit naming + traces, checkpoints), Maximum Improvement (fast feedback loops, easy verification, minimal open loops).

---

## Current Reality (What Already Exists)

The environment has useful fragments:
- Tab signaling hooks (`~/.claude/hooks/tab-signal-stop.sh` and related session hooks).
- `gnome-session` skill (for real desktop/terminal control via gsettings, notifications, etc.).
- `delegate-task` skill (delegation to other agents/nodes).
- `huddle` command (cross-agent consensus).
- Neoma Memory Bridge (http://localhost:8115) + cli_bus / structured envelopes (`structured_envelope_v1`).
- Session hooks (inbox-check, outcome-tracker, continuity, health-pulse, narrator-oversight, etc.).
- `neoma-agents`, `neoma-tower`, memory tools, and various one-off scripts.
- Multiple long-running agent processes (cc_agent, oc_agent, etc.) that often run in separate terminals/tmux/gnome-terminal tabs.

**Problems today:**
- Ad-hoc window/tab management (hard to know "which tab is the current cc_agent").
- No standardized way for one CLI to send a prompt to another specific tab and get a traceable result back.
- Workflow state is scattered (some in MB, some in local files, some in human memory).
- Hard to audit "what did tab X actually produce for this trace?"
- Risk of context leakage or lost outputs across long sessions.

---

## Target Model: Named Terminal Tabs + Structured Bus

**Every participant is a named Terminal Tab.**

Examples:
- `tab:cc_agent` (primary Claude Code agent for this workspace)
- `tab:oc_agent` (Codex / other code-focused)
- `tab:grok` (Grok 4.x instance)
- `tab:main` (user's main interactive shell)
- `tab:workflow-orchestrator`
- `tab:neoma-memory-bridge`
- `tab:chrome-bridge` (when relevant)

**Communication is always through the Memory Bridge (or cli_dispatch) using structured envelopes.**

Every exchange must carry:
- `source` (the sending tab)
- `target` (receiving tab or "broadcast")
- `trace` / `parent_key` (for lineage)
- `ternary_conf`
- `timestamp`
- `payload` (the actual prompt or result)
- Optional `workflow_id`, `step_id`, `checkpoint`

**Standard verbs (to be implemented as small, callable helpers):**
- `register_tab(tabId, {capabilities, cwd, pid, entrypoint})`
- `send_prompt_to_tab(targetTab, prompt, {traceId?, workflowId?})`
- `check_or_poll_result(tabId, traceId)` (returns latest output envelope or "still working")
- `broadcast(eventType, payload)`
- `list_active_tabs()`
- `unregister_tab(tabId)`
- `record_checkpoint(workflowId, step, status, evidence)`

Results are always stored back to MB under a results namespace so any participant (or human via `recall`) can retrieve and verify them later.

---

## Workflow Cleanliness Rules

1. **Every significant handoff is explicit.**
   - End of one tab's work → store result + trace → send_prompt_to_tab or broadcast.
   - Receiving tab must acknowledge or pick up the trace.

2. **Use traces and parent_keys religiously.**
   - Every prompt gets a trace. Results reference the originating trace.
   - This gives full lineage (exactly what the narrator/self-oversight rules want).

3. **Checkpoints are mandatory at action boundaries.**
   - Before major state change, long-running work, or handoff: write a checkpoint to MB (or local + MB sync).
   - Use `neoma-narrate --write` or equivalent at important boundaries (per existing narrator self-oversight rule).

4. **Tab registry is the source of truth for "who is alive".**
   - On startup, every CLI registers.
   - On clean exit, it unregisters.
   - `list_active_tabs()` should always be cheap and reliable.

5. **No silent failure or lost output.**
   - If a tab is asked to do work, the result (success, partial, or failure with evidence) must be written back under the trace.
   - Human or another agent can always ask "what did tab:oc_agent produce for trace XYZ?"

6. **Prefer existing infrastructure.**
   - Memory Bridge + structured_envelope_v1 is the bus.
   - `delegate-task` and `huddle` are high-level conveniences on top.
   - `gnome-session` for any real desktop/tab manipulation.
   - Existing session hooks for lifecycle.

7. **Governance tie-in.**
   - New coordination elements (orchestrator script, new MB namespaces) get guardian registration + minimum wheelwright tests (liveness, output correctness, integrity).
   - Keep trust level appropriate (start T0/T1).

---

## Proposed Implementation Pieces

### 1. Terminal Tab Registry (lightweight)
A small script or MB-backed module:
- `register_tab`, `list_active_tabs`, `unregister_tab`.
- Can live as a Python/zero-dep helper or Bun/TS helper callable from any CLI.
- Stores under MB namespace `terminal_tabs/<tabId>` with last_seen, capabilities, etc.

### 2. Prompt/Result Helpers
Small reusable functions (one per language the agents actually use):
- `send_prompt_to_tab(...)` → writes envelope to MB + optional direct CLI signal.
- `check_result(traceId)` → retrieves latest matching result envelope(s).
- Idempotent and traceable.

Example envelope shape (extending existing `structured_envelope_v1`):
```json
{
  "source": "tab:cc_agent",
  "target": "tab:oc_agent",
  "version": "terminal_tab_v1",
  "trace": "20260616_abc123",
  "parent_key": "workflow:level2-vertical-slice/step-3",
  "workflow_id": "oregon-to-explore-v1",
  "step_id": "add-place-scene",
  "timestamp": "2026-06-16T...",
  "ternary_conf": 1,
  "payload": {
    "type": "prompt" | "result" | "checkpoint",
    "prompt": "...",
    "result": { "status": "done", "output_summary": "...", "artifacts": [...] },
    "error": null
  }
}
```

### 3. Workflow Bus (optional but powerful)
A tiny orchestrator (or just conventions + a script) that can:
- Load a declared workflow (JSON/YAML steps with "from_tab", "to_tab", "verify" rules).
- Drive the send/check/record loop.
- Surface status cleanly ("step 4 waiting on tab:oc_agent result for trace 123").

### 4. Visual / Desktop Layer
- Use `gnome-session` skill + explicit tab naming.
- Hooks already have `tab-signal-*` — strengthen and document them.
- For heavy automation, combine chrome-bridge (when in browser tabs) with gnome-session (for actual terminal windows).

### 5. Cleanliness & Improvement Mechanisms
- Every workflow step that crosses tabs ends with a MB store + optional narrator observation.
- Periodic "workflow health" check (similar to neoma-quick-check).
- Easy "what is currently in flight across all tabs?" command.
- Full trace export for post-session review or adversarial review.

---

## Recommended First Deliverables (Actionable)

1. **Protocol document** (this file is the start — promote and expand it).
2. **Tab registry + send/check helpers** (zero-dep Python first, then equivalents for other runtimes the agents use).
3. **Registration on startup** for the major agents (cc_agent, oc_agent, etc.).
4. **A small `list-tabs` / `send-to-tab` / `wait-result` CLI or skill command.
5. **One worked example** tied to the Level 2 visual work: cc_agent sends a prompt to oc_agent to implement the first PlaceScene slice, oc_agent produces result + artifacts, cc_agent verifies and integrates.

---

## Immediate Next Steps for This Workstream

- Inventory current running CLIs/tabs and how they are currently launched (tmux sessions? separate gnome-terminal windows? systemd user services?).
- Decide on primary namespace in MB for terminal_tabs and workflow_bus.
- Prototype the register + send + check helpers.
- Add startup registration to the main agent entrypoints / launch scripts.
- Test a real round-trip between two tabs (e.g., cc_agent ↔ oc_agent) on a trivial task.
- Document the naming convention and make `list_active_tabs` available to humans and other CLIs.

---

## Relationship to the Game Plan

This coordination protocol directly enables the Oregon Trail → Level 2 Explore work (and all future ambitious multi-agent sessions):
- cc_agent can cleanly task oc_agent with rendering changes.
- oc_agent can report back screenshots/artifacts/results under a trace.
- The orchestrator (or human) can drive the 7-step sequence with visibility.
- All outputs remain auditable and grounded.

Keep both workstreams visible to each other via shared traces / workflow_ids.

---

## Governance Notes

- This is infrastructure that affects multiple agents and sessions → apply the governance filter (Safe? Wise? Only Appealing?).
- New MB namespaces should be read/write limited appropriately.
- Start with low trust; promote after wheelwright tests and human acknowledgment.
- Must not create new secret leakage or external network calls unless explicitly approved.

---

**Status:** Initial protocol defined. Ready for prototype implementation.

Update this document as the actual helpers, naming conventions, and worked examples are built. All future multi-CLI work (including the visual Level 2 slices) should reference and use this protocol.