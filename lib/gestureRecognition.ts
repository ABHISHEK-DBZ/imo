/**
 * Geometric Gesture Recognition Logic for MediaPipe Hands
 * 
 * Heuristics based on finger states (Extended vs Folded) and keypoint relationships.
 */

type Landmark = { x: number; y: number; z: number };

// Finger indices in MediaPipe Hands
const FINGER_TIPS = [8, 12, 16, 20]; // Index, Middle, Ring, Pinky
const FINGER_PIPS = [6, 10, 14, 18]; // PIP joints (knuckles)
const THUMB_TIP = 4;
const THUMB_IP = 3;
const THUMB_CMC = 1;

/**
 * Calculates the Euclidean distance between two points.
 */
const getDistance = (p1: Landmark, p2: Landmark) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

/**
 * Determines if a finger (Index, Middle, Ring, Pinky) is extended.
 * A finger is extended if the tip is farther from the wrist than the PIP joint.
 */
const isFingerExtended = (landmarks: Landmark[], tipIdx: number, pipIdx: number) => {
    // 0 is wrist
    return getDistance(landmarks[tipIdx], landmarks[0]) > getDistance(landmarks[pipIdx], landmarks[0]);
};

/**
 * Determines if the thumb is extended.
 * Heuristic: Tip is farther from the MCP (joint 2) or simply checking x-distance relative to palm.
 * For simplicity, we compare distance to Index Finger MCP (5) or Pinky MCP (17) depending on hand side, 
 * but a robust generic check is Tip distance from Wrist vs IP distance from Wrist.
 */
const isThumbExtended = (landmarks: Landmark[]) => {
    return getDistance(landmarks[THUMB_TIP], landmarks[17]) > getDistance(landmarks[THUMB_IP], landmarks[17]);
};

/**
 * Recognizes the sign based on landmarks.
 * @param landmarks Array of 21 landmarks from MediaPipe
 */
export const recognizeGesture = (landmarks: Landmark[]): string | null => {
    if (!landmarks || landmarks.length < 21) return null;

    // 1. Determine Finger States
    const thumbOpen = isThumbExtended(landmarks);
    const indexOpen = isFingerExtended(landmarks, 8, 5); // 5 is Index MAP (knuckle) - Wait, using PIP (6) logic above
    // Let's stick to the function logic: Tip (8) vs PIP (6) ? actually, comparing to wrist (0) works well for extension
    // Function signature: isFingerExtended(landmarks, tip, pip)
    // Refined heuristic: Tip distance to wrist > PIP distance to wrist is a good proxy for "straight"
    const indexExtended = getDistance(landmarks[8], landmarks[0]) > getDistance(landmarks[6], landmarks[0]);
    const middleExtended = getDistance(landmarks[12], landmarks[0]) > getDistance(landmarks[10], landmarks[0]);
    const ringExtended = getDistance(landmarks[16], landmarks[0]) > getDistance(landmarks[14], landmarks[0]);
    const pinkyExtended = getDistance(landmarks[20], landmarks[0]) > getDistance(landmarks[18], landmarks[0]);

    // Thumb heuristic is tricky because it moves laterally. 
    // Let's use a simpler check: Is thumb tip far from index knuckle (5)?
    const thumbExtended = getDistance(landmarks[4], landmarks[9]) > 0.05; // 9 is middle finger knuckle
    // Or check relative x position if we knew handedness.


    // 2. Classify Signs via Rule-Based System

    // HELLO / FIVE / STOP: All fingers open
    if (thumbExtended && indexExtended && middleExtended && ringExtended && pinkyExtended) {
        return "Hello";
    }

    // VICTORY / TWO: Index & Middle open, others closed
    if (!thumbExtended && indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
        return "Victory";
    }

    // THUMBS UP: Thumb open (and pointing up), others closed
    // Checking "Up" requires Y-coordinate. y decreases as we go up.
    if (indexExtended === false && middleExtended === false && ringExtended === false && pinkyExtended === false) {
        // All fingers curled. Check thumb.
        if (landmarks[4].y < landmarks[3].y) { // Thumb tip above thumb IP
            return "Good"; // Thumbs Up
        }
        // Thumbs Down check? Tip below IP
        // if (landmarks[4].y > landmarks[3].y) return "Bad"; 
    }

    // I LOVE YOU (ILY): Thumb, Index, Pinky open. Middle & Ring closed.
    if (thumbExtended && indexExtended && !middleExtended && !ringExtended && pinkyExtended) {
        return "Love";
    }

    // POINT / ONE: Index only
    if (!thumbExtended && indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
        return "Look";
    }

    // FIST (Pain/Help/Silence?): All closed
    if (!thumbExtended && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
        // Check for "Help" - usually a fist on palm, but simple fist can represent "Pain" or "Help" in this limited context
        return "Help";
    }

    // CALL ME: Thumb and Pinky
    if (thumbExtended && !indexExtended && !middleExtended && !ringExtended && pinkyExtended) {
        return "Call";
    }

    // OK SIGN: Thumb and Index touching, others extended
    const thumbIndexDist = getDistance(landmarks[4], landmarks[8]);
    if (thumbIndexDist < 0.05 && middleExtended && ringExtended && pinkyExtended) {
        return "Thanks"; // Using OK sign for Thanks/Perfect often in casual heuristics
    }

    return null;
};
