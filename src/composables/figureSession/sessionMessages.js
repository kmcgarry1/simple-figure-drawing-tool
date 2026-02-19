export const IDLE_MESSAGE = "Upload at least 1 photo to begin.";
export const INVALID_UPLOAD_MESSAGE = "Upload at least 1 valid photo to begin.";

export function runningMessageForMode(sessionMode, slideCount, classModeValue) {
  return sessionMode === classModeValue
    ? `Running class: ${slideCount} poses.`
    : `Running session with ${slideCount} photo(s).`;
}

export function completionMessageForMode(sessionMode, classModeValue) {
  return sessionMode === classModeValue
    ? "Class complete. Press Start Class for another run."
    : "Session complete. Press Start Session for a new round.";
}

export function stopMessageForMode(sessionMode, classModeValue) {
  return sessionMode === classModeValue ? "Class ended." : "Session stopped.";
}
