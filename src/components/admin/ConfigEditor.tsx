"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { PortfolioConfigSchema } from "@/types/portfolio-schema";
import type { PortfolioConfig } from "@/types/portfolio-schema";
import Presentation from "@/components/chat/tools/Presentation";
import CVCard from "@/components/chat/tools/CVCard";
import Projects from "@/components/chat/tools/projects/Projects";
import Resume from "@/components/chat/tools/Resume";
import Certifications from "@/components/chat/tools/Certifications";
import Contacts from "@/components/chat/tools/Contacts";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
// --- Local Types for Components & State ---

type IndexableObject = Record<string, unknown>;

interface SimpleInputProps {
  value: string | number | undefined;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
}

interface StringArrayEditorProps {
  value?: string[];
  onChange: (value: string[]) => void;
  label: string;
}

interface JsonModalState {
  path: string;
  text: string;
}

// --- Utilities: PortfolioConfig Path-Based Accessors ---

/**
 * Gets a value from a PortfolioConfig using a path.
 * The object type is fixed as PortfolioConfig.
 * @param obj The PortfolioConfig object to read from.
 * @param path The dot-notation path (e.g., "personal.name" or "projects[0].title").
 * @returns The value at the path, or undefined.
 */
function getByPath(
  obj: PortfolioConfig | null | undefined,
  path: string,
): unknown {
  if (!path || obj === null || obj === undefined) return obj;
  const parts = path.replace(/\[(\d+)\]/g, (m, n) => `.${n}`).split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur === null || cur === undefined) return undefined;
    // Assert that the current value can be indexed
    if (typeof cur !== "object") return undefined;
    cur = (cur as IndexableObject)[p];
  }
  return cur;
}

/**
 * Sets a value in a cloned PortfolioConfig using a path.
 * Returns a new instance of PortfolioConfig.
 * @param obj The original PortfolioConfig object.
 * @param path The dot-notation path.
 * @param value The value to set.
 * @returns A cloned PortfolioConfig with the updated value.
 */
function setByPath(
  obj: PortfolioConfig | null | undefined,
  path: string,
  value: unknown,
): PortfolioConfig {
  if (!path) throw new Error("Path required");
  const parts = path.replace(/\[(\d+)\]/g, (m, n) => `.${n}`).split(".");

  // Deep clone the object, ensuring we start with a PortfolioConfig structure if obj is null/undefined
  const cloned: PortfolioConfig = JSON.parse(JSON.stringify(obj ?? {}));
  let cur: IndexableObject = cloned;

  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];

    // Ensure we can traverse further
    if (cur[p] == null || typeof cur[p] !== "object") {
      // Create array or object based on next segment if needed
      cur[p] = /^\d+$/.test(parts[i + 1]) ? [] : {};
    }

    // Assert type for the next traversal step
    if (typeof cur[p] === "object" && cur[p] !== null) {
      cur = cur[p] as IndexableObject;
    } else {
      // Fallback for primitive that should be an object/array (type corruption)
      cur[p] = /^\d+$/.test(parts[i + 1]) ? [] : {};
      cur = cur[p] as IndexableObject;
    }
  }
  // Set the final value
  cur[parts[parts.length - 1]] = value;
  return cloned; // The function now always returns PortfolioConfig
}

// --- UI: Simplified Inputs ---

