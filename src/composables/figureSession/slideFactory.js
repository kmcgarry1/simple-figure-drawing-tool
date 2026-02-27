import { SESSION_PHOTO_LIMIT } from "../../config";
import {
  CLASS_BLOCK_TYPE_BREAK,
  sanitizeClassBlocks
} from "../../utils/classPlan";
import { chooseRandomPhotos, createPhotoId } from "../../utils/photoInput";
import { PHOTO_ORDER_SEQUENTIAL } from "./constants";

function createSlideFromPose(file, pose, index) {
  return {
    kind: "pose",
    file,
    durationSeconds: pose.durationSeconds,
    durationMs: pose.durationSeconds * 1000,
    label: pose.label,
    poseNumber: index + 1
  };
}

function createBreakSlide({ label, durationSeconds, breakNumber }) {
  return {
    kind: "break",
    durationSeconds,
    durationMs: durationSeconds * 1000,
    label,
    breakNumber
  };
}

function buildPhotoSequenceForBlock({
  eligiblePhotos,
  poseCount,
  classPhotoOrder,
  avoidImmediateRepeats,
  previousPhoto
}) {
  if (eligiblePhotos.length === 0 || poseCount <= 0) {
    return [];
  }

  if (classPhotoOrder === PHOTO_ORDER_SEQUENTIAL) {
    const startOffset =
      avoidImmediateRepeats &&
      previousPhoto &&
      eligiblePhotos.length > 1 &&
      eligiblePhotos[0] === previousPhoto
        ? 1
        : 0;

    return Array.from(
      { length: poseCount },
      (_, index) => eligiblePhotos[(startOffset + index) % eligiblePhotos.length]
    );
  }

  const sequence = [];
  let shuffledPool = chooseRandomPhotos(eligiblePhotos, eligiblePhotos.length);
  let poolIndex = 0;
  let lastPhoto = previousPhoto;

  for (let poseIndex = 0; poseIndex < poseCount; poseIndex += 1) {
    if (poolIndex >= shuffledPool.length) {
      shuffledPool = chooseRandomPhotos(eligiblePhotos, eligiblePhotos.length);
      poolIndex = 0;
    }

    let candidate = shuffledPool[poolIndex];
    const previous = sequence.length > 0 ? sequence[sequence.length - 1] : lastPhoto;

    if (avoidImmediateRepeats && previous && eligiblePhotos.length > 1 && candidate === previous) {
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
        const replacementPool = chooseRandomPhotos(eligiblePhotos, eligiblePhotos.length);
        if (replacementPool[0] && replacementPool[0] !== previous) {
          shuffledPool = replacementPool;
          poolIndex = 0;
          candidate = shuffledPool[0];
        }
      }
    }

    sequence.push(candidate);
    lastPhoto = candidate;
    poolIndex += 1;
  }

  return sequence;
}

function resolveEligiblePhotosForBlock({ sourcePhotos, photoTagsById, blockTag }) {
  if (blockTag === "all") {
    return {
      eligiblePhotos: sourcePhotos,
      usedTagFallback: false
    };
  }

  const eligible = sourcePhotos.filter((photo) => photoTagsById[createPhotoId(photo)] === blockTag);
  if (eligible.length > 0) {
    return {
      eligiblePhotos: eligible,
      usedTagFallback: false
    };
  }

  return {
    eligiblePhotos: sourcePhotos,
    usedTagFallback: true
  };
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
    selectedPhotos,
    selectedPhotosCount: selectedPhotos.length
  };
}

export function createClassSlides({
  sourcePhotos,
  classBlocks,
  classPhotoOrder,
  avoidImmediateRepeats,
  photoTagsById = {}
}) {
  const safeBlocks = sanitizeClassBlocks(classBlocks);
  const slides = [];
  const fallbackTagBlocks = [];

  let poseIndex = 0;
  let breakIndex = 0;
  let previousPhoto = null;

  for (const block of safeBlocks) {
    if (block.blockType === CLASS_BLOCK_TYPE_BREAK) {
      for (let index = 0; index < block.poseCount; index += 1) {
        breakIndex += 1;
        slides.push(
          createBreakSlide({
            label: block.label,
            durationSeconds: block.durationSeconds,
            breakNumber: breakIndex
          })
        );
      }
      continue;
    }

    const { eligiblePhotos, usedTagFallback } = resolveEligiblePhotosForBlock({
      sourcePhotos,
      photoTagsById,
      blockTag: block.photoTag || "all"
    });
    if (usedTagFallback) {
      fallbackTagBlocks.push({
        label: block.label,
        photoTag: block.photoTag || "all"
      });
    }
    const photoSequence = buildPhotoSequenceForBlock({
      eligiblePhotos,
      poseCount: block.poseCount,
      classPhotoOrder,
      avoidImmediateRepeats,
      previousPhoto
    });

    for (const photo of photoSequence) {
      slides.push(
        createSlideFromPose(
          photo,
          {
            label: block.label,
            durationSeconds: block.durationSeconds
          },
          poseIndex
        )
      );
      previousPhoto = photo;
      poseIndex += 1;
    }
  }

  return {
    slides,
    safeBlocks,
    poseCount: poseIndex,
    breakCount: breakIndex,
    fallbackTagBlocks
  };
}
