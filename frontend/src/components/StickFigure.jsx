import React from 'react';

/**
 * StickFigure
 * SVG stick figure that changes pose based on the current dance move.
 * Props:
 *   move: string — current move ID
 *   color: string — player color hex
 *   size: number — width/height in px (default 80)
 *   ghost: bool — semi-transparent upcoming move preview
 *   label: bool — show move label below
 */

const POSES = {
  step_left: {
    body: 'M40,30 L40,60',
    leftArm: 'M40,38 L20,30',
    rightArm: 'M40,38 L55,45',
    leftLeg: 'M40,60 L20,80',
    rightLeg: 'M40,60 L50,80',
    head: { cx: 40, cy: 22, r: 10 },
  },
  step_right: {
    body: 'M40,30 L40,60',
    leftArm: 'M40,38 L25,45',
    rightArm: 'M40,38 L60,30',
    leftLeg: 'M40,60 L30,80',
    rightLeg: 'M40,60 L60,80',
    head: { cx: 40, cy: 22, r: 10 },
  },
  clap: {
    body: 'M40,30 L40,60',
    leftArm: 'M40,38 L30,50',
    rightArm: 'M40,38 L50,50',
    leftLeg: 'M40,60 L32,80',
    rightLeg: 'M40,60 L48,80',
    head: { cx: 40, cy: 22, r: 10 },
  },
  bounce: {
    body: 'M40,28 L40,55',
    leftArm: 'M40,38 L22,30',
    rightArm: 'M40,38 L58,30',
    leftLeg: 'M40,55 L30,75',
    rightLeg: 'M40,55 L50,75',
    head: { cx: 40, cy: 20, r: 10 },
  },
  arm_cross: {
    body: 'M40,30 L40,60',
    leftArm: 'M40,38 L55,48',
    rightArm: 'M40,38 L25,48',
    leftLeg: 'M40,60 L32,80',
    rightLeg: 'M40,60 L48,80',
    head: { cx: 40, cy: 22, r: 10 },
  },
  arm_swing: {
    body: 'M40,30 L40,60',
    leftArm: 'M40,38 L18,25',
    rightArm: 'M40,38 L62,25',
    leftLeg: 'M40,60 L32,80',
    rightLeg: 'M40,60 L48,80',
    head: { cx: 40, cy: 22, r: 10 },
  },
  spin: {
    body: 'M40,30 L40,60',
    leftArm: 'M40,38 L18,38',
    rightArm: 'M40,38 L62,38',
    leftLeg: 'M40,60 L25,75',
    rightLeg: 'M40,60 L55,75',
    head: { cx: 40, cy: 22, r: 10 },
  },
  pivot: {
    body: 'M40,30 L40,60',
    leftArm: 'M40,38 L22,32',
    rightArm: 'M40,38 L58,44',
    leftLeg: 'M40,60 L28,78',
    rightLeg: 'M40,60 L52,78',
    head: { cx: 40, cy: 22, r: 10 },
  },
  point: {
    body: 'M40,30 L40,60',
    leftArm: 'M40,38 L25,50',
    rightArm: 'M40,38 L62,22',
    leftLeg: 'M40,60 L32,80',
    rightLeg: 'M40,60 L48,80',
    head: { cx: 40, cy: 22, r: 10 },
  },
  footwork: {
    body: 'M40,30 L40,58',
    leftArm: 'M40,38 L22,30',
    rightArm: 'M40,38 L58,30',
    leftLeg: 'M40,58 L22,72',
    rightLeg: 'M40,58 L55,78',
    head: { cx: 40, cy: 22, r: 10 },
  },
  default: {
    body: 'M40,30 L40,60',
    leftArm: 'M40,40 L25,52',
    rightArm: 'M40,40 L55,52',
    leftLeg: 'M40,60 L30,80',
    rightLeg: 'M40,60 L50,80',
    head: { cx: 40, cy: 22, r: 10 },
  },
};

export default function StickFigure({ move = 'default', color = '#e94560', size = 80, ghost = false, label = false }) {
  const pose = POSES[move] || POSES.default;
  const opacity = ghost ? 0.35 : 1;
  const strokeW = size < 60 ? 2.5 : 3;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 80 90"
        style={{ opacity, transition: 'opacity 0.2s' }}
      >
        {/* Head */}
        <circle
          cx={pose.head.cx}
          cy={pose.head.cy}
          r={pose.head.r}
          fill="none"
          stroke={color}
          strokeWidth={strokeW}
        />
        {/* Body */}
        <path d={pose.body} stroke={color} strokeWidth={strokeW} fill="none" strokeLinecap="round" />
        {/* Arms */}
        <path d={pose.leftArm} stroke={color} strokeWidth={strokeW} fill="none" strokeLinecap="round" />
        <path d={pose.rightArm} stroke={color} strokeWidth={strokeW} fill="none" strokeLinecap="round" />
        {/* Legs */}
        <path d={pose.leftLeg} stroke={color} strokeWidth={strokeW} fill="none" strokeLinecap="round" />
        <path d={pose.rightLeg} stroke={color} strokeWidth={strokeW} fill="none" strokeLinecap="round" />
      </svg>
      {label && (
        <span style={{
          fontSize: size < 60 ? 9 : 11,
          color,
          opacity: ghost ? 0.5 : 0.9,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          textAlign: 'center',
          maxWidth: size,
          lineHeight: 1.1,
        }}>
          {move.replace(/_/g, ' ')}
        </span>
      )}
    </div>
  );
}