function SimpleInput({
  label,
  value,
  onChange,
  placeholder = "",
}: SimpleInputProps) {
  const displayValue =
    value === undefined || value === null ? "" : String(value);

  return (
    <label className="block text-sm">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <input
        className="w-full rounded-md border px-3 py-2 text-sm"
        value={displayValue}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

// --- Array editor (strings) ---

function StringArrayEditor({
  value = [],
  onChange,
  label,
}: StringArrayEditorProps) {
  const arr = Array.isArray(value) ? value : ([] as string[]);

  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="space-y-2">
        {arr.map((v: string, i: number) => (
          <div key={i} className="flex gap-2">
            <input
              className="flex-1 rounded-md border px-2 py-1 text-sm"
              value={v}
              onChange={(e) => {
                const copy = [...arr];
                copy[i] = e.target.value;
                onChange(copy);
              }}
            />
            <button
              className="px-2 rounded bg-red-50 hover:bg-red-100 text-xs"
              onClick={() => {
                const copy = arr.filter((_, idx) => idx !== i);
                onChange(copy);
              }}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          className="mt-2 px-3 py-1 rounded bg-white hover:bg-gray-200 border-1 text-sm"
          onClick={() => onChange([...arr, ""])}
        >
          Add
        </button>
      </div>
    </div>
  );
}

// --- Main Component ---

export default function ConfigEditorWrapper() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverMsg, setServerMsg] = useState<string | null>(null);
  const [token, setToken] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("adminToken") ?? "";
  });

  const [mode, setMode] = useState<"form" | "json">("form");

  // State is strictly PortfolioConfig or null
  const [orig, setOrig] = useState<PortfolioConfig | null>(null);
  const [draft, setDraft] = useState<PortfolioConfig | null>(null);

  const [settings, setSettings] = useState<{ editorAdminOnly?: boolean }>({});
  const [jsonModal, setJsonModal] = useState<JsonModalState | null>(null);

  // Initial config load logic
  async function loadAll() {
    setLoading(true);
    setServerMsg(null);
    try {
      const [cfgRes, sres] = await Promise.all([
        fetch("/api/admin/config"),
        fetch("/api/admin/settings"),
      ]);
      const cfgJson = (await cfgRes.json()) as {
        ok: boolean;
        config?: PortfolioConfig;
        error?: string;
      };
      const sJson = (await sres.json()) as {
        ok: boolean;
        settings?: typeof settings;
        error?: string;
      };

      if (cfgJson?.ok && cfgJson.config) {
        setOrig(cfgJson.config);
        setDraft(JSON.parse(JSON.stringify(cfgJson.config)));
      } else {
        setServerMsg(cfgJson?.error ?? "Failed to fetch config");
      }

      if (sJson?.ok) {
        setSettings(sJson.settings ?? {});
      }
    } catch (err) {
      const error = err as Error;
      setServerMsg(error?.message ?? "Network error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined")
      sessionStorage.setItem("adminToken", token ?? "");
  }, [token]);

  const [isAuthorized, setAuthorized] = useState<boolean>(false);

  // Validation
  function validateDraft(draftToVaildate?: PortfolioConfig | null): {
    ok: boolean;
    errors?: unknown;
  } {
    draftToVaildate = draftToVaildate || draft;
    if (!draftToVaildate) return { ok: false, errors: ["No draft"] };
    try {
      const validation = PortfolioConfigSchema.safeParse(draftToVaildate);
      if (validation.success) {
        return { ok: true };
      } else {
        return { ok: false, errors: validation.error.issues };
      }
    } catch (err) {
      const error = err as Error;
      return { ok: false, errors: error?.message ?? "Invalid" };
    }
  }

  // Save handler (unchanged logic)
  async function handleSave() {
    setServerMsg(null);
    const draftWithTime = setByPath(
      draft,
      "meta.generatedAt",
      new Date().toISOString(),
    );
    const v = validateDraft(draftWithTime);
    if (!v.ok) {
      toast.error("Validation failed. Check errors in console.");
      console.error(v.errors);
      return;
    }
    if (!token) {
      toast.error("Admin token required to save.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({
          action: "save",
          content: JSON.stringify(draftWithTime),
        }),
      });

      const json = (await res.json()) as {
        ok: boolean;
        error?: string;
        saved?: boolean;
        message?: string;
        base64?: string;
      };
      if (!json.ok) {
        toast.error(json.error ?? "Save failed");
        setServerMsg(json.error ?? "Save failed");
      } else {
        if (json.saved) {
          toast.success("Saved to disk and reloaded.");
          await loadAll();
          router.refresh();
        } else {
          toast.success("Server returned base64 (copy to env).");
          setServerMsg(
            json.message ?? "Config saved but requires manual env update.",
          );
          if (json.base64) {
            navigator.clipboard?.writeText(json.base64).catch(() => {});
            toast("Base64 copied to clipboard (also in server message).");
          }
        }
      }
    } catch (err) {
      const error = err as Error;
      setServerMsg(error?.message ?? "Network error");
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleReload() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ action: "reload" }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success("Reloaded server cache.");
        await loadAll();
        router.refresh();
      } else {
        toast.error(json.error ?? "Reload failed");
        setServerMsg(json.error ?? "Reload failed");
      }
    } catch (err) {
      setServerMsg(err instanceof Error ? err.message : "Network");
    } finally {
      setLoading(false);
    }
  }

  async function setEditorAdminOnly(next: boolean) {
    if (!token) {
      toast.error("Admin token required.");
      return;
    }
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ editorAdminOnly: next }),
      });
      const json = await res.json();
      console.log(res);
      setAuthorized(res.status == 200);
      if (json.ok) {
        setSettings(json.settings);
        toast.success("Editor visibility updated.");
      } else toast.error(json.error ?? "Failed to update");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Network");
    }
  }

  // JSON modal handlers
  function openJsonForPath(path: string) {
    const val = getByPath(draft, path);
    const text = JSON.stringify(val ?? {}, null, 2);
    setJsonModal({ path, text });
  }

  function applyJsonModal() {
    if (!jsonModal || !draft) return;
    try {
      const parsed = JSON.parse(jsonModal.text) as unknown;

      // setByPath returns PortfolioConfig
      const nextDraftCandidate = setByPath(draft, jsonModal.path, parsed);

      // Re-validate the full draft
      const validation = PortfolioConfigSchema.safeParse(nextDraftCandidate);

      if (validation.success) {
        setDraft(validation.data);
        setJsonModal(null);
        toast.success("Field updated and draft is valid.");
      } else {
        console.error(
          "JSON update caused validation failure:",
          validation.error.issues,
        );
        toast.error(
          "Invalid JSON or configuration structure after update. Check console.",
        );
      }
    } catch (err) {
      toast.error("Invalid JSON syntax.");
    }
  }

  // Form editor update helper
  function updateField(path: string, value: unknown) {
    if (!draft) return;

    // setByPath returns PortfolioConfig
    const next = setByPath(draft, path, value);
    setDraft(next);
  }

  type SkillSection = PortfolioConfig["skills"][number];
  type ProjectItem = PortfolioConfig["projects"][number];

  const hideEditor = !!settings.editorAdminOnly && !isAuthorized;

  // UI
  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-semibold">Portfolio Config Editor</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Two-mode editor (Form / JSON), per-field JSON editing, live preview.
            Changes are only persisted after{" "}
            {<span className={"font-bold"}>Save</span>}.
          </p>
        </div>

        <div className="flex flex-col gap-2 items-end">
          <div className={"border-box rounded-md border"}>
            <input
              placeholder="Admin token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="px-3 py-1 text-sm"
            />
            <button
              onClick={() => {
                setEditorAdminOnly(!!settings.editorAdminOnly);
              }}
            >
              <LogIn className={"h-3 cursor-pointer"} />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded bg-white hover:bg-gray-200 border text-sm"
              onClick={() => loadAll()}
              disabled={loading}
            >
              Refresh
            </button>
            <button
              className="px-3 py-1 rounded bg-white hover:bg-gray-200 border text-sm"
              onClick={() => handleReload()}
              disabled={loading}
            >
              Reload server cache
            </button>
            <button
              className="px-3 py-1 rounded bg-white hover:bg-gray-200 border text-sm"
              onClick={() => handleSave()}
              disabled={!draft || hideEditor || loading}
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* --- Main Content Grid --- */}
      <div className="mt-4 grid grid-cols-1 gap-4">
        {/* Left: Editor (form or JSON) */}
        <div className="col-span-2 space-y-4">
          {hideEditor ? (
            <div className="p-4 rounded-md border bg-yellow-50">
              <strong>Editor is restricted to admins.</strong>
              <div className="text-sm text-muted-foreground mt-2">
                Provide the admin token or ask an admin to enable editing.
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between">
                <div className={"flex gap-2"}>
                  <button
                    className={`px-3 py-1 rounded ${mode === "form" ? "bg-primary text-white" : "bg-white hover:bg-gray-100 border"}`}
                    onClick={() => setMode("form")}
                  >
                    Form mode
                  </button>
                  <button
                    className={`px-3 py-1 rounded ${mode === "json" ? "bg-primary text-white" : "bg-white hover:bg-gray-100 border"}`}
                    onClick={() => setMode("json")}
                  >
                    JSON mode
                  </button>
                </div>
                <div className="flex justify-between gap-2">
                  <button
                    className="px-3 py-1 rounded bg-white hover:bg-gray-100 border"
                    onClick={() => {
                      // download current draft as file
                      if (!draft) {
                        toast.error("No valid draft to download.");
                        return;
                      }
                      const blob = new Blob([JSON.stringify(draft, null, 2)], {
                        type: "application/json",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `portfolio-config-draft-${new Date().toISOString().slice(0, 10)}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Download draft
                  </button>
                  <button
                    className="px-3 py-1 rounded bg-white hover:bg-gray-100 border"
                    onClick={() => {
                      if (!draft) {
                        toast.error("No valid draft to copy.");
                        return;
                      }
                      try {
                        const base64 = Buffer.from(
                          JSON.stringify(draft, null, 2),
                        ).toString("base64");
                        console.log(base64);
                        navigator.clipboard.writeText(base64).then(() => {
                          toast.success("Base64 copied to clipboard!");
                        });
                      } catch (err) {
                        console.error(err);
                        toast.error("Failed to copy draft.");
                      }
                    }}
                  >
                    Copy Base64
                  </button>
                </div>
              </div>

              {mode === "json" ? (
                <div>
                  <textarea
                    rows={28}
                    className="w-full p-3 mt-2 font-mono text-sm rounded-md border"
                    value={draft ? JSON.stringify(draft, null, 2) : ""}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value) as unknown;
                        const validation =
                          PortfolioConfigSchema.safeParse(parsed);
                        if (validation.success) {
                          // Only update if it passes full schema validation
                          setDraft(validation.data);
                        } else {
                          // Log error but keep the current *valid* draft
                          console.error(
                            "JSON syntax OK, but schema validation failed:",
                            validation.error.issues,
                          );
                        }
                      } catch {
                        // Invalid JSON syntax - ignore change and keep current valid draft
                      }
                    }}
                  />
                  <div className="mt-2 text-sm">
                    <em>Validation:</em>{" "}
                    {validateDraft().ok ? (
                      <span className="text-green-600">OK</span>
                    ) : (
                      <span className="text-red-600">
                        Invalid (see console for details)
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Form editor: show sections for meta, personal, socials, jobInterest, skills, projects, resume */}
                  <div className="columns-1 xl:columns-2 gap-4 mt-2">
                    {/* meta */}
                    <div className="rounded-md border p-3 break-inside-avoid mb-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold">Meta</h3>
                        <button
                          className="text-xs"
                          onClick={() => openJsonForPath("meta")}
                        >
                          Edit JSON
                        </button>
                      </div>
                      <SimpleInput
                        label="Version"
                        value={
                          getByPath(draft, "meta.version") as string | undefined
                        }
                        onChange={(v) => updateField("meta.version", v)}
                      />
                      <SimpleInput
                        label="Author"
                        value={
                          getByPath(draft, "meta.author") as string | undefined
                        }
                        onChange={(v) => updateField("meta.author", v)}
                      />
                      <SimpleInput
                        label="Changelog"
                        value={
                          getByPath(draft, "meta.changelog") as
                            | string
                            | undefined
                        }
                        onChange={(v) => updateField("meta.changelog", v)}
                      />
                    </div>

                    {/* personal */}
                    <div className="rounded-md border p-3 break-inside-avoid mb-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold">Personal</h3>
                        <button
                          className="text-xs"
                          onClick={() => openJsonForPath("personal")}
                        >
                          Edit JSON
                        </button>
                      </div>
                      <SimpleInput
                        label="Name"
                        value={
                          getByPath(draft, "personal.name") as
                            | string
                            | undefined
                        }
                        onChange={(v) => updateField("personal.name", v)}
                      />
                      <SimpleInput
                        label="Title"
                        value={
                          getByPath(draft, "personal.title") as
                            | string
                            | undefined
                        }
                        onChange={(v) => updateField("personal.title", v)}
                      />
                      {/* NOTE: Bio is better as a textarea, but keeping SimpleInput for brevity */}
                      <SimpleInput
                        label="Bio"
                        value={
                          getByPath(draft, "personal.bio") as string | undefined
                        }
                        onChange={(v) => updateField("personal.bio", v)}
                      />
                      <SimpleInput
                        label="Email"
                        value={
                          getByPath(draft, "personal.email") as
                            | string
                            | undefined
                        }
                        onChange={(v) => updateField("personal.email", v)}
                      />
                      <SimpleInput
                        label="Handle"
                        value={
                          getByPath(draft, "personal.handle") as
                            | string
                            | undefined
                        }
                        onChange={(v) => updateField("personal.handle", v)}
                      />
                      <SimpleInput
                        label="Avatar src"
                        value={
                          getByPath(draft, "personal.avatar.src") as
                            | string
                            | undefined
                        }
                        onChange={(v) => updateField("personal.avatar.src", v)}
                      />
                    </div>

                    {/* socials */}
                    <div className="rounded-md border p-3 break-inside-avoid mb-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold">Socials</h3>
                        <button
                          className="text-xs"
                          onClick={() => openJsonForPath("socials")}
                        >
                          Edit JSON
                        </button>
                      </div>
                      <SimpleInput
                        label="Website"
                        value={
                          getByPath(draft, "socials.website") as
                            | string
                            | undefined
                        }
                        onChange={(v) => updateField("socials.website", v)}
                      />
                      <SimpleInput
                        label="GitHub"
                        value={
                          getByPath(draft, "socials.github") as
                            | string
                            | undefined
                        }
                        onChange={(v) => updateField("socials.github", v)}
                      />
                      <SimpleInput
                        label="LinkedIn"
                        value={
                          getByPath(draft, "socials.linkedin") as
                            | string
                            | undefined
                        }
                        onChange={(v) => updateField("socials.linkedin", v)}
                      />
                    </div>

                    {/* job interest */}
                    <div className="rounded-md border p-3 break-inside-avoid mb-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold">
                          Job / Interest
                        </h3>
                        <button
                          className="text-xs"
                          onClick={() => openJsonForPath("jobInterest")}
                        >
                          Edit JSON
                        </button>
                      </div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          // Cast boolean from unknown
                          checked={!!getByPath(draft, "jobInterest.seeking")}
                          onChange={(e) =>
                            updateField("jobInterest.seeking", e.target.checked)
                          }
                        />{" "}
                        Seeking
                      </label>
                      <SimpleInput
                        label="Type"
                        value={
                          getByPath(draft, "jobInterest.type") as
                            | string
                            | undefined
                        }
                        onChange={(v) => updateField("jobInterest.type", v)}
                      />
                      <SimpleInput
                        label="Availability"
                        value={
                          getByPath(draft, "jobInterest.availability") as
                            | string
                            | undefined
                        }
                        onChange={(v) =>
                          updateField("jobInterest.availability", v)
                        }
                      />
                      <StringArrayEditor
                        label="Focus Areas"
                        value={
                          getByPath(draft, "jobInterest.focusAreas") as
                            | string[]
                            | undefined
                        }
                        onChange={(v) =>
                          updateField("jobInterest.focusAreas", v)
                        }
                      />
                    </div>

                    {/* skills */}
                    <div className="rounded-md border p-3 md:col-span-2 break-inside-avoid mb-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold">Skills</h3>
                        <button
                          className="text-xs"
                          onClick={() => openJsonForPath("skills")}
                        >
                          Edit JSON
                        </button>
                      </div>
                      <div className="mt-2 space-y-3">
                        {/* Array iteration now safely uses PortfolioConfig type assertion */}
                        {(
                          (getByPath(draft, "skills") as SkillSection[]) ?? []
                        ).map((sk, idx) => (
                          <div
                            key={idx}
                            className="grid grid-cols-2 gap-2 items-start"
                          >
                            <input
                              value={sk.name ?? ""}
                              onChange={(e) => {
                                const arr = [
                                  ...((getByPath(
                                    draft,
                                    "skills",
                                  ) as SkillSection[]) ?? []),
                                ];
                                arr[idx] = {
                                  ...arr[idx],
                                  name: e.target.value,
                                };
                                updateField("skills", arr);
                              }}
                              className="rounded-md border px-2 py-1"
                            />
                            <input
                              value={(sk.items || []).join(", ")}
                              onChange={(e) => {
                                const arr = [
                                  ...((getByPath(
                                    draft,
                                    "skills",
                                  ) as SkillSection[]) ?? []),
                                ];
                                arr[idx] = {
                                  ...arr[idx],
                                  items: e.target.value
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                };
                                updateField("skills", arr);
                              }}
                              className="rounded-md border px-2 py-1"
                            />
                            <div className="col-span-2 flex gap-2">
                              <button
                                onClick={() => {
                                  const arr = [
                                    ...((getByPath(
                                      draft,
                                      "skills",
                                    ) as SkillSection[]) ?? []),
                                  ];
                                  arr.splice(idx, 1);
                                  updateField("skills", arr);
                                }}
                                className="px-2 py-1 rounded bg-red-50 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const arr = [
                              ...((getByPath(
                                draft,
                                "skills",
                              ) as SkillSection[]) ?? []),
                            ];
                            arr.push({
                              id: `skill-${Date.now()}`,
                              name: "New Skill Group",
                              items: [],
                            });
                            updateField("skills", arr);
                          }}
                          className="px-3 py-1 rounded bg-primary text-white text-sm"
                        >
                          Add Skill
                        </button>
                      </div>
                    </div>

                    {/* projects (simple) */}
                    <div className="rounded-md border p-3 md:col-span-2 break-inside-avoid mb-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold">Projects</h3>
                        <button
                          className="text-xs"
                          onClick={() => openJsonForPath("projects")}
                        >
                          Edit JSON
                        </button>
                      </div>
                      <div className="space-y-3 mt-2">
                        {/* Array iteration now safely uses PortfolioConfig type assertion */}
                        {(
                          (getByPath(draft, "projects") as ProjectItem[]) ?? []
                        ).map((p, idx) => (
                          <div key={idx} className="rounded-md border p-2">
                            <div className="flex gap-2">
                              <input
                                value={p.title}
                                onChange={(e) => {
                                  const arr = [
                                    ...((getByPath(
                                      draft,
                                      "projects",
                                    ) as ProjectItem[]) ?? []),
                                  ];
                                  arr[idx] = {
                                    ...arr[idx],
                                    title: e.target.value,
                                  };
                                  updateField("projects", arr);
                                }}
                                className="flex-1 rounded-md border px-2 py-1"
                              />
                              <button
                                onClick={() => {
                                  const arr = [
                                    ...((getByPath(
                                      draft,
                                      "projects",
                                    ) as ProjectItem[]) ?? []),
                                  ];
                                  arr.splice(idx, 1);
                                  updateField("projects", arr);
                                }}
                                className="px-2 py-1 rounded bg-red-50 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                            <input
                              value={p.summary}
                              onChange={(e) => {
                                const arr = [
                                  ...((getByPath(
                                    draft,
                                    "projects",
                                  ) as ProjectItem[]) ?? []),
                                ];
                                arr[idx] = {
                                  ...arr[idx],
                                  summary: e.target.value,
                                };
                                updateField("projects", arr);
                              }}
                              className="w-full mt-2 rounded-md border px-2 py-1"
                            />
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const arr = [
                              ...((getByPath(
                                draft,
                                "projects",
                              ) as ProjectItem[]) ?? []),
                            ];
                            // Ensure minimum schema requirements are met
                            arr.push({
                              id: `proj-${Date.now()}`,
                              title: "New Project",
                              summary: "A brief summary of the new project.",
                              status: "prototype",
                              featured: false,
                              categories: [],
                              tech: [],
                              role: "creator",
                              achievements: [],
                              links: [],
                              images: [],
                              metrics: [],
                            });
                            updateField("projects", arr);
                          }}
                          className="px-3 py-1 rounded bg-primary text-white text-sm"
                        >
                          Add Project
                        </button>
                      </div>
                    </div>

                    {/* resume */}
                    <div className="rounded-md border p-3 md:col-span-2 break-inside-avoid mb-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold">Resume</h3>
                        <button
                          className="text-xs"
                          onClick={() => openJsonForPath("resume")}
                        >
                          Edit JSON
                        </button>
                      </div>
                      <SimpleInput
                        label="Resume URL"
                        value={
                          getByPath(draft, "resume.url") as string | undefined
                        }
                        onChange={(v) => updateField("resume.url", v)}
                      />
                      <SimpleInput
                        label="Format"
                        value={
                          getByPath(draft, "resume.format") as
                            | string
                            | undefined
                        }
                        onChange={(v) => updateField("resume.format", v)}
                      />
                      <SimpleInput
                        label="Last updated (ISO Date)"
                        value={
                          getByPath(draft, "resume.lastUpdated") as
                            | string
                            | undefined
                        }
                        onChange={(v) => updateField("resume.lastUpdated", v)}
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {serverMsg && (
            <div className="mt-3 p-3 rounded border bg-gray-50 text-sm">
              {serverMsg}
            </div>
          )}
        </div>

        {/* --- Right: live preview & settings --- */}
        <aside className="space-y-4">
          {/* Preview Section */}
          <div className="rounded-md border p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Preview</h3>
              <div className="text-xs text-muted-foreground">
                Draft preview (not saved)
              </div>
            </div>
            <div className="mt-2 space-y-3">
              {draft ? (
                <>
                  <div className="border rounded p-2">
                    <Presentation config={draft} />
                  </div>
                  <div className="border rounded p-2">
                    <CVCard
                      config={draft}
                      onContactClick={() => toast("Contact action (tool)")}
                    />
                  </div>
                  <div className="border rounded p-2">
                    <Projects config={draft} />
                  </div>
                  <div className="border rounded p-2">
                    <Resume
                      config={draft}
                      onContactClick={() => toast("Contact")}
                    />
                  </div>
                  <div className="border rounded p-2">
                    <Certifications config={draft} />
                  </div>
                  <div className="border rounded p-2">
                    <Contacts config={draft} />
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No draft to preview
                </div>
              )}
            </div>
          </div>

          {/* Editor visibility setting */}
          <div className="rounded-md border p-3">
            <h3 className="text-sm font-semibold">Editor Visibility</h3>
            <div className="mt-2 text-sm text-muted-foreground">
              Make the editor visible only to admins (requires admin token).
              Current:{" "}
              <strong>
                {settings.editorAdminOnly ? "Admin-only" : "Public"}
              </strong>
            </div>
            <div className="mt-2 flex gap-2">
              <button
                className={`px-3 py-1 rounded border ${!settings.editorAdminOnly ? "bg-black text-white" : "bg-white"}`}
                onClick={() => setEditorAdminOnly(false)}
              >
                Public
              </button>
              <button
                className={`px-3 py-1 rounded border ${settings.editorAdminOnly ? "bg-black text-white" : "bg-white"}`}
                onClick={() => setEditorAdminOnly(true)}
              >
                Admin-only
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* JSON per-field modal */}
      {jsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-md max-w-3xl w-full p-4">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold">Edit JSON: {jsonModal.path}</h4>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 rounded border"
                  onClick={() => setJsonModal(null)}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-1 rounded bg-primary text-white"
                  onClick={() => applyJsonModal()}
                >
                  Apply
                </button>
              </div>
            </div>
            <textarea
              rows={12}
              className="w-full p-3 mt-3 font-mono text-sm rounded-md border"
              value={jsonModal.text}
              onChange={(e) =>
                setJsonModal({ ...jsonModal, text: e.target.value })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
