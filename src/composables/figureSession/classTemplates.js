import { sanitizeClassBlocks } from "../../utils/classPlan";

const STORAGE_KEY = "figureDrawing.classTemplates.v1";
const MAX_TEMPLATE_COUNT = 50;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeTemplateName(rawName, fallback) {
  const candidate = String(rawName ?? "").trim();
  return candidate || fallback;
}

function normalizeTemplate(rawTemplate, index) {
  const fallbackId = `template-${index + 1}`;
  const idCandidate = String(rawTemplate?.id ?? "").trim();
  const id = idCandidate || fallbackId;
  const name = normalizeTemplateName(rawTemplate?.name, `Template ${index + 1}`);
  const blocks = sanitizeClassBlocks(rawTemplate?.blocks || []);
  const createdAtCandidate = String(rawTemplate?.createdAt ?? "").trim();
  const updatedAtCandidate = String(rawTemplate?.updatedAt ?? "").trim();
  const createdAt = createdAtCandidate || new Date().toISOString();
  const updatedAt = updatedAtCandidate || createdAt;

  return {
    id,
    name,
    blocks,
    createdAt,
    updatedAt
  };
}

export function normalizeClassTemplates(rawTemplates) {
  const dedupe = new Set();
  const normalized = [];

  for (const [index, rawTemplate] of Array.from(rawTemplates || []).entries()) {
    const template = normalizeTemplate(rawTemplate, index);
    if (dedupe.has(template.id)) {
      continue;
    }

    dedupe.add(template.id);
    normalized.push(template);
  }

  return normalized.slice(0, MAX_TEMPLATE_COUNT);
}

export function loadClassTemplates() {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    return normalizeClassTemplates(JSON.parse(rawValue));
  } catch {
    return [];
  }
}

export function persistClassTemplates(templates) {
  if (!canUseStorage()) {
    return;
  }

  try {
    const normalized = normalizeClassTemplates(templates);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // Ignore storage write failures to keep class plan editing uninterrupted.
  }
}

function findTemplateIndexByName(templates, templateName) {
  const target = templateName.toLowerCase();
  return templates.findIndex((template) => template.name.toLowerCase() === target);
}

export function saveClassTemplate(templates, { name, blocks }) {
  const trimmedName = String(name ?? "").trim();
  if (!trimmedName) {
    return {
      saved: false,
      reason: "missing-name",
      templates: normalizeClassTemplates(templates)
    };
  }

  const normalizedTemplates = normalizeClassTemplates(templates);
  const normalizedBlocks = sanitizeClassBlocks(blocks || []);
  const now = new Date().toISOString();
  const existingIndex = findTemplateIndexByName(normalizedTemplates, trimmedName);

  if (existingIndex >= 0) {
    const existing = normalizedTemplates[existingIndex];
    const updatedTemplate = {
      ...existing,
      name: trimmedName,
      blocks: normalizedBlocks,
      updatedAt: now
    };
    const nextTemplates = normalizedTemplates.map((template, index) =>
      index === existingIndex ? updatedTemplate : template
    );
    return {
      saved: true,
      updated: true,
      template: updatedTemplate,
      templates: normalizeClassTemplates(nextTemplates)
    };
  }

  const newTemplate = {
    id: `template-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    name: trimmedName,
    blocks: normalizedBlocks,
    createdAt: now,
    updatedAt: now
  };

  const nextTemplates = [newTemplate, ...normalizedTemplates];
  return {
    saved: true,
    updated: false,
    template: newTemplate,
    templates: normalizeClassTemplates(nextTemplates)
  };
}

export function removeClassTemplateById(templates, templateId) {
  const normalized = normalizeClassTemplates(templates);
  const nextTemplates = normalized.filter((template) => template.id !== templateId);
  return normalizeClassTemplates(nextTemplates);
}

export function getClassTemplateById(templates, templateId) {
  const normalized = normalizeClassTemplates(templates);
  return normalized.find((template) => template.id === templateId) || null;
}
