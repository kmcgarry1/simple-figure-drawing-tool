import { sanitizeClassBlocks } from "../../utils/classPlan";

const CUSTOM_POSE_BLOCK_TEMPLATE = Object.freeze({
  label: "Custom Block",
  durationSeconds: 120,
  poseCount: 6,
  blockType: "pose",
  photoTag: "all"
});

const CUSTOM_BREAK_BLOCK_TEMPLATE = Object.freeze({
  label: "Break",
  durationSeconds: 300,
  poseCount: 1,
  blockType: "break",
  photoTag: "all"
});

function parseMaybeInt(value) {
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return parsed;
}

function normalizeBlockType(value) {
  return String(value || "").trim().toLowerCase() === "break" ? "break" : "pose";
}

function resolveBlockTemplate(blockType) {
  return blockType === "break" ? CUSTOM_BREAK_BLOCK_TEMPLATE : CUSTOM_POSE_BLOCK_TEMPLATE;
}

export function updateClassBlocks(blocks, { index, field, value }) {
  if (index < 0 || index >= blocks.length) {
    return blocks;
  }

  const nextBlocks = blocks.map((block, blockIndex) => {
    if (blockIndex !== index) {
      return { ...block };
    }

    if (field === "label") {
      return {
        ...block,
        label: String(value ?? "")
      };
    }

    if (field === "durationSeconds") {
      const parsed = parseMaybeInt(value);
      if (parsed === null) {
        return { ...block };
      }
      return {
        ...block,
        durationSeconds: parsed
      };
    }

    if (field === "poseCount") {
      const parsed = parseMaybeInt(value);
      if (parsed === null) {
        return { ...block };
      }
      return {
        ...block,
        poseCount: parsed
      };
    }

    if (field === "photoTag") {
      return {
        ...block,
        photoTag: String(value ?? "").trim() || "all"
      };
    }

    if (field === "blockType") {
      const blockType = normalizeBlockType(value);
      const nextLabel = String(block.label ?? "").trim();

      return {
        ...block,
        blockType,
        label:
          blockType === "break"
            ? nextLabel && nextLabel !== CUSTOM_POSE_BLOCK_TEMPLATE.label
              ? nextLabel
              : CUSTOM_BREAK_BLOCK_TEMPLATE.label
            : nextLabel === CUSTOM_BREAK_BLOCK_TEMPLATE.label
              ? CUSTOM_POSE_BLOCK_TEMPLATE.label
              : nextLabel || CUSTOM_POSE_BLOCK_TEMPLATE.label,
        photoTag: "all"
      };
    }

    return { ...block };
  });

  return sanitizeClassBlocks(nextBlocks);
}

export function appendClassBlock(blocks, blockType = "pose") {
  const template = resolveBlockTemplate(normalizeBlockType(blockType));
  return sanitizeClassBlocks([...blocks, { ...template }]);
}

export function removeClassBlock(blocks, index) {
  if (blocks.length <= 1) {
    return blocks;
  }

  const remaining = blocks.filter((_, blockIndex) => blockIndex !== index);
  return sanitizeClassBlocks(remaining);
}
