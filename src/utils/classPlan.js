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

export const CLASS_BLOCK_TYPE_POSE = "pose";
export const CLASS_BLOCK_TYPE_BREAK = "break";

const CLASS_PRESET_BLOCKS = Object.freeze({
  "class-1h": Object.freeze([
    {
      blockType: CLASS_BLOCK_TYPE_POSE,
      label: "Warm-up",
      durationSeconds: 30,
      poseCount: 8,
      photoTag: "all"
    },
    {
      blockType: CLASS_BLOCK_TYPE_POSE,
      label: "Warm-up",
      durationSeconds: 60,
      poseCount: 6,
      photoTag: "all"
    },
    {
      blockType: CLASS_BLOCK_TYPE_POSE,
      label: "Gesture",
      durationSeconds: 120,
      poseCount: 10,
      photoTag: "all"
    },
    {
      blockType: CLASS_BLOCK_TYPE_POSE,
      label: "Long Pose",
      durationSeconds: 300,
      poseCount: 4,
      photoTag: "all"
    },
    {
      blockType: CLASS_BLOCK_TYPE_POSE,
      label: "Final Pose",
      durationSeconds: 600,
      poseCount: 1,
      photoTag: "all"
    }
  ]),
  "class-2h": Object.freeze([
    {
      blockType: CLASS_BLOCK_TYPE_POSE,
      label: "Warm-up",
      durationSeconds: 30,
      poseCount: 10,
      photoTag: "all"
    },
    {
      blockType: CLASS_BLOCK_TYPE_POSE,
      label: "Warm-up",
      durationSeconds: 60,
      poseCount: 10,
      photoTag: "all"
    },
    {
      blockType: CLASS_BLOCK_TYPE_POSE,
      label: "Gesture",
      durationSeconds: 120,
      poseCount: 15,
      photoTag: "all"
    },
    {
      blockType: CLASS_BLOCK_TYPE_POSE,
      label: "Long Pose",
      durationSeconds: 300,
      poseCount: 9,
      photoTag: "all"
    },
    {
      blockType: CLASS_BLOCK_TYPE_POSE,
      label: "Final Pose",
      durationSeconds: 1800,
      poseCount: 1,
      photoTag: "all"
    }
  ]),
  "class-3h": Object.freeze([
    {
      blockType: CLASS_BLOCK_TYPE_POSE,
      label: "Warm-up",
      durationSeconds: 30,
      poseCount: 12,
      photoTag: "all"
    },
    {
      blockType: CLASS_BLOCK_TYPE_POSE,
      label: "Warm-up",
      durationSeconds: 60,
      poseCount: 12,
      photoTag: "all"
    },
    {
      blockType: CLASS_BLOCK_TYPE_POSE,
      label: "Gesture",
      durationSeconds: 120,
      poseCount: 21,
      photoTag: "all"
    },
    {
      blockType: CLASS_BLOCK_TYPE_POSE,
      label: "Long Pose",
      durationSeconds: 300,
      poseCount: 12,
      photoTag: "all"
    },
    {
      blockType: CLASS_BLOCK_TYPE_POSE,
      label: "Final Pose",
      durationSeconds: 3600,
      poseCount: 1,
      photoTag: "all"
    }
  ])
});

const FALLBACK_PRESET_ID = CLASS_PRESET_OPTIONS[0].id;
const DEFAULT_POSE_BLOCK = Object.freeze({
  label: "Custom Block",
  durationSeconds: 120,
  poseCount: 6,
  blockType: CLASS_BLOCK_TYPE_POSE,
  photoTag: "all"
});
const DEFAULT_BREAK_BLOCK = Object.freeze({
  label: "Break",
  durationSeconds: 300,
  poseCount: 1,
  blockType: CLASS_BLOCK_TYPE_BREAK,
  photoTag: "all"
});

