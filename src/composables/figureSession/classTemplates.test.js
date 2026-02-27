import { describe, expect, it } from "vitest";
import {
  createClassTemplatesExportPayload,
  duplicateClassTemplateById,
  findClassTemplateMatch,
  getClassTemplateById,
  mergeClassTemplatesByName,
  normalizeClassTemplates,
  parseClassTemplatesImportText,
  renameClassTemplateById,
  removeClassTemplateById,
  saveClassTemplate
} from "./classTemplates";

describe("normalizeClassTemplates", () => {
  it("normalizes malformed template entries", () => {
    const result = normalizeClassTemplates([
      {
        id: "",
        name: "",
        blocks: [{ label: " ", durationSeconds: "bad", poseCount: 0 }]
      }
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Template 1");
    expect(result[0].blocks).toHaveLength(1);
  });
});

describe("saveClassTemplate", () => {
  it("creates and then updates a template by name", () => {
    const firstSave = saveClassTemplate([], {
      name: "Gesture Warmups",
      blocks: [{ label: "Warm-up", durationSeconds: 60, poseCount: 5 }]
    });

    expect(firstSave.saved).toBe(true);
    expect(firstSave.updated).toBe(false);
    expect(firstSave.templates).toHaveLength(1);

    const secondSave = saveClassTemplate(firstSave.templates, {
      name: "Gesture Warmups",
      blocks: [{ label: "Gesture", durationSeconds: 30, poseCount: 8 }]
    });

    expect(secondSave.saved).toBe(true);
    expect(secondSave.updated).toBe(true);
    expect(secondSave.templates).toHaveLength(1);
    expect(secondSave.templates[0].blocks[0]).toMatchObject({
      label: "Gesture",
      durationSeconds: 30,
      poseCount: 8
    });
  });
});

describe("class template selectors", () => {
  it("finds and removes templates by id", () => {
    const saveResult = saveClassTemplate([], {
      name: "Long Pose Set",
      blocks: [{ label: "Long Pose", durationSeconds: 600, poseCount: 3 }]
    });
    const template = saveResult.templates[0];

    expect(getClassTemplateById(saveResult.templates, template.id)).toMatchObject({
      id: template.id
    });

    const afterDelete = removeClassTemplateById(saveResult.templates, template.id);
    expect(afterDelete).toHaveLength(0);
  });

  it("finds matching templates by current class blocks", () => {
    const saveResult = saveClassTemplate([], {
      name: "Long Pose Set",
      blocks: [{ label: "Long Pose", durationSeconds: 600, poseCount: 3 }]
    });

    const match = findClassTemplateMatch(saveResult.templates, [
      { label: "Long Pose", durationSeconds: 600, poseCount: 3, blockType: "pose" }
    ]);

    expect(match?.name).toBe("Long Pose Set");
  });
});

describe("class template editing", () => {
  it("renames templates and blocks duplicate names", () => {
    const firstSave = saveClassTemplate([], {
      name: "Gesture Warmups",
      blocks: [{ label: "Warm-up", durationSeconds: 60, poseCount: 5 }]
    });
    const secondSave = saveClassTemplate(firstSave.templates, {
      name: "Long Pose Set",
      blocks: [{ label: "Long Pose", durationSeconds: 600, poseCount: 2 }]
    });

    const firstTemplate = secondSave.templates.find(
      (template) => template.name === "Gesture Warmups"
    );
    const renameResult = renameClassTemplateById(
      secondSave.templates,
      firstTemplate.id,
      "Gesture Flow"
    );
    expect(renameResult.renamed).toBe(true);
    expect(renameResult.template.name).toBe("Gesture Flow");

    const duplicateNameResult = renameClassTemplateById(
      renameResult.templates,
      firstTemplate.id,
      "Long Pose Set"
    );
    expect(duplicateNameResult.renamed).toBe(false);
    expect(duplicateNameResult.reason).toBe("duplicate-name");
  });

  it("duplicates a template with a unique copy suffix", () => {
    const saveResult = saveClassTemplate([], {
      name: "Class Starter",
      blocks: [{ label: "Warm-up", durationSeconds: 60, poseCount: 5 }]
    });

    const sourceTemplate = saveResult.templates[0];
    const duplicateResult = duplicateClassTemplateById(
      saveResult.templates,
      sourceTemplate.id
    );

    expect(duplicateResult.duplicated).toBe(true);
    expect(duplicateResult.templates).toHaveLength(2);
    expect(duplicateResult.template.name).toBe("Class Starter (Copy)");
  });
});

describe("class template import/export", () => {
  it("exports and parses template-only payloads", () => {
    const saveResult = saveClassTemplate([], {
      name: "Evening Session",
      blocks: [{ label: "Long Pose", durationSeconds: 300, poseCount: 2 }]
    });

    const payload = createClassTemplatesExportPayload(saveResult.templates);
    expect(payload).toMatchObject({
      app: "figure-drawing",
      schemaVersion: 1
    });
    expect(Array.isArray(payload.templates)).toBe(true);

    const parsedTemplates = parseClassTemplatesImportText(JSON.stringify(payload));
    expect(parsedTemplates).toHaveLength(1);
    expect(parsedTemplates[0].name).toBe("Evening Session");
  });

  it("merges imported templates by name", () => {
    const existing = saveClassTemplate([], {
      name: "Gesture Warmups",
      blocks: [{ label: "Warm-up", durationSeconds: 60, poseCount: 5 }]
    }).templates;

    const importedTemplates = normalizeClassTemplates([
      {
        name: "Gesture Warmups",
        blocks: [{ label: "Gesture", durationSeconds: 30, poseCount: 10 }]
      },
      {
        name: "Long Pose Set",
        blocks: [{ label: "Long Pose", durationSeconds: 600, poseCount: 2 }]
      }
    ]);

    const mergeResult = mergeClassTemplatesByName(existing, importedTemplates);
    expect(mergeResult.addedCount).toBe(1);
    expect(mergeResult.updatedCount).toBe(1);
    expect(mergeResult.templates).toHaveLength(2);
    expect(
      mergeResult.templates.some((template) => template.name === "Long Pose Set")
    ).toBe(true);
  });
});
