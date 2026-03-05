"use client";

import React, {
  JSX,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import {
  useForm,
  useFieldArray,
  FormProvider,
  useFormContext,
  useWatch,
  Control,
  FieldPath,
  FieldValues,
  FieldErrors,
  ArrayPath,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { debounce } from "@/utils";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Disclosure } from "@headlessui/react";
import dynamic from "next/dynamic";
import {
  LogIn,
  Download,
  Copy,
  Search,
  Trash2,
  Plus,
  ChevronDown,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  PortfolioConfigSchema,
  type PortfolioConfig,
} from "@/types/portfolio-schema";
import { useRouter } from "next/navigation";
import Skeleton from "react-loading-skeleton";

/* -------------------------
   Lazy previews
   ------------------------- */
const LazyPresentation = dynamic(
  () => import("@/components/chat/tools/Presentation"),
  { ssr: false },
);
const LazyCVCard = dynamic(() => import("@/components/chat/tools/CVCard"), {
  ssr: false,
});
const LazyProjects = dynamic(
  () => import("@/components/chat/tools/projects/Projects"),
  { ssr: false },
);
const LazyResume = dynamic(() => import("@/components/chat/tools/Resume"), {
  ssr: false,
});
const LazyCertifications = dynamic(
  () => import("@/components/chat/tools/Certifications"),
  { ssr: false },
);
const LazyContacts = dynamic(() => import("@/components/chat/tools/Contacts"), {
  ssr: false,
});

/* -------------------------
   Types
   ------------------------- */
type FormData = z.infer<typeof PortfolioConfigSchema>;

type ZodTypeAny = z.ZodTypeAny;

type SchemaSection = {
  path: string;
  label: string;
  node: ZodTypeAny; // the original node (may be wrapped)
  children?: SchemaSection[];
};

type RenderProps<TFieldValues extends FieldValues = FormData> = {
  path: FieldPath<TFieldValues>;
  node?: ZodTypeAny;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  orig?: FormData | null;
};

/* -------------------------
   Utilities
   ------------------------- */

/**
 * Safely unwrap common Zod wrappers (Optional, Default, Nullable, Effects, Branded).
 * Keeps unwrapping while encountering wrapper types until the inner-most type is returned.
 *
 * We avoid using `any`. We use `unknown` and narrow to read `_def` and common inner properties.
 */
function unwrapZod(node?: ZodTypeAny): ZodTypeAny {
  let cur: unknown = node;
  const wrapperKinds = new Set<string>([
    "optional",
    "nullable",
    "default",
    "prefault",
    "nonoptional",
  ]);

  while (typeof cur === "object" && cur !== null) {
    const def = (cur as { def?: unknown }).def;
    if (!def || typeof def !== "object") break;

    const typeName = (def as { type: string }).type;
    if (!typeName || !wrapperKinds.has(typeName)) break;

    // common inner props: innerType, schema, type, arg, inner
    const inner =
      (def as { innerType?: ZodTypeAny }).innerType ??
      (def as { schema?: ZodTypeAny }).schema ??
      (def as { type?: ZodTypeAny }).type ??
      (def as { arg?: ZodTypeAny }).arg ??
      (def as { inner?: ZodTypeAny }).inner;

    if (!inner) break;
    cur = inner;
  }

  return cur as ZodTypeAny;
}

/**
 * Helper to obtain the shape of a ZodObject regardless of Zod version internals.
 */
function getObjectShape(
  obj: z.ZodObject<Record<string, ZodTypeAny>>,
): Record<string, ZodTypeAny> {
  const maybeDef = (obj as unknown as { _def?: unknown })._def;
  // modern Zod stores a function `_def.shape()` for lazy shape retrieval
  if (
    maybeDef &&
    typeof maybeDef === "object" &&
    "shape" in (maybeDef as object)
  ) {
    const def = maybeDef as { shape?: unknown };
    if (typeof def.shape === "function") {
      return (def.shape as () => Record<string, ZodTypeAny>)();
    }
  }

  // fallback: some Zod versions expose `.shape` directly
  const maybeShape = (obj as unknown as { shape?: Record<string, ZodTypeAny> })
    .shape;
  if (maybeShape && typeof maybeShape === "object") return maybeShape;

  // worst-case: return empty object (should not happen for z.object)
  return {};
}

/**
 * Get a value from an object by dot/bracket path (same as original).
 */
function getByPath<T = unknown>(obj: unknown, path: string): T | undefined {
  if (!path || obj == null) return undefined;
  const parts = path.replace(/\[(\d+)\]/g, (_, n) => `.${n}`).split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur as T | undefined;
}

/* -------------------------
   buildSections with unwrapping + memoization friendly
   ------------------------- */
function buildSections(
  shape: Record<string, ZodTypeAny>,
  basePath = "",
): SchemaSection[] {
  return Object.entries(shape).map(([key, child]) => {
    const path = basePath ? `${basePath}.${key}` : key;
    const label =
      key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1");
    const node = child as ZodTypeAny;
    const unwrapped = unwrapZod(node);
    let children: SchemaSection[] | undefined;

    if (unwrapped instanceof z.ZodObject) {
      const childShape = getObjectShape(
        unwrapped as z.ZodObject<Record<string, ZodTypeAny>>,
      );
      children = buildSections(childShape, path);
    }

    return { path, label, node, children };
  });
}

/* -------------------------
   Default generator for zod element types (for append())
   - unwrap before checking
   ------------------------- */
function getDefaultForZod(zodType: ZodTypeAny): unknown {
  const n = unwrapZod(zodType);

  if (n instanceof z.ZodObject) {
    // create an object with defaults (we keep empty object - you can expand to populate nested defaults)
    return {};
  }
  if (n instanceof z.ZodString) return "";
  if (n instanceof z.ZodNumber) return 0;
  if (n instanceof z.ZodBoolean) return false;
  if (n instanceof z.ZodArray) return [];
  if (n instanceof z.ZodEnum) return n.options[0] ?? "";
  // fallback
  return null;
}

/* -------------------------
   Compute top-level sections once (schema is static)
   ------------------------- */
const rootShape = ((): Record<string, ZodTypeAny> => {
  const unwrappedRoot = unwrapZod(PortfolioConfigSchema as ZodTypeAny);
  if (unwrappedRoot instanceof z.ZodObject) {
    return getObjectShape(
      unwrappedRoot as z.ZodObject<Record<string, ZodTypeAny>>,
    );
  }
  return {};
})();

const topLevelSections: SchemaSection[] = buildSections(rootShape);

function DraggableItem({
  id,
  children,
}: {
  id: string | number;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Drag Handle */}
      <div
        {...listeners}
        {...attributes}
        className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-gray-100 rounded-l-md"
      >
        <div className="flex flex-col gap-0.5">
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        </div>
      </div>
      {/* Content with left padding to avoid overlap with handle */}
      <div className="pl-8">{children}</div>
    </div>
  );
}

