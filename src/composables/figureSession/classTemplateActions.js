import {
  getClassTemplateById,
  persistClassTemplates,
  removeClassTemplateById,
  saveClassTemplate
} from "./classTemplates";

export function createClassTemplateActions({
  classTemplates,
  classBlocks,
  statusMessage
}) {
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

  return {
    saveClassTemplateByName,
    loadClassTemplateById,
    deleteClassTemplateById
  };
}
