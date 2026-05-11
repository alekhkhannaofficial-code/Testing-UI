"use client";

import { Loader2 } from "lucide-react";

interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  state: "partial-call" | "call" | "result";
  args: Record<string, unknown>;
  result?: unknown;
}

const basename = (p: unknown): string | null =>
  typeof p === "string" && p ? p.split("/").pop() ?? p : null;

export function getToolLabel(
  toolName: string,
  args: Record<string, unknown>,
  state: "partial-call" | "call" | "result"
): string {
  const done = state === "result";
  const fallback = done ? "Done" : "Working...";

  if (toolName === "str_replace_editor") {
    const file = basename(args.path);
    if (!file) return fallback;
    switch (args.command) {
      case "create":      return done ? `Created ${file}`   : `Creating ${file}`;
      case "str_replace": return done ? `Updated ${file}`   : `Updating ${file}`;
      case "insert":      return done ? `Edited ${file}`    : `Editing ${file}`;
      case "view":        return done ? `Read ${file}`      : `Reading ${file}`;
      case "undo_edit":   return done ? `Reverted ${file}`  : `Reverting ${file}`;
      default:            return fallback;
    }
  }

  if (toolName === "file_manager") {
    const file = basename(args.path);
    if (!file) return fallback;
    switch (args.command) {
      case "delete": return done ? `Deleted ${file}` : `Deleting ${file}`;
      case "rename": {
        const newFile = basename(args.new_path);
        if (newFile) return done ? `Renamed ${file} → ${newFile}` : `Renaming ${file} → ${newFile}`;
        return done ? `Renamed ${file}` : `Renaming ${file}...`;
      }
      default: return fallback;
    }
  }

  return toolName;
}

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const { toolName, args, state, result } = toolInvocation;
  const complete = state === "result" && Boolean(result);
  const label = getToolLabel(toolName, args, state);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {complete ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
