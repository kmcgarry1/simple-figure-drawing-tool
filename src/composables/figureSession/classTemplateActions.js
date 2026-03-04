import {
  createClassTemplatesExportPayload,
  duplicateClassTemplateById as duplicateTemplateById,
  getClassTemplateById,
  mergeClassTemplatesByName,
  parseClassTemplatesImportText,
  persistClassTemplates,
  renameClassTemplateById as renameTemplateById,
  removeClassTemplateById,
  saveClassTemplate
} from "./classTemplates";
import {
  buildClassTemplateSyncConfig,
  normalizeClassTemplateSyncKey,
  persistClassTemplateSyncKey,
  pullClassTemplatesFromRemote,
  pushClassTemplatesToRemote
} from "./classTemplateSync";

export function createClassTemplateActions({
  classTemplates,
  classBlocks,
  statusMessage,
  classTemplateSyncKey
}) {
  const classTemplateSyncConfig = buildClassTemplateSyncConfig();

  function setClassTemplateSyncKey(nextSyncKey) {
    const normalizedSyncKey = normalizeClassTemplateSyncKey(nextSyncKey);
    classTemplateSyncKey.value = normalizedSyncKey;
    persistClassTemplateSyncKey(normalizedSyncKey);
  }

  function resolveSyncKeyOrSetStatus() {
    if (!classTemplateSyncConfig.enabled) {
      statusMessage.value =
        "Class template sync endpoint is not configured. Local templates remain available.";
      return "";
    }

    const normalizedSyncKey = normalizeClassTemplateSyncKey(classTemplateSyncKey.value);
    if (!normalizedSyncKey) {
      statusMessage.value = "Enter a sync key before syncing templates.";
      return "";
    }

    return normalizedSyncKey;
  }

  function saveClassTemplateByName(templateName) {
    const result = saveClassTemplate(classTemplates.value, {
      name: templateName,
      blocks: classBlocks.value
    });
    if (!result.saved) {
      statusMessage.value = "Enter a template name before saving.";
      return;
    }

    classTemplates.value = result.templates;
    persistClassTemplates(classTemplates.value);
    statusMessage.value = result.updated
      ? `Updated template "${result.template.name}".`
      : `Saved template "${result.template.name}".`;
  }

  function loadClassTemplateById(templateId) {
    const template = getClassTemplateById(classTemplates.value, templateId);
    if (!template) {
      statusMessage.value = "Template not found.";
      return;
    }

    classBlocks.value = template.blocks.map((block) => ({ ...block }));
    statusMessage.value = `Loaded template "${template.name}".`;
  }

  function deleteClassTemplateById(templateId) {
    const existingCount = classTemplates.value.length;
    classTemplates.value = removeClassTemplateById(classTemplates.value, templateId);
    if (classTemplates.value.length === existingCount) {
      statusMessage.value = "Template not found.";
      return;
    }

    persistClassTemplates(classTemplates.value);
    statusMessage.value = "Template deleted.";
  }

  function renameClassTemplateById(payloadOrTemplateId, nextName) {
    const templateId =
      payloadOrTemplateId && typeof payloadOrTemplateId === "object"
        ? payloadOrTemplateId.templateId
        : payloadOrTemplateId;
    const resolvedName =
      payloadOrTemplateId && typeof payloadOrTemplateId === "object"
        ? payloadOrTemplateId.nextName
        : nextName;

    const result = renameTemplateById(classTemplates.value, templateId, resolvedName);
    if (!result.renamed) {
      if (result.reason === "missing-name") {
        statusMessage.value = "Enter a template name before renaming.";
        return;
      }

      if (result.reason === "duplicate-name") {
        statusMessage.value = "A template with that name already exists.";
        return;
      }

      statusMessage.value = "Template not found.";
      return;
    }

    classTemplates.value = result.templates;
    persistClassTemplates(classTemplates.value);
    statusMessage.value = `Renamed template to "${result.template.name}".`;
  }

  function duplicateClassTemplateById(templateId) {
    const result = duplicateTemplateById(classTemplates.value, templateId);
    if (!result.duplicated) {
      statusMessage.value = "Template not found.";
      return;
    }

    classTemplates.value = result.templates;
    persistClassTemplates(classTemplates.value);
    statusMessage.value = `Duplicated template "${result.template.name}".`;
  }

  function exportClassTemplatesJson() {
    if (typeof window === "undefined") {
      statusMessage.value = "Template export is only available in the browser.";
      return;
    }

    const payload = createClassTemplatesExportPayload(classTemplates.value);
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const blobUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    const dateStamp = new Date().toISOString().slice(0, 10);

    downloadLink.href = blobUrl;
    downloadLink.download = `figure-drawing-class-templates-${dateStamp}.json`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();

    URL.revokeObjectURL(blobUrl);
    statusMessage.value = "Class templates exported.";
  }

  async function importClassTemplatesFromFile(file) {
    if (!(file instanceof File)) {
      statusMessage.value = "Choose a JSON file to import templates.";
      return;
    }

    try {
      const importedText = await file.text();
      const importedTemplates = parseClassTemplatesImportText(importedText);
      const mergeResult = mergeClassTemplatesByName(
        classTemplates.value,
        importedTemplates
      );

      classTemplates.value = mergeResult.templates;
      persistClassTemplates(classTemplates.value);
      statusMessage.value = `Templates imported (${mergeResult.addedCount} added, ${mergeResult.updatedCount} updated).`;
    } catch {
      statusMessage.value = "Unable to import class templates.";
    }
  }

  async function pullClassTemplatesFromSync() {
    const syncKey = resolveSyncKeyOrSetStatus();
    if (!syncKey) {
      return;
    }

    try {
      const pullResult = await pullClassTemplatesFromRemote({
        endpoint: classTemplateSyncConfig.endpoint,
        requestTimeoutMs: classTemplateSyncConfig.requestTimeoutMs,
        syncKey
      });
      const mergeResult = mergeClassTemplatesByName(
        classTemplates.value,
        pullResult.templates
      );

      classTemplates.value = mergeResult.templates;
      persistClassTemplates(classTemplates.value);
      statusMessage.value = `Sync pull complete (${mergeResult.addedCount} added, ${mergeResult.updatedCount} updated).`;
    } catch (error) {
      if (error?.status === 404) {
        statusMessage.value = "No synced templates found for this sync key.";
        return;
      }

      statusMessage.value = "Unable to pull templates from sync service.";
    }
  }

  async function pushClassTemplatesToSync() {
    const syncKey = resolveSyncKeyOrSetStatus();
    if (!syncKey) {
      return;
    }

    try {
      const pushResult = await pushClassTemplatesToRemote({
        endpoint: classTemplateSyncConfig.endpoint,
        requestTimeoutMs: classTemplateSyncConfig.requestTimeoutMs,
        syncKey,
        templates: classTemplates.value
      });
      statusMessage.value = `Sync push complete (${pushResult.templateCount} template(s)).`;
    } catch {
      statusMessage.value = "Unable to push templates to sync service.";
    }
  }

  return {
    classTemplateSyncEnabled: classTemplateSyncConfig.enabled,
    setClassTemplateSyncKey,
    saveClassTemplateByName,
    loadClassTemplateById,
    deleteClassTemplateById,
    renameClassTemplateById,
    duplicateClassTemplateById,
    exportClassTemplatesJson,
    importClassTemplatesFromFile,
    pullClassTemplatesFromSync,
    pushClassTemplatesToSync
  };
}
