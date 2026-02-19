import { sanitizeClassBlocks } from "../../utils/classPlan";

const CUSTOM_BLOCK_TEMPLATE = Object.freeze({
  label: "Custom Block",
  durationSeconds: 120,
  poseCount: 6
});

function parseMaybeInt(value) {
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return parsed;
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

    return { ...block };
  });

  return sanitizeClassBlocks(nextBlocks);
}

export function appendClassBlock(blocks) {
  return sanitizeClassBlocks([...blocks, { ...CUSTOM_BLOCK_TEMPLATE }]);
}

export function removeClassBlock(blocks, index) {
  if (blocks.length <= 1) {
    return blocks;
  }

  const remaining = blocks.filter((_, blockIndex) => blockIndex !== index);
  return sanitizeClassBlocks(remaining);
}