function ArrayItemDisclosure<TFieldValues extends FieldValues = FormData>({
  path,
  node,
  control,
  errors,
  orig,
  index,
  onRemove,
  isChanged,
}: RenderProps<TFieldValues> & {
  index: number;
  onRemove: () => void;
  isChanged: boolean;
}) {
  const unwrapped = unwrapZod(node);

  const shape = getObjectShape(
    unwrapped as z.ZodObject<Record<string, ZodTypeAny>>,
  );
  const children = useMemo(() => buildSections(shape, path), [shape, path]);

  const value = useWatch({ control, name: path });
  const error = getByPath(errors, path) as unknown as
    | { message?: string }
    | undefined;

  const itemLabel = useMemo(() => {
    if (!value || typeof value !== "object") return `Item ${index + 1}`;

    const obj = value as Record<string, unknown>;
    const labelFields = ["name", "title", "company", "institution", "issuer"];

    for (const field of labelFields) {
      if (obj[field] && typeof obj[field] === "string") {
        return String(obj[field]);
      }
    }

    return `Item ${index + 1}`;
  }, [value, index]);

  if (!(unwrapped instanceof z.ZodObject)) return null;

  return (
    <div className={`border rounded-md ${isChanged ? "bg-yellow-50" : ""}`}>
      <Disclosure>
        {({ open }) => (
          <>
            <div className="flex items-center gap-2">
              <Disclosure.Button className="flex items-center gap-2 flex-1 p-3 text-left">
                <ChevronDown
                  className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
                />
                <span className="font-medium">{itemLabel}</span>
                {error && <AlertCircle className="h-4 w-4 text-red-500" />}
                {!error && <CheckCircle className="h-4 w-4 text-green-500" />}
              </Disclosure.Button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="p-2 mr-2 text-red-500 hover:bg-red-50 rounded"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <Disclosure.Panel className="p-4 space-y-3 border-t">
              {children.map((child) => (
                <SchemaFieldRenderer
                  key={child.path}
                  path={child.path as FieldPath<TFieldValues>}
                  node={child.node}
                  control={control}
                  errors={errors}
                  orig={orig}
                />
              ))}
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </div>
  );
}

function SchemaArrayField<TFieldValues extends FieldValues = FormData>({
  path,
  node,
  control,
  errors,
  orig,
}: RenderProps<TFieldValues>) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before dragging starts
      },
    }),
  );

  const { fields, append, remove, move } = useFieldArray<
    TFieldValues,
    ArrayPath<TFieldValues>
  >({
    control,
    name: path as unknown as ArrayPath<TFieldValues>,
  });

  const value = useWatch<TFieldValues>({ control, name: path }) as unknown;

  if (!node) return null;
  const unwrapped = unwrapZod(node);
  if (!(unwrapped instanceof z.ZodArray)) return null;

  const ids = fields.map((f) => f.id);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeIndex = fields.findIndex((f) => f.id === String(active.id));
    const overIndex = fields.findIndex((f) => f.id === String(over.id));
    if (activeIndex >= 0 && overIndex >= 0 && activeIndex !== overIndex) {
      move(activeIndex, overIndex);
    }
  };

  const elementNode = unwrapped.element as ZodTypeAny;
  const unwrappedElement = unwrapZod(elementNode);
  const defaultItem = getDefaultForZod(
    elementNode,
  ) as TFieldValues[typeof path];

  const origValue = orig
    ? getByPath<TFieldValues[typeof path]>(orig, path)
    : undefined;
  const isChanged =
    origValue !== undefined
      ? JSON.stringify(value) !== JSON.stringify(origValue)
      : false;

  const isObjectArray = unwrappedElement instanceof z.ZodObject;
  const fieldName = String(path).split(".").pop() ?? "";
  const label = fieldName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();

  const error = getByPath(errors, path) as unknown as
    | { message?: string }
    | undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {error && <AlertCircle className="h-4 w-4 text-red-500" />}
        {fields.length > 0 && !error && (
          <span className="text-xs text-gray-500">({fields.length} items)</span>
        )}
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {fields.map((field, idx) => (
              <DraggableItem key={field.id} id={field.id}>
                {isObjectArray ? (
                  <ArrayItemDisclosure
                    path={`${path}.${idx}` as FieldPath<TFieldValues>}
                    node={elementNode}
                    control={control}
                    errors={errors}
                    orig={orig}
                    index={idx}
                    onRemove={() => remove(idx)}
                    isChanged={isChanged}
                  />
                ) : (
                  <div
                    className={`p-3 border rounded-md ${isChanged ? "bg-yellow-50" : ""}`}
                  >
                    <SchemaFieldRenderer
                      path={`${path}.${idx}` as FieldPath<TFieldValues>}
                      node={elementNode as ZodTypeAny}
                      control={control}
                      errors={errors}
                      orig={orig}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(idx);
                      }}
                      className="mt-2 p-1 text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </DraggableItem>
            ))}
            <button
              type="button"
              onClick={() => append(defaultItem)}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
            >
              <Plus size={16} /> Add {String(path).split(".").pop()}
            </button>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SchemaObjectField<TFieldValues extends FieldValues = FormData>({
  path,
  node,
  control,
  errors,
  orig,
}: RenderProps<TFieldValues>) {
  const label = String(path).split(".").pop() ?? "";
  const error = getByPath(errors, path) as unknown as
    | { message?: string }
    | undefined;

  const value = useWatch({ control, name: path });
  const isChanged =
    orig !== null && orig !== undefined
      ? JSON.stringify(getByPath(orig, path)) !== JSON.stringify(value)
      : false;

  const unwrapped = unwrapZod(node);

  // Memoize children - avoid rebuilding on every render
  const children = useMemo(() => {
    const shape = getObjectShape(
      unwrapped as z.ZodObject<Record<string, ZodTypeAny>>,
    );
    return buildSections(shape, path);
  }, [unwrapped, path]);

  if (!node) return null;
  if (!(unwrapped instanceof z.ZodObject)) return null;

  const isTopLevel = !path.includes(".");

  // For top-level sections, render children directly without extra nesting
  if (isTopLevel) {
    return (
      <div className="space-y-3">
        {children.map((child) => (
          <SchemaFieldRenderer
            key={child.path}
            path={child.path as FieldPath<TFieldValues>}
            node={child.node}
            control={control}
            errors={errors}
            orig={orig}
          />
        ))}
      </div>
    );
  }

  // For nested objects, use disclosure
  return (
    <Disclosure>
      {({ open }) => (
        <>
          <Disclosure.Button className="flex items-center gap-2 w-full p-2">
            <ChevronDown
              className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
            />
            {label}
            {error && <AlertCircle className="h-4 w-4 text-red-500" />}
            {!error && <CheckCircle className="h-4 w-4 text-green-500" />}
          </Disclosure.Button>
          <Disclosure.Panel className="p-4 space-y-3">
            {children.map((child) => (
              <SchemaFieldRenderer
                key={child.path}
                path={child.path as FieldPath<TFieldValues>}
                node={child.node}
                control={control}
                errors={errors}
                orig={orig}
              />
            ))}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}

function SchemaScalarField<TFieldValues extends FieldValues = FormData>({
  path,
  node,
  control,
  errors,
  orig,
}: RenderProps<TFieldValues>) {
  const { register, setValue } = useFormContext<TFieldValues>();
  const watched = useWatch<TFieldValues>({ control, name: path }) ?? undefined;
  const error = getByPath(errors, path) as unknown as
    | { message?: string }
    | undefined;
  const origValue = orig ? (getByPath(orig, path) as unknown) : undefined;
  const isChanged =
    origValue !== undefined
      ? JSON.stringify(watched) !== JSON.stringify(origValue)
      : false;

  const n = node ? unwrapZod(node) : undefined;

  // Handle ZodRecord - should be treated as JSON object, not scalar
  if (n instanceof z.ZodRecord) {
    const currentValue = watched as Record<string, unknown> | undefined;
    const jsonString = currentValue
      ? JSON.stringify(currentValue, null, 2)
      : "{}";

    return (
      <label className="block space-y-1">
        <span className="text-sm font-medium">
          {String(path).split(".").pop()}
        </span>
        <textarea
          rows={5}
          value={jsonString}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              setValue(path, parsed as TFieldValues[typeof path]);
            } catch {
              // Invalid JSON, don't update
            }
          }}
          onBlur={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              setValue(path, parsed as TFieldValues[typeof path]);
            } catch {
              setValue(path, {} as TFieldValues[typeof path]);
            }
          }}
          className={`w-full p-2 border rounded-md font-mono text-sm ${error ? "border-red-500" : "border-gray-300"} ${isChanged ? "bg-yellow-50" : ""}`}
          placeholder='{"key": "value"}'
        />
        {error && <p className="text-xs text-red-500">{error.message}</p>}
        <p className="text-xs text-gray-500">
          JSON object with key-value pairs
        </p>
      </label>
    );
  }

  // Check if this is a date field (ISO date string)
  const isDateField = (n?: ZodTypeAny): boolean => {
    if (!n || !(n instanceof z.ZodString)) return false;
    return n.description === "isoDate";
  };

  const isDate = isDateField(n);
  const isNumber = n instanceof z.ZodNumber;
  const isUrl = n instanceof z.ZodURL;

  // infer input type
  const inferInputType = (
    n?: ZodTypeAny,
  ): { type: string; options?: string[]; multiple?: boolean } => {
    if (!n) return { type: "text" };
    if (n instanceof z.ZodEnum) {
      return { type: "select", options: n.options.map((el) => String(el)) };
    }
    if (n instanceof z.ZodBoolean) return { type: "checkbox" };
    if (isDate) return { type: "date" };
    if (isNumber) return { type: "number" };
    if (isUrl) return { type: "url" };
    if (n instanceof z.ZodArray && n.element instanceof z.ZodString)
      return { type: "tags", multiple: true };
    if (n instanceof z.ZodString) {
      const def = (n as unknown as { _def?: { checks?: unknown[] } })._def;
      if (def && Array.isArray(def.checks)) {
        const hasMinLength = def.checks.some((c: unknown) => {
          const check = c as { kind?: string; value?: number };
          return check.kind === "min" && (check.value ?? 0) > 100;
        });
        if (hasMinLength) return { type: "textarea" };
      }
    }
    return { type: "text" };
  };

  const inputType = inferInputType(n);
  console.log(inputType);

  let input: React.ReactNode;
  switch (inputType.type) {
    case "select":
      input = (
        <select
          {...register(path)}
          className={`w-full p-2 border rounded-md ${error ? "border-red-500" : "border-gray-300"} ${isChanged ? "bg-yellow-50" : ""}`}
        >
          {inputType.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
      break;
    case "checkbox":
      input = (
        <input
          type="checkbox"
          {...register(path)}
          className={` mx-2 p-2 ${isChanged ? "bg-yellow-50" : ""}`}
        />
      );
      break;
    case "date": {
      console.log(watched);
      const dateValue =
        watched && typeof watched === "string" && watched !== ""
          ? new Date(watched).toISOString().split("T")[0]
          : "";

      input = (
        <input
          type="date"
          value={dateValue}
          onChange={(e) => {
            const val = e.target.value;
            if (!val || val === "") {
              setValue(path, undefined as TFieldValues[typeof path]);
            } else {
              try {
                setValue(
                  path,
                  new Date(val).toISOString() as TFieldValues[typeof path],
                );
              } catch {
                setValue(path, undefined as TFieldValues[typeof path]);
              }
            }
          }}
          className={`w-full p-2 border rounded-md ${error ? "border-red-500" : "border-gray-300"} ${isChanged ? "bg-yellow-50" : ""}`}
        />
      );
      break;
    }
    case "number": {
      const numValue = typeof watched === "number" ? watched : "";

      input = (
        <input
          type="number"
          value={numValue}
          onChange={(e) => {
            const val = e.target.value;
            if (!val || val === "") {
              setValue(path, undefined as TFieldValues[typeof path]);
            } else {
              const num = Number(val);
              if (!isNaN(num)) {
                setValue(path, num as TFieldValues[typeof path]);
              }
            }
          }}
          className={`w-full p-2 border rounded-md ${error ? "border-red-500" : "border-gray-300"} ${isChanged ? "bg-yellow-50" : ""}`}
        />
      );
      break;
    }
    case "url": {
      const urlValue = typeof watched === "string" ? watched : "";

      input = (
        <input
          type="url"
          value={urlValue}
          onChange={(e) => {
            const val = e.target.value;
            if (!val || val === "") {
              setValue(path, undefined as TFieldValues[typeof path]);
            } else {
              setValue(path, val as TFieldValues[typeof path]);
            }
          }}
          placeholder="https://example.com"
          className={`w-full p-2 border rounded-md ${error ? "border-red-500" : "border-gray-300"} ${isChanged ? "bg-yellow-50" : ""}`}
        />
      );
      break;
    }
    case "tags":
      input = (
        <div
          contentEditable
          suppressContentEditableWarning
          className="border rounded-md p-2 min-h-[40px]"
          onBlur={(e) => {
            const tags = (e.target as HTMLDivElement).innerText
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean);
            setValue(path, tags as unknown as TFieldValues[typeof path]);
          }}
        >
          {Array.isArray(watched)
            ? (watched as unknown as string[]).join(", ")
            : ""}
        </div>
      );
      break;
    case "textarea":
      input = (
        <textarea
          rows={3}
          {...register(path)}
          className={`w-full p-2 border rounded-md ${error ? "border-red-500" : "border-gray-300"} ${isChanged ? "bg-yellow-50" : ""}`}
        />
      );
      break;
    default:
      input = (
        <input
          {...register(path)}
          className={`w-full p-2 border rounded-md ${error ? "border-red-500" : "border-gray-300"} ${isChanged ? "bg-yellow-50" : ""}`}
        />
      );
      break;
  }

  const label = String(path).split(".").pop() ?? "";

  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {input}
      {error && <p className="text-xs text-red-500">{error.message}</p>}
    </label>
  );
}

