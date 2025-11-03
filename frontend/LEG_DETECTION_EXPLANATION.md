# How Leg Detection Works

## Overview
The system uses **MediaPipe Pose** - a machine learning model trained to detect human body pose from video/camera feeds.

## Detection Process

### Step 1: Video Input
- Your webcam/camera sends video frames (30 fps)
- Each frame is sent to MediaPipe Pose for analysis

### Step 2: MediaPipe Pose Detection
MediaPipe analyzes each frame and detects **33 body landmarks** (body joints):
- Face landmarks (nose, eyes, mouth) - indices 0-10
- Upper body (shoulders, elbows, wrists) - indices 11-22
- **Lower body (hips, knees, ankles) - indices 23-28** ← We focus on these

### Step 3: Leg Joint Mapping
MediaPipe identifies these leg landmarks:
- **Index 23**: Left Hip
- **Index 24**: Right Hip
- **Index 25**: Left Knee
- **Index 26**: Right Knee
- **Index 27**: Left Ankle
- **Index 28**: Right Ankle

### Step 4: Visibility Check
Each landmark has a **visibility score** (0.0 to 1.0):
- **1.0** = Fully visible, high confidence
- **0.5** = Partially visible
- **0.05** = Very low confidence (we accept this to catch more detections)
- **0.0** = Not detected

### Step 5: Coordinate Extraction
For each detected leg joint, MediaPipe provides:
- **x, y coordinates** (0.0 to 1.0, normalized to video dimensions)
- **visibility score** (0.0 to 1.0)
- **z depth** (relative depth in 3D space)

### Step 6: Smoothing & Stabilization
To prevent jumping/jittery detection:
1. **Buffer averaging**: Stores last 20 frames, calculates average position
2. **Exponential smoothing**: Applies smoothing factor (0.1) for gradual movement
3. **Dead zone filter**: Rejects sudden large jumps (>5% of screen)

### Step 7: Visual Display
- Draws colored markers on detected joints:
  - **Red circles**: Hips
  - **Yellow circles**: Knees (main focus)
  - **Blue circles**: Ankles
- Draws green lines connecting: Hip → Knee → Ankle

### Step 8: ACL Risk Analysis
Calculates angles from the detected joint positions:
- **Knee Flexion Angle**: Hip-Knee-Ankle angle (how bent your knee is)
- **Valgus Angle**: How much your knee caves inward (major ACL risk factor)

## Code Location

The detection happens in:
- **File**: `frontend/pages/live-monitoring.tsx`
- **Function**: `pose.onResults()` - line ~343
- **Leg Landmark Extraction**: line ~391-393
- **ACL Analysis**: `analyzeACLRisk()` - line ~679

## Why It Needs Full Body

MediaPipe Pose uses **context** from your full body to accurately detect legs:
- Upper body landmarks help estimate leg positions
- Body proportions help verify correct detection
- Full pose provides better accuracy than leg-only detection

This is why you need your **full body visible** (head to feet) for best leg detection!

## Detection Quality Factors

✅ **Good Detection:**
- Full body visible (head to feet)
- Good lighting
- Clear background
- Standing 4-6 feet from camera
- Facing camera directly

❌ **Poor Detection:**
- Only legs visible (no upper body context)
- Poor lighting
- Cluttered background
- Too close or too far from camera
- Side angle or profile view

