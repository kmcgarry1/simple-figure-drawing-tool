import { SESSION_PHOTO_LIMIT } from "../../config";
import { expandClassBlocks, sanitizeClassBlocks } from "../../utils/classPlan";
import { chooseRandomPhotos } from "../../utils/photoInput";
import { PHOTO_ORDER_SEQUENTIAL } from "./constants";

function createSlideFromPose(file, pose, index) {
  return {
    file,
    durationSeconds: pose.durationSeconds,
    durationMs: pose.durationSeconds * 1000,
    label: pose.label,
    poseNumber: index + 1,
    kind: "pose"
  };
}

function createBreakSlide(breakSeconds, afterLabel, index) {
  return {
    file: null,
    durationSeconds: breakSeconds,
    durationMs: breakSeconds * 1000,
    label: `${afterLabel} Break`,
    poseNumber: null,
    breakNumber: index + 1,
    kind: "break"
  };
}

function buildClassPhotoSequence({
  sourcePhotos,
  totalPoses,
  classPhotoOrder,
  avoidImmediateRepeats
}) {
  if (sourcePhotos.length === 0 || totalPoses <= 0) {
    return [];
  }

  if (classPhotoOrder === PHOTO_ORDER_SEQUENTIAL) {
    return Array.from({ length: totalPoses }, (_, index) => sourcePhotos[index % sourcePhotos.length]);
  }

  const sequence = [];
  let shuffledPool = chooseRandomPhotos(sourcePhotos, sourcePhotos.length);
  let poolIndex = 0;

  for (let poseIndex = 0; poseIndex < totalPoses; poseIndex += 1) {
    if (poolIndex >= shuffledPool.length) {
      shuffledPool = chooseRandomPhotos(sourcePhotos, sourcePhotos.length);
      poolIndex = 0;
    }

    let candidate = shuffledPool[poolIndex];
    const previous = sequence.length > 0 ? sequence[sequence.length - 1] : null;

    if (avoidImmediateRepeats && previous && sourcePhotos.length > 1 && candidate === previous) {
      const alternativeIndex = shuffledPool.findIndex(
        (photo, index) => index >= poolIndex && photo !== previous
      );

      if (alternativeIndex >= 0) {
        [shuffledPool[poolIndex], shuffledPool[alternativeIndex]] = [
          shuffledPool[alternativeIndex],
          shuffledPool[poolIndex]
        ];
        candidate = shuffledPool[poolIndex];
      } else {
        const replacementPool = chooseRandomPhotos(sourcePhotos, sourcePhotos.length);
        if (replacementPool[0] && replacementPool[0] !== previous) {
          shuffledPool = replacementPool;
          poolIndex = 0;
          candidate = shuffledPool[0];
        }
      }
    }

    sequence.push(candidate);
    poolIndex += 1;
  }

  return sequence;
}

export function createQuickSlides(sourcePhotos, durationSeconds) {
  const pickCount = Math.min(SESSION_PHOTO_LIMIT, sourcePhotos.length);
  const selectedPhotos = chooseRandomPhotos(sourcePhotos, pickCount);
  const slides = selectedPhotos.map((file, index) =>
    createSlideFromPose(
      file,
      {
        label: "Gesture Pose",
        durationSeconds
      },
      index
    )
  );

  return {
    slides,
    selectedPhotosCount: selectedPhotos.length
  };
}

export function createClassSlides({
  sourcePhotos,
  classBlocks,
  classPhotoOrder,
  avoidImmediateRepeats
}) {
  const safeBlocks = sanitizeClassBlocks(classBlocks);
  const poses = expandClassBlocks(safeBlocks);
  const photoSequence = buildClassPhotoSequence({
    sourcePhotos,
    totalPoses: poses.length,
    classPhotoOrder,
    avoidImmediateRepeats
  });

  const slides = [];
  let poseCursor = 0;
  let breakCursor = 0;

  safeBlocks.forEach((block, blockIndex) => {
    for (let poseIndex = 0; poseIndex < block.poseCount; poseIndex += 1) {
      slides.push(
        createSlideFromPose(
          photoSequence[poseCursor],
          {
            label: block.label,
            durationSeconds: block.durationSeconds
          },
          poseCursor
        )
      );
      poseCursor += 1;
    }

    const shouldAddBreak =
      blockIndex < safeBlocks.length - 1 && Number(block.breakAfterSeconds) > 0;
    if (shouldAddBreak) {
      slides.push(createBreakSlide(block.breakAfterSeconds, block.label, breakCursor));
      breakCursor += 1;
    }
  });

  return {
    slides,
    safeBlocks,
    poseCount: poses.length
  };
}