/* Dispatcher component that unwraps node and chooses renderer */
function SchemaFieldRenderer<TFieldValues extends FieldValues = FormData>(
  props: RenderProps<TFieldValues>,
) {
  const { node } = props;
  const unwrapped = node ? unwrapZod(node) : node;
  if (unwrapped instanceof z.ZodArray)
    return <SchemaArrayField {...props} node={unwrapped} />;
  if (unwrapped instanceof z.ZodObject)
    return <SchemaObjectField {...props} node={unwrapped} />;
  if (unwrapped instanceof z.ZodRecord)
    return <SchemaScalarField {...props} node={unwrapped} />;
  return <SchemaScalarField {...props} node={unwrapped} />;
}

/* -------------------------
   Preview + History watcher components
   These isolate useWatch to avoid top-level re-renders
   ------------------------- */

function PreviewPanel({ control }: { control: Control<FormData> }) {
  // This component alone re-renders when form values change
  const config = useWatch<FormData>({ control }) as FormData;

  return (
    <PreviewErrorBoundary>
      <Suspense fallback={<Skeleton className="h-20 w-full" />}>
        {config && <LazyPresentation config={config} />}
      </Suspense>
      {config && (
        <LazyCVCard
          config={config}
          onContactClick={() => toast("Contact clicked")}
        />
      )}
      {config && <LazyProjects config={config} />}
      {config && (
        <LazyResume config={config} onContactClick={() => toast("Download")} />
      )}
      {config && <LazyCertifications config={config} />}
      {config && <LazyContacts config={config} />}
    </PreviewErrorBoundary>
  );
}

