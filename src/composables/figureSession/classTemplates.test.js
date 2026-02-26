import { describe, expect, it } from "vitest";
import {
  getClassTemplateById,
  normalizeClassTemplates,
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
});