const MIN_BLOCK_DURATION_SECONDS = 5;
const MAX_BLOCK_DURATION_SECONDS = 7200;
const MIN_BLOCK_POSE_COUNT = 1;
const MAX_BLOCK_POSE_COUNT = 200;
const MIN_ASSISTANT_TARGET_MINUTES = 15;
const MAX_ASSISTANT_TARGET_MINUTES = 360;
const MIN_ASSISTANT_GESTURE_SHARE_PERCENT = 10;
const MAX_ASSISTANT_GESTURE_SHARE_PERCENT = 90;
const DEFAULT_ASSISTANT_GESTURE_SHARE_PERCENT = 60;
const DEFAULT_ASSISTANT_BREAK_DURATION_SECONDS = 300;

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
      const rawBlockType = String(rawBlock?.blockType ?? "").trim().toLowerCase();
      const blockType =
        rawBlockType === CLASS_BLOCK_TYPE_BREAK
          ? CLASS_BLOCK_TYPE_BREAK
          : CLASS_BLOCK_TYPE_POSE;
      const defaultBlock =
        blockType === CLASS_BLOCK_TYPE_BREAK ? DEFAULT_BREAK_BLOCK : DEFAULT_POSE_BLOCK;

      const labelCandidate = String(rawBlock?.label ?? "").trim();
      const durationCandidate = clampToInt(
        rawBlock?.durationSeconds,
        MIN_BLOCK_DURATION_SECONDS,
        MAX_BLOCK_DURATION_SECONDS,
        defaultBlock.durationSeconds
      );
      const poseCountCandidate = clampToInt(
        rawBlock?.poseCount,
        MIN_BLOCK_POSE_COUNT,
        MAX_BLOCK_POSE_COUNT,
        defaultBlock.poseCount
      );
      const photoTagCandidate = String(rawBlock?.photoTag ?? "").trim();

      return {
        blockType,
        label: labelCandidate || defaultBlock.label,
        durationSeconds: durationCandidate,
        poseCount: poseCountCandidate,
        photoTag:
          blockType === CLASS_BLOCK_TYPE_BREAK
            ? "all"
            : photoTagCandidate || DEFAULT_POSE_BLOCK.photoTag
      };
    })
    .filter((block) => block.poseCount > 0);

  if (normalized.length > 0) {
    return normalized;
  }

  return [{ ...DEFAULT_POSE_BLOCK }];
}

export function calculateClassPlanSummary(blocks) {
  const safeBlocks = sanitizeClassBlocks(blocks);
  return safeBlocks.reduce(
    (summary, block) => {
      if (block.blockType === CLASS_BLOCK_TYPE_BREAK) {
        summary.totalBreaks += block.poseCount;
      } else {
        summary.totalPoses += block.poseCount;
      }
      summary.totalSeconds += block.durationSeconds * block.poseCount;
      return summary;
    },
    {
      totalPoses: 0,
      totalBreaks: 0,
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
        durationSeconds: block.durationSeconds,
        blockType: block.blockType
      });
    }
  }

  return expanded;
}

function normalizeAssistantTag(rawTag) {
  const candidate = String(rawTag ?? "").trim();
  return candidate || "all";
}

function resolveAssistantBreakCount(targetMinutes, includeBreaks) {
  if (!includeBreaks) {
    return 0;
  }

  if (targetMinutes >= 150) {
    return 2;
  }

  return targetMinutes >= 90 ? 1 : 0;
}