/**
 * HistoryWatcher isolates history updates (so parent doesn't watch entire form).
 * It writes a debounced localStorage draft and pushes new history entries.
 */
function HistoryWatcher({
  control,
  orig,
  history,
  historyIndex,
  setHistory,
  setHistoryIndex,
}: {
  control: Control<FormData>;
  orig: FormData | null;
  history: FormData[];
  historyIndex: number;
  setHistory: React.Dispatch<React.SetStateAction<FormData[]>>;
  setHistoryIndex: React.Dispatch<React.SetStateAction<number>>;
}) {
  const draft = useWatch<FormData>({ control }) as FormData;
  // Debounced save to localStorage
  const saveConfigDraft = useMemo(
    () =>
      debounce((currentDraft: FormData) => {
        try {
          localStorage.setItem("configDraft", JSON.stringify(currentDraft));
        } catch {
          // ignore
        }
      }, 1000),
    [],
  );

  // push to history when draft changes (but keep logic in this isolated component)
  useEffect(() => {
    if (!orig || !draft) return;
    setHistory((prev) => {
      // create a copy up to current index then push
      const copy = prev.slice(0, historyIndex + 1);
      const last = copy[copy.length - 1];
      if (!last || JSON.stringify(last) !== JSON.stringify(draft)) {
        copy.push(JSON.parse(JSON.stringify(draft)));
      }
      if (copy.length > 50) copy.shift();
      // update index to the end of the history
      setHistoryIndex(Math.min(copy.length - 1, copy.length - 1));
      return copy;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, orig]);

  // save draft to localStorage (debounced)
  useEffect(() => {
    if (!draft) return;
    saveConfigDraft(draft);
  }, [draft, saveConfigDraft]);

  return null;
}

/* -------------------------
   Error Boundary for previews
   ------------------------- */
class PreviewErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    toast.error(`Preview error: ${error.message}`);
  }

  render(): React.ReactNode {
    return this.state.hasError ? (
      <div className="p-4 text-red-500">Preview failed to load.</div>
    ) : (
      this.props.children
    );
  }
}

