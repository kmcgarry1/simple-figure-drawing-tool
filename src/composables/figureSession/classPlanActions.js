import {
  buildGuidedClassBlocks,
  createBlocksFromPreset,
  getClassPresetById
} from "../../utils/classPlan";
import {
  appendClassBlock,
  removeClassBlock as removeClassBlockByIndex,
  updateClassBlocks
} from "./classBlockEditor";
import {
  PHOTO_ORDER_SEQUENTIAL,
  PHOTO_ORDER_SHUFFLE,
  SESSION_MODE_CLASS
} from "./constants";

export function createClassPlanActions({
  classPresetId,
  classBlocks,
  classPhotoOrder,
  avoidImmediateRepeats,
  availablePhotoTags,
  sessionMode,
  isSessionLive,
  statusMessage
}) {
  function setClassPreset(nextPresetId) {
    const resolvedPreset = getClassPresetById(nextPresetId);
    classPresetId.value = resolvedPreset.id;
    classBlocks.value = createBlocksFromPreset(resolvedPreset.id);

    if (sessionMode.value === SESSION_MODE_CLASS && !isSessionLive.value) {
      statusMessage.value = "Preset updated. Review the blocks or start the class.";
    }
  }

  function updateClassBlock(payload) {
    classBlocks.value = updateClassBlocks(classBlocks.value, payload);

    if (sessionMode.value === SESSION_MODE_CLASS && !isSessionLive.value) {
      statusMessage.value = "Class plan updated.";
    }
  }

  function addClassBlock(blockType = "pose") {
    classBlocks.value = appendClassBlock(classBlocks.value, blockType);

    if (sessionMode.value === SESSION_MODE_CLASS && !isSessionLive.value) {
      statusMessage.value =
        String(blockType || "").toLowerCase() === "break"
          ? "Added a break block."
          : "Added a custom block.";
    }
  }

  function removeClassBlock(index) {
    const nextBlocks = removeClassBlockByIndex(classBlocks.value, index);
    if (nextBlocks === classBlocks.value) {
      return;
    }

    classBlocks.value = nextBlocks;
    if (sessionMode.value === SESSION_MODE_CLASS && !isSessionLive.value) {
      statusMessage.value = "Removed a block.";
    }
  }

  function setClassPhotoOrder(nextOrder) {
    if (![PHOTO_ORDER_SHUFFLE, PHOTO_ORDER_SEQUENTIAL].includes(nextOrder)) {
      return;
    }

    classPhotoOrder.value = nextOrder;
  }

  function setAvoidImmediateRepeats(nextValue) {
    avoidImmediateRepeats.value = Boolean(nextValue);
  }

  function resolveAssistantTag(rawTag) {
    const normalizedTag = String(rawTag ?? "").trim();
    if (!normalizedTag || normalizedTag === "all") {
      return "all";
    }

    return availablePhotoTags.value.includes(normalizedTag) ? normalizedTag : "all";
  }

  function applyClassBuilderAssistant(payload) {
    const resolvedPreset = getClassPresetById(payload?.targetPresetId);
    const nextBlocks = buildGuidedClassBlocks({
      targetMinutes: resolvedPreset.targetMinutes,
      gestureSharePercent: payload?.gestureSharePercent,
      gestureTag: resolveAssistantTag(payload?.gestureTag),
      longPoseTag: resolveAssistantTag(payload?.longPoseTag),
      includeBreaks: payload?.includeBreaks !== false
    });

    classPresetId.value = resolvedPreset.id;
    classBlocks.value = nextBlocks;

    if (sessionMode.value === SESSION_MODE_CLASS && !isSessionLive.value) {
      statusMessage.value = `Assistant built a ${resolvedPreset.targetMinutes}-minute class plan.`;
    }
  }

  return {
    setClassPreset,
    updateClassBlock,
    addClassBlock,
    removeClassBlock,
    setClassPhotoOrder,
    setAvoidImmediateRepeats,
    applyClassBuilderAssistant
  };
}
