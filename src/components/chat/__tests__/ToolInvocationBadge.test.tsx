import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { getToolLabel, ToolInvocationBadge } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// getToolLabel — str_replace_editor
// ---------------------------------------------------------------------------

test("str_replace_editor create pending", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "src/App.jsx" }, "call")).toBe("Creating App.jsx");
});

test("str_replace_editor create done", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "src/App.jsx" }, "result")).toBe("Created App.jsx");
});

test("str_replace_editor str_replace pending", () => {
  expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "src/Card.tsx" }, "call")).toBe("Updating Card.tsx");
});

test("str_replace_editor str_replace done", () => {
  expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "src/Card.tsx" }, "result")).toBe("Updated Card.tsx");
});

test("str_replace_editor insert pending", () => {
  expect(getToolLabel("str_replace_editor", { command: "insert", path: "src/Button.tsx" }, "call")).toBe("Editing Button.tsx");
});

test("str_replace_editor insert done", () => {
  expect(getToolLabel("str_replace_editor", { command: "insert", path: "src/Button.tsx" }, "result")).toBe("Edited Button.tsx");
});

test("str_replace_editor view pending", () => {
  expect(getToolLabel("str_replace_editor", { command: "view", path: "src/index.ts" }, "call")).toBe("Reading index.ts");
});

test("str_replace_editor view done", () => {
  expect(getToolLabel("str_replace_editor", { command: "view", path: "src/index.ts" }, "result")).toBe("Read index.ts");
});

test("str_replace_editor undo_edit pending", () => {
  expect(getToolLabel("str_replace_editor", { command: "undo_edit", path: "src/App.tsx" }, "call")).toBe("Reverting App.tsx");
});

test("str_replace_editor undo_edit done", () => {
  expect(getToolLabel("str_replace_editor", { command: "undo_edit", path: "src/App.tsx" }, "result")).toBe("Reverted App.tsx");
});

// ---------------------------------------------------------------------------
// getToolLabel — file_manager
// ---------------------------------------------------------------------------

test("file_manager delete pending", () => {
  expect(getToolLabel("file_manager", { command: "delete", path: "src/Button.tsx" }, "call")).toBe("Deleting Button.tsx");
});

test("file_manager delete done", () => {
  expect(getToolLabel("file_manager", { command: "delete", path: "src/Button.tsx" }, "result")).toBe("Deleted Button.tsx");
});

test("file_manager rename with both paths pending", () => {
  expect(getToolLabel("file_manager", { command: "rename", path: "Old.tsx", new_path: "New.tsx" }, "call")).toBe("Renaming Old.tsx → New.tsx");
});

test("file_manager rename with both paths done", () => {
  expect(getToolLabel("file_manager", { command: "rename", path: "Old.tsx", new_path: "New.tsx" }, "result")).toBe("Renamed Old.tsx → New.tsx");
});

test("file_manager rename with only path (new_path not streamed yet) pending", () => {
  expect(getToolLabel("file_manager", { command: "rename", path: "Old.tsx" }, "partial-call")).toBe("Renaming Old.tsx...");
});

test("file_manager rename with only path done", () => {
  expect(getToolLabel("file_manager", { command: "rename", path: "Old.tsx" }, "result")).toBe("Renamed Old.tsx");
});

// ---------------------------------------------------------------------------
// getToolLabel — path basename extraction
// ---------------------------------------------------------------------------

test("extracts basename from deep path", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "src/components/deep/App.jsx" }, "call")).toBe("Creating App.jsx");
});

test("works with filename-only path (no slash)", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "App.jsx" }, "call")).toBe("Creating App.jsx");
});

// ---------------------------------------------------------------------------
// getToolLabel — partial-call / empty args edge cases
// ---------------------------------------------------------------------------

test("str_replace_editor with empty args during partial-call shows Working...", () => {
  expect(getToolLabel("str_replace_editor", {}, "partial-call")).toBe("Working...");
});

test("file_manager with empty args during call shows Working...", () => {
  expect(getToolLabel("file_manager", {}, "call")).toBe("Working...");
});

test("empty args with result state shows Done", () => {
  expect(getToolLabel("str_replace_editor", {}, "result")).toBe("Done");
});

test("known tool with unknown command shows fallback", () => {
  expect(getToolLabel("str_replace_editor", { command: "unknown_cmd", path: "App.tsx" }, "call")).toBe("Working...");
});

// ---------------------------------------------------------------------------
// getToolLabel — unknown toolName
// ---------------------------------------------------------------------------

test("unknown toolName returns toolName as-is when pending", () => {
  expect(getToolLabel("some_other_tool", {}, "call")).toBe("some_other_tool");
});

test("unknown toolName returns toolName as-is when done", () => {
  expect(getToolLabel("some_other_tool", {}, "result")).toBe("some_other_tool");
});

// ---------------------------------------------------------------------------
// ToolInvocationBadge component rendering
// ---------------------------------------------------------------------------

test("shows spinner when state is call", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{ toolCallId: "1", toolName: "str_replace_editor", state: "call", args: { command: "create", path: "App.jsx" } }}
    />
  );
  expect(container.querySelector(".animate-spin")).not.toBeNull();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("shows spinner when state is partial-call", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{ toolCallId: "1", toolName: "str_replace_editor", state: "partial-call", args: {} }}
    />
  );
  expect(container.querySelector(".animate-spin")).not.toBeNull();
});

test("shows green dot when state is result with truthy result", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{ toolCallId: "1", toolName: "str_replace_editor", state: "result", args: { command: "create", path: "App.jsx" }, result: "ok" }}
    />
  );
  expect(container.querySelector(".bg-emerald-500")).not.toBeNull();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("shows spinner when state is result but result is falsy", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{ toolCallId: "1", toolName: "str_replace_editor", state: "result", args: { command: "create", path: "App.jsx" }, result: undefined }}
    />
  );
  expect(container.querySelector(".animate-spin")).not.toBeNull();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("renders human-readable label text", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{ toolCallId: "1", toolName: "str_replace_editor", state: "call", args: { command: "create", path: "App.jsx" } }}
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("badge wrapper has correct classes", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{ toolCallId: "1", toolName: "file_manager", state: "call", args: { command: "delete", path: "Button.tsx" } }}
    />
  );
  const badge = container.firstChild as HTMLElement;
  expect(badge.className).toContain("font-mono");
  expect(badge.className).toContain("bg-neutral-50");
  expect(badge.className).toContain("border-neutral-200");
  expect(badge.className).toContain("rounded-lg");
});