/* -------------------------
   Admin API hook (unchanged logic)
   ------------------------- */
function useAdminAPI(token: string) {
  const router = useRouter();

  const loadAll = useCallback(async (): Promise<PortfolioConfig | null> => {
    try {
      const res = await fetch("/api/admin/config");
      if (!res.ok) throw new Error("Fetch failed");
      const { config } = await res.json();
      return config as PortfolioConfig;
    } catch (err) {
      toast.error("Load failed");
      return null;
    }
  }, [router]);

  const handleSave = useCallback(
    async (data: FormData): Promise<void> => {
      const toSave = JSON.parse(JSON.stringify(data));
      toSave.meta.generatedAt = new Date().toISOString();
      try {
        const res = await fetch("/api/admin/config", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-token": token,
          },
          body: JSON.stringify(toSave),
        });
        if (!res.ok) throw new Error("Save failed");
        toast.success("Saved!");
        router.refresh();
      } catch {
        toast.error("Save failed");
      }
    },
    [router, token],
  );

  return { loadAll, handleSave };
}

/* -------------------------
   Main Component
   ------------------------- */
export default function ConfigEditorWrapper() {
  const [token, setToken] = useState<string>(() =>
    typeof window !== "undefined"
      ? (sessionStorage.getItem("adminToken") ?? "")
      : "",
  );
  const [mode, setMode] = useState<"form" | "json">("form");
  const [history, setHistory] = useState<FormData[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [serverMsg, setServerMsg] = useState<string | null>(null);
  const [settings, setSettings] = useState<{ editorAdminOnly?: boolean }>({});
  const [jsonModal, setJsonModal] = useState<{
    path: string;
    text: string;
  } | null>(null);
  const [orig, setOrig] = useState<FormData | null>(null);

  const methods = useForm<
    z.input<typeof PortfolioConfigSchema>,
    never,
    z.input<typeof PortfolioConfigSchema>
  >({
    resolver: zodResolver(PortfolioConfigSchema),
    defaultValues: undefined,
    mode: "onChange",
  });

  const { control, handleSubmit, formState, reset, setValue } = methods;
  const { errors } = formState;

  const { loadAll, handleSave } = useAdminAPI(token);

  useEffect(() => {
    let mounted = true;
    loadAll().then((config) => {
      if (!mounted) return;
      if (config) {
        const parsed = PortfolioConfigSchema.parse(config) as FormData;
        reset(parsed);
        setOrig(parsed);
        setHistory([parsed]);
        setHistoryIndex(0);
      }
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [loadAll, reset]);

  const filteredSections = useMemo(
    () =>
      topLevelSections.filter((s) =>
        s.label.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [searchTerm],
  );

  const hideEditor = !!settings.editorAdminOnly && !token;
  const errorCount = Object.keys(errors ?? {}).length;

  const onSubmit = (data: FormData): void => {
    handleSave(data);
  };

  const handleUndo = useCallback(() => {
    if (historyIndex > 0 && history[historyIndex - 1]) {
      const prevState = history[historyIndex - 1];
      reset(prevState);
      setHistoryIndex(historyIndex - 1);
    }
  }, [historyIndex, history, reset]);

  const handleReset = useCallback(() => {
    if (orig) {
      reset(orig);
      setHistoryIndex(0);
    }
  }, [orig, reset]);

  const handleExportJSON = useCallback(() => {
    const currentData = methods.getValues();
    const blob = new Blob([JSON.stringify(currentData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "config.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [methods]);

  const handleCopyJSON = useCallback(() => {
    const currentData = methods.getValues();
    navigator.clipboard.writeText(JSON.stringify(currentData, null, 2));
    toast.success("Copied!");
  }, [methods]);

  const handleJSONChange = useCallback(
    (text: string) => {
      try {
        const parsed = JSON.parse(text);
        const validated = PortfolioConfigSchema.parse(parsed);
        reset(validated as FormData);
      } catch {
        // ignore invalid json while editing
      }
    },
    [reset],
  );

  const handleApplyJSONModal = useCallback(() => {
    if (!jsonModal) return;
    try {
      const parsed = JSON.parse(jsonModal.text);
      setValue(jsonModal.path as FieldPath<FormData>, parsed);
      setJsonModal(null);
      toast.success("Applied");
    } catch {
      toast.error("Invalid JSON");
    }
  }, [jsonModal, setValue]);

  if (loading) return null;

  return (
    <FormProvider {...methods}>
      {
        <HistoryWatcher
          //@ts-expect-error control err
          control={control}
          orig={orig}
          history={history}
          historyIndex={historyIndex}
          setHistory={setHistory}
          setHistoryIndex={setHistoryIndex}
        />
      }
      {
        <form
          /*@ts-expect-error submit err*/
          onSubmit={handleSubmit(onSubmit)}
          className="max-w-7xl mx-auto p-4 space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Portfolio Config Editor
              </h1>
              <p className="text-muted-foreground">
                Schema-driven, with validation and live previews.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div
                  className={`px-2 py-1 rounded text-xs ${errorCount ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                >
                  {errorCount ? `${errorCount} errors` : "Valid"}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-end">
              <div className="flex gap-2 border rounded-md p-2">
                <input
                  placeholder="Admin Token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="px-2 text-sm"
                />
                <LogIn className="h-4 cursor-pointer" />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1 border rounded"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={historyIndex === 0}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Undo
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                >
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* Search & Mode */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search sections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 p-3 border rounded-md"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className={`px-4 py-2 rounded ${mode === "form" ? "bg-primary text-secondary" : "border"}`}
                onClick={() => setMode("form")}
              >
                Form
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded ${mode === "json" ? "bg-primary text-secondary" : "border"}`}
                onClick={() => setMode("json")}
              >
                JSON
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Editor */}
            <div className="lg:col-span-2 space-y-4 max-h-screen overflow-auto">
              {hideEditor ? (
                <div className="p-6 border rounded-md bg-yellow-50 text-center">
                  Enter admin token to edit.
                </div>
              ) : mode === "json" ? (
                //@ts-expect-error control err
                <JSONEditor control={control} onChange={handleJSONChange} />
              ) : (
                filteredSections.map((section) => (
                  <Disclosure key={section.path} defaultOpen>
                    {({ open }) => (
                      <div className="border rounded-md">
                        <Disclosure.Button className="w-full p-4 flex justify-between items-center">
                          <h3 className="text-lg font-semibold">
                            {section.label}
                          </h3>
                          <ChevronDown
                            className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`}
                          />
                        </Disclosure.Button>
                        <Disclosure.Panel className="p-4 space-y-4">
                          {
                            <SchemaFieldRenderer
                              path={section.path as FieldPath<FormData>}
                              node={section.node}
                              //@ts-expect-error controll err
                              control={control}
                              errors={errors}
                              orig={orig}
                            />
                          }
                        </Disclosure.Panel>
                      </div>
                    )}
                  </Disclosure>
                ))
              )}
            </div>

            {/* Preview Sidebar */}
            <aside className="space-y-4 sticky top-4">
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  Live Preview
                </h3>
                <div className="space-y-3 max-h-96 overflow-auto">
                  {
                    //@ts-expect-error controll err
                    <PreviewPanel control={control} />
                  }
                </div>
              </div>

              <div className="border rounded-md p-4">
                <h4 className="font-semibold mb-2">Actions</h4>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 flex items-center gap-1 p-2 border rounded"
                    onClick={handleExportJSON}
                  >
                    <Download size={16} /> Export JSON
                  </button>
                  <button
                    type="button"
                    className="flex-1 flex items-center gap-1 p-2 border rounded"
                    onClick={handleCopyJSON}
                  >
                    <Copy size={16} /> Copy JSON
                  </button>
                </div>
              </div>

              <div className="border rounded-md p-4">
                <h4 className="font-semibold mb-2">Visibility</h4>
                <div className="flex gap-2">
                  <button className="flex-1 p-2 border rounded">Public</button>
                  <button className="flex-1 p-2 border bg-primary text-secondary rounded">
                    Admin Only
                  </button>
                </div>
              </div>
            </aside>
          </div>

          {serverMsg && (
            <div className="p-4 border rounded-md bg-gray-50">{serverMsg}</div>
          )}

          {/* JSON Modal */}
          {jsonModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-background rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                  <h4 className="font-semibold">Edit {jsonModal.path}</h4>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setJsonModal(null)}
                      className="px-4 py-2 border rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyJSONModal}
                      className="px-4 py-2 bg-primary text-white rounded"
                    >
                      Apply
                    </button>
                  </div>
                </div>
                <textarea
                  value={jsonModal.text}
                  onChange={(e) =>
                    setJsonModal({ ...jsonModal, text: e.target.value })
                  }
                  className="flex-1 p-4 font-mono text-sm resize-none"
                />
              </div>
            </div>
          )}
        </form>
      }
    </FormProvider>
  );
}

function JSONEditor({
  control,
  onChange,
}: {
  control: Control<FormData>;
  onChange: (text: string) => void;
}) {
  const data = useWatch({ control });
  const [localValue, setLocalValue] = useState(() =>
    JSON.stringify(data ?? {}, null, 2),
  );

  useEffect(() => {
    setLocalValue(JSON.stringify(data ?? {}, null, 2));
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  return (
    <textarea
      rows={25}
      value={localValue}
      onChange={handleChange}
      className="w-full font-mono text-sm border rounded-md p-3"
    />
  );
}
