import { createBlocksFromPreset, getClassPresetById } from "../../utils/classPlan";
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

  return {
    setClassPreset,
    updateClassBlock,
    addClassBlock,
    removeClassBlock,
    setClassPhotoOrder,
    setAvoidImmediateRepeats
  };
}
