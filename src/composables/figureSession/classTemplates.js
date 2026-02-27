import { sanitizeClassBlocks } from "../../utils/classPlan";

const STORAGE_KEY = "figureDrawing.classTemplates.v1";
const MAX_TEMPLATE_COUNT = 50;
const TEMPLATE_EXPORT_SCHEMA_VERSION = 1;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeTemplateName(rawName, fallback) {
  const candidate = String(rawName ?? "").trim();
  return candidate || fallback;
}

function createTemplateId() {
  return `template-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function cloneTemplateBlocks(blocks) {
  return sanitizeClassBlocks(blocks || []).map((block) => ({ ...block }));
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
  const normalizedBlocks = cloneTemplateBlocks(blocks);
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
    id: createTemplateId(),
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

export function findClassTemplateMatch(templates, classBlocks) {
  const normalizedTemplates = normalizeClassTemplates(templates);
  const normalizedBlocks = sanitizeClassBlocks(classBlocks || []);
  const targetBlocksSignature = JSON.stringify(normalizedBlocks);

  return (
    normalizedTemplates.find(
      (template) => JSON.stringify(sanitizeClassBlocks(template.blocks)) === targetBlocksSignature
    ) || null
  );
}

export function renameClassTemplateById(templates, templateId, nextName) {
  const trimmedName = String(nextName ?? "").trim();
  if (!trimmedName) {
    return {
      renamed: false,
      reason: "missing-name",
      templates: normalizeClassTemplates(templates)
    };
  }

  const normalizedTemplates = normalizeClassTemplates(templates);
  const targetIndex = normalizedTemplates.findIndex((template) => template.id === templateId);
  if (targetIndex < 0) {
    return {
      renamed: false,
      reason: "missing-template",
      templates: normalizedTemplates
    };
  }

  const hasNameConflict = normalizedTemplates.some(
    (template, index) =>
      index !== targetIndex &&
      template.name.toLowerCase() === trimmedName.toLowerCase()
  );

  if (hasNameConflict) {
    return {
      renamed: false,
      reason: "duplicate-name",
      templates: normalizedTemplates
    };
  }

  const now = new Date().toISOString();
  const renamedTemplate = {
    ...normalizedTemplates[targetIndex],
    name: trimmedName,
    updatedAt: now
  };

  const nextTemplates = normalizedTemplates.map((template, index) =>
    index === targetIndex ? renamedTemplate : template
  );

  return {
    renamed: true,
    template: renamedTemplate,
    templates: normalizeClassTemplates(nextTemplates)
  };
}

function buildDuplicatedTemplateName(templates, sourceTemplateName) {
  const normalizedName = String(sourceTemplateName ?? "").trim() || "Template";
  const baseName = `${normalizedName} (Copy)`;
  const existingNames = new Set(
    templates.map((template) => String(template.name || "").toLowerCase())
  );

  if (!existingNames.has(baseName.toLowerCase())) {
    return baseName;
  }

  let suffix = 2;
  while (suffix <= 1000) {
    const candidate = `${normalizedName} (Copy ${suffix})`;
    if (!existingNames.has(candidate.toLowerCase())) {
      return candidate;
    }
    suffix += 1;
  }

  return `${normalizedName} (Copy ${Date.now()})`;
}

export function duplicateClassTemplateById(templates, templateId) {
  const normalizedTemplates = normalizeClassTemplates(templates);
  const sourceTemplate = normalizedTemplates.find((template) => template.id === templateId);
  if (!sourceTemplate) {
    return {
      duplicated: false,
      reason: "missing-template",
      templates: normalizedTemplates
    };
  }

  const now = new Date().toISOString();
  const duplicateTemplate = {
    id: createTemplateId(),
    name: buildDuplicatedTemplateName(normalizedTemplates, sourceTemplate.name),
    blocks: cloneTemplateBlocks(sourceTemplate.blocks),
    createdAt: now,
    updatedAt: now
  };

  return {
    duplicated: true,
    template: duplicateTemplate,
    templates: normalizeClassTemplates([duplicateTemplate, ...normalizedTemplates])
  };
}

export function createClassTemplatesExportPayload(templates) {
  return {
    app: "figure-drawing",
    schemaVersion: TEMPLATE_EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    templates: normalizeClassTemplates(templates)
  };
}

export function parseClassTemplatesImportText(rawText) {
  const parsed = JSON.parse(String(rawText || ""));
  const sourceTemplates =
    parsed && typeof parsed === "object" && Array.isArray(parsed.templates)
      ? parsed.templates
      : parsed;

  return normalizeClassTemplates(sourceTemplates);
}

export function mergeClassTemplatesByName(existingTemplates, importedTemplates) {
  const normalizedExistingTemplates = normalizeClassTemplates(existingTemplates);
  const normalizedImportedTemplates = normalizeClassTemplates(importedTemplates);
  const templatesByName = new Map();

  for (const template of normalizedExistingTemplates) {
    templatesByName.set(template.name.toLowerCase(), template);
  }

  let addedCount = 0;
  let updatedCount = 0;
  const now = new Date().toISOString();

  for (const template of normalizedImportedTemplates) {
    const lookupKey = template.name.toLowerCase();
    const existingTemplate = templatesByName.get(lookupKey);
    if (existingTemplate) {
      templatesByName.set(lookupKey, {
        ...existingTemplate,
        blocks: cloneTemplateBlocks(template.blocks),
        updatedAt: now
      });
      updatedCount += 1;
      continue;
    }

    templatesByName.set(lookupKey, {
      ...template,
      id: createTemplateId(),
      blocks: cloneTemplateBlocks(template.blocks),
      createdAt: template.createdAt || now,
      updatedAt: now
    });
    addedCount += 1;
  }

  const mergedTemplates = Array.from(templatesByName.values()).sort((left, right) =>
    String(right.updatedAt || "").localeCompare(String(left.updatedAt || ""))
  );

  return {
    templates: normalizeClassTemplates(mergedTemplates),
    addedCount,
    updatedCount
  };
}
