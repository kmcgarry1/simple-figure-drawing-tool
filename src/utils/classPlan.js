export const CLASS_PRESET_OPTIONS = Object.freeze([
  {
    id: "class-1h",
    label: "1 Hour",
    targetMinutes: 60
  },
  {
    id: "class-2h",
    label: "2 Hours",
    targetMinutes: 120
  },
  {
    id: "class-3h",
    label: "3 Hours",
    targetMinutes: 180
  }
]);

const CLASS_PRESET_BLOCKS = Object.freeze({
  "class-1h": Object.freeze([
    { label: "Warm-up", durationSeconds: 30, poseCount: 8, photoTag: "all" },
    { label: "Warm-up", durationSeconds: 60, poseCount: 6, photoTag: "all" },
    { label: "Gesture", durationSeconds: 120, poseCount: 10, photoTag: "all" },
    { label: "Long Pose", durationSeconds: 300, poseCount: 4, photoTag: "all" },
    { label: "Final Pose", durationSeconds: 600, poseCount: 1, photoTag: "all" }
  ]),
  "class-2h": Object.freeze([
    { label: "Warm-up", durationSeconds: 30, poseCount: 10, photoTag: "all" },
    { label: "Warm-up", durationSeconds: 60, poseCount: 10, photoTag: "all" },
    { label: "Gesture", durationSeconds: 120, poseCount: 15, photoTag: "all" },
    { label: "Long Pose", durationSeconds: 300, poseCount: 9, photoTag: "all" },
    { label: "Final Pose", durationSeconds: 1800, poseCount: 1, photoTag: "all" }
  ]),
  "class-3h": Object.freeze([
    { label: "Warm-up", durationSeconds: 30, poseCount: 12, photoTag: "all" },
    { label: "Warm-up", durationSeconds: 60, poseCount: 12, photoTag: "all" },
    { label: "Gesture", durationSeconds: 120, poseCount: 21, photoTag: "all" },
    { label: "Long Pose", durationSeconds: 300, poseCount: 12, photoTag: "all" },
    { label: "Final Pose", durationSeconds: 3600, poseCount: 1, photoTag: "all" }
  ])
});

const FALLBACK_PRESET_ID = CLASS_PRESET_OPTIONS[0].id;
const DEFAULT_BLOCK = Object.freeze({
  label: "Custom Block",
  durationSeconds: 120,
  poseCount: 6,
  photoTag: "all"
});

const MIN_BLOCK_DURATION_SECONDS = 5;
const MAX_BLOCK_DURATION_SECONDS = 7200;
const MIN_BLOCK_POSE_COUNT = 1;
const MAX_BLOCK_POSE_COUNT = 200;

function clampToInt(value, min, max, fallback) {
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

export function getClassPresetById(presetId) {
  return CLASS_PRESET_OPTIONS.find((preset) => preset.id === presetId) || CLASS_PRESET_OPTIONS[0];
}

export function createBlocksFromPreset(presetId) {
  const resolvedPresetId = getClassPresetById(presetId).id;
  const sourceBlocks = CLASS_PRESET_BLOCKS[resolvedPresetId] || CLASS_PRESET_BLOCKS[FALLBACK_PRESET_ID];
  return sourceBlocks.map((block) => ({ ...block }));
}

export function sanitizeClassBlocks(rawBlocks) {
  const normalized = Array.from(rawBlocks || [])
    .map((rawBlock) => {
      const labelCandidate = String(rawBlock?.label ?? "").trim();
      const durationCandidate = clampToInt(
        rawBlock?.durationSeconds,
        MIN_BLOCK_DURATION_SECONDS,
        MAX_BLOCK_DURATION_SECONDS,
        DEFAULT_BLOCK.durationSeconds
      );
      const poseCountCandidate = clampToInt(
        rawBlock?.poseCount,
        MIN_BLOCK_POSE_COUNT,
        MAX_BLOCK_POSE_COUNT,
        DEFAULT_BLOCK.poseCount
      );
      const photoTagCandidate = String(rawBlock?.photoTag ?? "").trim();

      return {
        label: labelCandidate || DEFAULT_BLOCK.label,
        durationSeconds: durationCandidate,
        poseCount: poseCountCandidate,
        photoTag: photoTagCandidate || DEFAULT_BLOCK.photoTag
      };
    })
    .filter((block) => block.poseCount > 0);

  if (normalized.length > 0) {
    return normalized;
  }

  return [{ ...DEFAULT_BLOCK }];
}

export function calculateClassPlanSummary(blocks) {
  const safeBlocks = sanitizeClassBlocks(blocks);
  return safeBlocks.reduce(
    (summary, block) => {
      summary.totalPoses += block.poseCount;
      summary.totalSeconds += block.durationSeconds * block.poseCount;
      return summary;
    },
    {
      totalPoses: 0,
      totalSeconds: 0
    }
  );
}

export function expandClassBlocks(blocks) {
  const expanded = [];
  const safeBlocks = sanitizeClassBlocks(blocks);

  for (const block of safeBlocks) {
    for (let poseIndex = 0; poseIndex < block.poseCount; poseIndex += 1) {
      expanded.push({
        label: block.label,
        durationSeconds: block.durationSeconds
      });
    }
  }

  return expanded;
}
