/**
 * Emotion Recognition Engine
 * 
 * Uses heuristic analysis of facial landmarks from MediaPipe Face Mesh.
 * Focuses on high-confidence emotions relevant to communication context:
 * - Happy (Smile)
 * - Surprise/Fear (Mouth Open + Eyes Wide)
 * - Neutral
 */

type Landmark = { x: number; y: number; z: number };

/**
 * Calculates Euclidean distance between two 3D points
 */
const getDistance = (p1: Landmark, p2: Landmark) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2));
};

/**
 * Detects emotion based on face landmarks.
 * @param landmarks Array of 468 or 478 face landmarks
 * @returns 'Neutral' | 'Happy' | 'Urgent' (Fear/Surprise/Stress)
 */
export const detectEmotion = (landmarks: Landmark[]): 'Neutral' | 'Happy' | 'Urgent' => {
    if (!landmarks || landmarks.length < 468) return 'Neutral';

    // Key Landmarks (based on MediaPipe Face Mesh topology)
    // Lips
    const upperLipTop = landmarks[13];
    const lowerLipBottom = landmarks[14];
    const mouthLeft = landmarks[61];
    const mouthRight = landmarks[291];

    // Eyes (Eyelids)
    // Left Eye
    const leftEyeTop = landmarks[159];
    const leftEyeBottom = landmarks[145];
    // Right Eye
    const rightEyeTop = landmarks[386];
    const rightEyeBottom = landmarks[374];

    // Eyebrows
    // const leftEyebrow = landmarks[105];
    // const rightEyebrow = landmarks[334];

    // 1. Calculate Mouth Aspect Ratio (MAR) or simple opening
    // Distance between lips vertical vs horizontal
    const mouthHeight = getDistance(upperLipTop, lowerLipBottom);
    const mouthWidth = getDistance(mouthLeft, mouthRight);
    const mouthRatio = mouthHeight / mouthWidth;

    // 2. Calculate Eye Opening (EAR equivalent or raw distance)
    const leftEyeOpen = getDistance(leftEyeTop, leftEyeBottom);
    const rightEyeOpen = getDistance(rightEyeTop, rightEyeBottom);
    const avgEyeOpen = (leftEyeOpen + rightEyeOpen) / 2;

    // 3. Smile Detection
    // When smiling, mouth width usually increases and corners go up (relative check needed), 
    // but mouthHeight is usually small.
    // Simple heuristic: Wide mouth + formatted ratio
    // Ideally, we compare to a neutral baseline, but for 0-shot:
    // Smile often pulls corners up (y decreases) relative to center lip.
    const lipCornersY = (mouthLeft.y + mouthRight.y) / 2;
    const lipCenterY = (upperLipTop.y + lowerLipBottom.y) / 2;

    // Smile check: Corners are significantly higher (smaller y) than center? 
    // (Note: Mesh coordinates: y increases downwards).
    // Actually, simple mouth width is a decent proxy for strong smiles if calibrated, 
    // but checking corner curvature is better.
    const isSmiling = (mouthLeft.y < upperLipTop.y && mouthRight.y < upperLipTop.y) || (mouthWidth > 0.45); // Threshold heuristic

    // 4. Urgency/Fear/Surprise Detection
    // Mouth wide open + Eyes wide open
    // Thresholds need tuning.
    const isMouthOpen = mouthRatio > 0.5; // Tuned value
    const isEyesWide = avgEyeOpen > 0.035; // Tuned value relative to face size (normalized coords)

    if (isMouthOpen && isEyesWide) {
        return 'Urgent';
    }

    // Smile detection is tricky without baseline, but "Happy" is less critical for safety than "Urgent".
    // Let's rely on the semantic "Mouth Open" for urgency primarily.
    // For Happy, let's look at simple lip curvature.
    // If corners are above the upper lip...
    if (mouthLeft.y < upperLipTop.y && mouthRight.y < upperLipTop.y) {
        return 'Happy';
    }

    return 'Neutral';
};