export function buildGuidedClassBlocks({
  targetMinutes,
  gestureSharePercent,
  gestureTag = "all",
  longPoseTag = "all",
  includeBreaks = true
}) {
  const resolvedTargetMinutes = clampToInt(
    targetMinutes,
    MIN_ASSISTANT_TARGET_MINUTES,
    MAX_ASSISTANT_TARGET_MINUTES,
    getClassPresetById().targetMinutes
  );
  const resolvedGestureSharePercent = clampToInt(
    gestureSharePercent,
    MIN_ASSISTANT_GESTURE_SHARE_PERCENT,
    MAX_ASSISTANT_GESTURE_SHARE_PERCENT,
    DEFAULT_ASSISTANT_GESTURE_SHARE_PERCENT
  );
  const resolvedBreakCount = resolveAssistantBreakCount(resolvedTargetMinutes, includeBreaks);
  const breakSeconds = resolvedBreakCount * DEFAULT_ASSISTANT_BREAK_DURATION_SECONDS;
  const targetPoseSeconds = Math.max(600, resolvedTargetMinutes * 60 - breakSeconds);
  const targetGestureSeconds = Math.round(
    (targetPoseSeconds * resolvedGestureSharePercent) / 100
  );
  const targetLongPoseSeconds = Math.max(300, targetPoseSeconds - targetGestureSeconds);

  const warmupDurationSeconds = 30;
  const warmupRatio = resolvedTargetMinutes >= 120 ? 0.15 : 0.2;
  const warmupCount = Math.max(
    2,
    Math.min(10, Math.round((targetGestureSeconds * warmupRatio) / warmupDurationSeconds))
  );

  const gestureDurationSeconds = resolvedTargetMinutes >= 120 ? 120 : 60;
  let gestureCount = Math.max(
    1,
    Math.round(
      Math.max(gestureDurationSeconds, targetGestureSeconds - warmupCount * warmupDurationSeconds) /
        gestureDurationSeconds
    )
  );

  const longPoseDurationSeconds =
    resolvedTargetMinutes >= 180 ? 900 : resolvedTargetMinutes >= 120 ? 600 : 300;
  let longPoseCount = Math.max(1, Math.round(targetLongPoseSeconds / longPoseDurationSeconds));

  const calculatePoseTotal = () =>
    warmupCount * warmupDurationSeconds +
    gestureCount * gestureDurationSeconds +
    longPoseCount * longPoseDurationSeconds;

  let poseDeltaSeconds = targetPoseSeconds - calculatePoseTotal();
  if (poseDeltaSeconds > 0) {
    gestureCount += Math.max(0, Math.round(poseDeltaSeconds / gestureDurationSeconds));
  } else if (poseDeltaSeconds < 0) {
    const reducibleGestureCount = Math.max(0, gestureCount - 1);
    const reduction = Math.min(
      reducibleGestureCount,
      Math.round(Math.abs(poseDeltaSeconds) / gestureDurationSeconds)
    );
    gestureCount -= reduction;
  }

  poseDeltaSeconds = targetPoseSeconds - calculatePoseTotal();
  if (poseDeltaSeconds > 0) {
    longPoseCount += Math.max(0, Math.round(poseDeltaSeconds / longPoseDurationSeconds));
  } else if (poseDeltaSeconds < 0) {
    const reducibleLongPoseCount = Math.max(0, longPoseCount - 1);
    const reduction = Math.min(
      reducibleLongPoseCount,
      Math.round(Math.abs(poseDeltaSeconds) / longPoseDurationSeconds)
    );
    longPoseCount -= reduction;
  }

  const nextBlocks = [
    {
      blockType: CLASS_BLOCK_TYPE_POSE,
      label: "Warm-up",
      durationSeconds: warmupDurationSeconds,
      poseCount: warmupCount,
      photoTag: normalizeAssistantTag(gestureTag)
    },
    {
      blockType: CLASS_BLOCK_TYPE_POSE,
      label: "Gesture Flow",
      durationSeconds: gestureDurationSeconds,
      poseCount: Math.max(1, gestureCount),
      photoTag: normalizeAssistantTag(gestureTag)
    }
  ];

  if (resolvedBreakCount > 0) {
    nextBlocks.push({
      blockType: CLASS_BLOCK_TYPE_BREAK,
      label: "Break",
      durationSeconds: DEFAULT_ASSISTANT_BREAK_DURATION_SECONDS,
      poseCount: 1,
      photoTag: "all"
    });
  }

  if (resolvedBreakCount > 1) {
    const firstHalfLongPoseCount = Math.max(1, Math.ceil(longPoseCount / 2));
    const secondHalfLongPoseCount = Math.max(1, longPoseCount - firstHalfLongPoseCount);

    nextBlocks.push({
      blockType: CLASS_BLOCK_TYPE_POSE,
      label: "Long Pose Study",
      durationSeconds: longPoseDurationSeconds,
      poseCount: firstHalfLongPoseCount,
      photoTag: normalizeAssistantTag(longPoseTag)
    });
    nextBlocks.push({
      blockType: CLASS_BLOCK_TYPE_BREAK,
      label: "Break",
      durationSeconds: DEFAULT_ASSISTANT_BREAK_DURATION_SECONDS,
      poseCount: 1,
      photoTag: "all"
    });
    nextBlocks.push({
      blockType: CLASS_BLOCK_TYPE_POSE,
      label: "Final Long Pose",
      durationSeconds: longPoseDurationSeconds,
      poseCount: secondHalfLongPoseCount,
      photoTag: normalizeAssistantTag(longPoseTag)
    });

    return sanitizeClassBlocks(nextBlocks);
  }

  nextBlocks.push({
    blockType: CLASS_BLOCK_TYPE_POSE,
    label: "Long Pose Study",
    durationSeconds: longPoseDurationSeconds,
    poseCount: Math.max(1, longPoseCount),
    photoTag: normalizeAssistantTag(longPoseTag)
  });

  return sanitizeClassBlocks(nextBlocks);
}
