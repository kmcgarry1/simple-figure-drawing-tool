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
    { label: "Warm-up", durationSeconds: 30, poseCount: 8, breakAfterSeconds: 0 },
    { label: "Warm-up", durationSeconds: 60, poseCount: 6, breakAfterSeconds: 0 },
    { label: "Gesture", durationSeconds: 120, poseCount: 10, breakAfterSeconds: 0 },
    { label: "Long Pose", durationSeconds: 300, poseCount: 4, breakAfterSeconds: 0 },
    { label: "Final Pose", durationSeconds: 600, poseCount: 1, breakAfterSeconds: 0 }
  ]),
  "class-2h": Object.freeze([
    { label: "Warm-up", durationSeconds: 30, poseCount: 10, breakAfterSeconds: 0 },
    { label: "Warm-up", durationSeconds: 60, poseCount: 10, breakAfterSeconds: 0 },
    { label: "Gesture", durationSeconds: 120, poseCount: 15, breakAfterSeconds: 0 },
    { label: "Long Pose", durationSeconds: 300, poseCount: 9, breakAfterSeconds: 0 },
    { label: "Final Pose", durationSeconds: 1800, poseCount: 1, breakAfterSeconds: 0 }
  ]),
  "class-3h": Object.freeze([
    { label: "Warm-up", durationSeconds: 30, poseCount: 12, breakAfterSeconds: 0 },
    { label: "Warm-up", durationSeconds: 60, poseCount: 12, breakAfterSeconds: 0 },
    { label: "Gesture", durationSeconds: 120, poseCount: 21, breakAfterSeconds: 0 },
    { label: "Long Pose", durationSeconds: 300, poseCount: 12, breakAfterSeconds: 0 },
    { label: "Final Pose", durationSeconds: 3600, poseCount: 1, breakAfterSeconds: 0 }
  ])
});

const FALLBACK_PRESET_ID = CLASS_PRESET_OPTIONS[0].id;
const DEFAULT_BLOCK = Object.freeze({
  label: "Custom Block",
  durationSeconds: 120,
  poseCount: 6,
  breakAfterSeconds: 0
});

const MIN_BLOCK_DURATION_SECONDS = 5;
const MAX_BLOCK_DURATION_SECONDS = 7200;
const MIN_BLOCK_POSE_COUNT = 1;
const MAX_BLOCK_POSE_COUNT = 200;
const MIN_BLOCK_BREAK_SECONDS = 0;
const MAX_BLOCK_BREAK_SECONDS = 3600;

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
      const breakAfterCandidate = clampToInt(
        rawBlock?.breakAfterSeconds,
        MIN_BLOCK_BREAK_SECONDS,
        MAX_BLOCK_BREAK_SECONDS,
        DEFAULT_BLOCK.breakAfterSeconds
      );

      return {
        label: labelCandidate || DEFAULT_BLOCK.label,
        durationSeconds: durationCandidate,
        poseCount: poseCountCandidate,
        breakAfterSeconds: breakAfterCandidate
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
    (summary, block, index) => {
      summary.totalPoses += block.poseCount;
      summary.totalSeconds += block.durationSeconds * block.poseCount;
      if (index < safeBlocks.length - 1 && block.breakAfterSeconds > 0) {
        summary.totalBreakSeconds += block.breakAfterSeconds;
        summary.totalSeconds += block.breakAfterSeconds;
      }
      return summary;
    },
    {
      totalPoses: 0,
      totalSeconds: 0,
      totalBreakSeconds: 0
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
