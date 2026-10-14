/**
 * SVG Animation Presets, Keyframe Generator & CSS Builder
 */

export const EASING_OPTIONS = [
  { label: 'Ease In Out', value: 'ease-in-out' },
  { label: 'Ease', value: 'ease' },
  { label: 'Linear', value: 'linear' },
  { label: 'Ease In', value: 'ease-in' },
  { label: 'Ease Out', value: 'ease-out' },
  { label: 'Spring / Bounce', value: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
  { label: 'Snappy', value: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
  { label: 'Smooth Float', value: 'cubic-bezier(0.4, 0, 0.2, 1)' }
];

export const TRANSFORM_ORIGINS = [
  { label: 'Center', value: 'center' },
  { label: 'Top', value: 'top center' },
  { label: 'Bottom', value: 'bottom center' },
  { label: 'Left', value: 'center left' },
  { label: 'Right', value: 'center right' },
  { label: 'Top Left', value: 'top left' },
  { label: 'Top Right', value: 'top right' },
  { label: 'Bottom Left', value: 'bottom left' },
  { label: 'Bottom Right', value: 'bottom right' }
];

export const ITERATION_OPTIONS = [
  { label: 'Infinite', value: 'infinite' },
  { label: '1 Time', value: '1' },
  { label: '2 Times', value: '2' },
  { label: '3 Times', value: '3' },
  { label: '5 Times', value: '5' }
];

export const DIRECTION_OPTIONS = [
  { label: 'Normal', value: 'normal' },
  { label: 'Reverse', value: 'reverse' },
  { label: 'Alternate', value: 'alternate' },
  { label: 'Alternate Reverse', value: 'alternate-reverse' }
];

export const FILL_MODE_OPTIONS = [
  { label: 'Both', value: 'both' },
  { label: 'Forwards', value: 'forwards' },
  { label: 'Backwards', value: 'backwards' },
  { label: 'None', value: 'none' }
];

export const ANIMATION_PRESETS = [
  {
    id: 'fadeIn',
    name: 'Fade In',
    category: 'Entrance',
    description: 'Smoothly transitions opacity from hidden to visible.',
    defaultDuration: 1.2,
    defaultEasing: 'ease-out',
    defaultIterations: 'infinite',
    defaultDirection: 'alternate',
    keyframes: [
      { progress: 0, properties: { opacity: 0 } },
      { progress: 100, properties: { opacity: 1 } }
    ],
    generateKeyframes: () => `
      0% { opacity: 0; }
      100% { opacity: 1; }
    `
  },
  {
    id: 'fadeOut',
    name: 'Fade Out',
    category: 'Exit',
    description: 'Smoothly transitions opacity from visible to hidden.',
    defaultDuration: 1.2,
    defaultEasing: 'ease-in',
    defaultIterations: 'infinite',
    defaultDirection: 'alternate',
    keyframes: [
      { progress: 0, properties: { opacity: 1 } },
      { progress: 100, properties: { opacity: 0 } }
    ],
    generateKeyframes: () => `
      0% { opacity: 1; }
      100% { opacity: 0; }
    `
  },
  {
    id: 'slideInLeft',
    name: 'Slide In Left',
    category: 'Entrance',
    description: 'Slides into view horizontally from the left.',
    defaultDuration: 1.5,
    defaultEasing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    defaultIterations: 'infinite',
    defaultDirection: 'alternate',
    keyframes: [
      { progress: 0, properties: { transform: 'translateX(-60px)', opacity: 0 } },
      { progress: 100, properties: { transform: 'translateX(0)', opacity: 1 } }
    ],
    generateKeyframes: () => `
      0% { transform: translateX(-60px); opacity: 0; }
      100% { transform: translateX(0); opacity: 1; }
    `
  },
  {
    id: 'slideInRight',
    name: 'Slide In Right',
    category: 'Entrance',
    description: 'Slides into view horizontally from the right.',
    defaultDuration: 1.5,
    defaultEasing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    defaultIterations: 'infinite',
    defaultDirection: 'alternate',
    keyframes: [
      { progress: 0, properties: { transform: 'translateX(60px)', opacity: 0 } },
      { progress: 100, properties: { transform: 'translateX(0)', opacity: 1 } }
    ],
    generateKeyframes: () => `
      0% { transform: translateX(60px); opacity: 0; }
      100% { transform: translateX(0); opacity: 1; }
    `
  },
  {
    id: 'slideInUp',
    name: 'Slide In Up',
    category: 'Entrance',
    description: 'Ascends vertically into position from below.',
    defaultDuration: 1.5,
    defaultEasing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    defaultIterations: 'infinite',
    defaultDirection: 'alternate',
    keyframes: [
      { progress: 0, properties: { transform: 'translateY(50px)', opacity: 0 } },
      { progress: 100, properties: { transform: 'translateY(0)', opacity: 1 } }
    ],
    generateKeyframes: () => `
      0% { transform: translateY(50px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    `
  },
  {
    id: 'slideOut',
    name: 'Slide Out Down',
    category: 'Exit',
    description: 'Slides downward out of sight.',
    defaultDuration: 1.5,
    defaultEasing: 'ease-in',
    defaultIterations: 'infinite',
    defaultDirection: 'alternate',
    keyframes: [
      { progress: 0, properties: { transform: 'translateY(0)', opacity: 1 } },
      { progress: 100, properties: { transform: 'translateY(60px)', opacity: 0 } }
    ],
    generateKeyframes: () => `
      0% { transform: translateY(0); opacity: 1; }
      100% { transform: translateY(60px); opacity: 0; }
    `
  },
  {
    id: 'bounce',
    name: 'Bounce',
    category: 'Attention',
    description: 'Playful kinetic bouncing effect with squash and stretch.',
    defaultDuration: 1.8,
    defaultEasing: 'ease-in-out',
    defaultIterations: 'infinite',
    defaultDirection: 'normal',
    keyframes: [
      { progress: 0, properties: { transform: 'translateY(0)' } },
      { progress: 20, properties: { transform: 'translateY(0)' } },
      { progress: 40, properties: { transform: 'translateY(-24px)' } },
      { progress: 60, properties: { transform: 'translateY(-12px)' } },
      { progress: 80, properties: { transform: 'translateY(0)' } },
      { progress: 100, properties: { transform: 'translateY(0)' } }
    ],
    generateKeyframes: () => `
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-26px); }
      60% { transform: translateY(-12px); }
    `
  },
  {
    id: 'pulse',
    name: 'Pulse',
    category: 'Attention',
    description: 'Rhythmic heartbeat pulsing scale expansion and contraction.',
    defaultDuration: 1.4,
    defaultEasing: 'ease-in-out',
    defaultIterations: 'infinite',
    defaultDirection: 'normal',
    keyframes: [
      { progress: 0, properties: { transform: 'scale(1)' } },
      { progress: 50, properties: { transform: 'scale(1.15)' } },
      { progress: 100, properties: { transform: 'scale(1)' } }
    ],
    generateKeyframes: () => `
      0% { transform: scale(1); }
      50% { transform: scale(1.16); }
      100% { transform: scale(1); }
    `
  },
  {
    id: 'rotate',
    name: 'Rotate (360° Spin)',
    category: 'Transforms',
    description: 'Smooth continuous 360-degree rotation.',
    defaultDuration: 3,
    defaultEasing: 'linear',
    defaultIterations: 'infinite',
    defaultDirection: 'normal',
    keyframes: [
      { progress: 0, properties: { transform: 'rotate(0deg)' } },
      { progress: 100, properties: { transform: 'rotate(360deg)' } }
    ],
    generateKeyframes: () => `
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    `
  },
  {
    id: 'shake',
    name: 'Shake',
    category: 'Attention',
    description: 'Vigorous horizontal shaking / alert vibration.',
    defaultDuration: 0.8,
    defaultEasing: 'ease-in-out',
    defaultIterations: 'infinite',
    defaultDirection: 'normal',
    keyframes: [
      { progress: 0, properties: { transform: 'translateX(0)' } },
      { progress: 20, properties: { transform: 'translateX(-8px)' } },
      { progress: 40, properties: { transform: 'translateX(8px)' } },
      { progress: 60, properties: { transform: 'translateX(-6px)' } },
      { progress: 80, properties: { transform: 'translateX(6px)' } },
      { progress: 100, properties: { transform: 'translateX(0)' } }
    ],
    generateKeyframes: () => `
      0%, 100% { transform: translateX(0); }
      15%, 45%, 75% { transform: translateX(-8px); }
      30%, 60%, 90% { transform: translateX(8px); }
    `
  },
  {
    id: 'float',
    name: 'Float',
    category: 'Attention',
    description: 'Weightless hovering motion with gentle vertical drift.',
    defaultDuration: 2.4,
    defaultEasing: 'ease-in-out',
    defaultIterations: 'infinite',
    defaultDirection: 'normal',
    keyframes: [
      { progress: 0, properties: { transform: 'translateY(0)' } },
      { progress: 50, properties: { transform: 'translateY(-14px)' } },
      { progress: 100, properties: { transform: 'translateY(0)' } }
    ],
    generateKeyframes: () => `
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-14px); }
    `
  },
  {
    id: 'zoom',
    name: 'Zoom (Scale & Glow)',
    category: 'Transforms',
    description: 'Zooms in from a focal center with smooth acceleration.',
    defaultDuration: 1.6,
    defaultEasing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    defaultIterations: 'infinite',
    defaultDirection: 'alternate',
    keyframes: [
      { progress: 0, properties: { transform: 'scale(0.3)', opacity: 0 } },
      { progress: 100, properties: { transform: 'scale(1)', opacity: 1 } }
    ],
    generateKeyframes: () => `
      0% { transform: scale(0.3); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    `
  },
  {
    id: 'flip',
    name: 'Flip (3D Rotate)',
    category: 'Transforms',
    description: 'Flips 360 degrees around the Y-axis.',
    defaultDuration: 2.2,
    defaultEasing: 'ease-in-out',
    defaultIterations: 'infinite',
    defaultDirection: 'normal',
    keyframes: [
      { progress: 0, properties: { transform: 'rotateY(0deg)' } },
      { progress: 50, properties: { transform: 'rotateY(180deg)' } },
      { progress: 100, properties: { transform: 'rotateY(360deg)' } }
    ],
    generateKeyframes: () => `
      0% { transform: perspective(400px) rotateY(0deg); }
      50% { transform: perspective(400px) rotateY(180deg); }
      100% { transform: perspective(400px) rotateY(360deg); }
    `
  },
  {
    id: 'strokeDraw',
    name: 'Stroke Draw (Self-Draw)',
    category: 'SVG Strokes',
    description: 'Animates line drawing from start to finish via dashoffset.',
    defaultDuration: 2.5,
    defaultEasing: 'ease-in-out',
    defaultIterations: 'infinite',
    defaultDirection: 'alternate',
    keyframes: [
      { progress: 0, properties: { strokeDashoffset: '1000' } },
      { progress: 100, properties: { strokeDashoffset: '0' } }
    ],
    extraCSS: 'stroke-dasharray: 1000;',
    generateKeyframes: () => `
      0% { stroke-dashoffset: 1000; }
      100% { stroke-dashoffset: 0; }
    `
  },
  {
    id: 'strokeErase',
    name: 'Stroke Erase',
    category: 'SVG Strokes',
    description: 'Disassembles and erases outline stroke lines.',
    defaultDuration: 2.5,
    defaultEasing: 'ease-in-out',
    defaultIterations: 'infinite',
    defaultDirection: 'alternate',
    keyframes: [
      { progress: 0, properties: { strokeDashoffset: '0' } },
      { progress: 100, properties: { strokeDashoffset: '1000' } }
    ],
    extraCSS: 'stroke-dasharray: 1000;',
    generateKeyframes: () => `
      0% { stroke-dashoffset: 0; }
      100% { stroke-dashoffset: 1000; }
    `
  },
  {
    id: 'colorChange',
    name: 'Color Shift',
    category: 'Colors',
    description: 'Vibrant hue cycle transition across colors.',
    defaultDuration: 3,
    defaultEasing: 'linear',
    defaultIterations: 'infinite',
    defaultDirection: 'normal',
    keyframes: [
      { progress: 0, properties: { filter: 'hue-rotate(0deg)' } },
      { progress: 50, properties: { filter: 'hue-rotate(180deg)' } },
      { progress: 100, properties: { filter: 'hue-rotate(360deg)' } }
    ],
    generateKeyframes: (cfg) => {
      if (cfg?.startColor && cfg?.endColor) {
        return `
          0% { fill: ${cfg.startColor}; stroke: ${cfg.startColor}; }
          50% { fill: ${cfg.midColor || '#6366f1'}; stroke: ${cfg.midColor || '#6366f1'}; }
          100% { fill: ${cfg.endColor}; stroke: ${cfg.endColor}; }
        `;
      }
      return `
        0% { filter: hue-rotate(0deg); }
        50% { filter: hue-rotate(180deg); }
        100% { filter: hue-rotate(360deg); }
      `;
    }
  },
  {
    id: 'opacityChange',
    name: 'Opacity Change (Blink)',
    category: 'Colors',
    description: 'Breathing opacity modulation for highlights or indicators.',
    defaultDuration: 1.4,
    defaultEasing: 'ease-in-out',
    defaultIterations: 'infinite',
    defaultDirection: 'normal',
    keyframes: [
      { progress: 0, properties: { opacity: 0.25 } },
      { progress: 50, properties: { opacity: 1 } },
      { progress: 100, properties: { opacity: 0.25 } }
    ],
    generateKeyframes: () => `
      0%, 100% { opacity: 0.25; }
      50% { opacity: 1; }
    `
  },
  {
    id: 'scale',
    name: 'Scale Pop',
    category: 'Transforms',
    description: 'Scale jump with gentle overshoot.',
    defaultDuration: 1.5,
    defaultEasing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    defaultIterations: 'infinite',
    defaultDirection: 'alternate',
    keyframes: [
      { progress: 0, properties: { transform: 'scale(0.85)' } },
      { progress: 100, properties: { transform: 'scale(1.2)' } }
    ],
    generateKeyframes: () => `
      0% { transform: scale(0.85); }
      100% { transform: scale(1.2); }
    `
  }
];

export const PRESET_MAP = new Map(ANIMATION_PRESETS.map((p) => [p.id, p]));

/**
 * Creates default animation state for an element
 */
export function createDefaultAnimation(elementId, presetId = 'pulse', delay = 0) {
  const preset = PRESET_MAP.get(presetId) || ANIMATION_PRESETS[0];
  return {
    elementId,
    enabled: true,
    preset: preset.id,
    duration: preset.defaultDuration,
    delay: delay,
    easing: preset.defaultEasing,
    iterationCount: preset.defaultIterations,
    direction: preset.defaultDirection,
    fillMode: 'both',
    transformOrigin: 'center',
    strokeColor: '',
    strokeWidth: '',
    startColor: '',
    endColor: '',
    customKeyframes: null,
    keyframes: preset.keyframes ? JSON.parse(JSON.stringify(preset.keyframes)) : []
  };
}

/**
 * Generates full CSS stylesheet string for live preview and exports
 */
export function generateStylesCSS(animations, options = {}) {
  const {
    scopeSelector = '',
    speed = 1,
    isScrubbing = false,
    scrubTime = 0,
    includeReducedMotion = true
  } = options;

  let keyframesCSS = '';
  let rulesCSS = '';

  Object.values(animations).forEach((anim) => {
    if (!anim || !anim.enabled) return;

    const preset = PRESET_MAP.get(anim.preset);
    const animName = `anim-${anim.elementId}`;
    const effectiveDuration = Math.max(0.05, (anim.duration || 1) / (speed || 1));
    const effectiveDelay = (anim.delay || 0) / (speed || 1);

    // Generate @keyframes block
    let keyframeBody = '';
    if (anim.customKeyframes && anim.customKeyframes.trim()) {
      keyframeBody = anim.customKeyframes;
    } else if (preset && typeof preset.generateKeyframes === 'function') {
      keyframeBody = preset.generateKeyframes(anim);
    } else {
      keyframeBody = `
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      `;
    }

    keyframesCSS += `
@keyframes ${animName} {
${keyframeBody}
}
`;

    // Calculate scrub delay if scrubbing
    let playState = 'running';
    let delayCSS = `${effectiveDelay}s`;

    if (isScrubbing) {
      playState = 'paused';
      // When paused, negative animation-delay scrubs directly to that point in time
      const offset = (scrubTime - effectiveDelay) % effectiveDuration;
      delayCSS = `-${Math.max(0, offset)}s`;
    }

    const extraCSS = preset?.extraCSS ? `${preset.extraCSS}\n  ` : '';
    const strokeProps = [
      anim.strokeColor ? `stroke: ${anim.strokeColor};` : '',
      anim.strokeWidth ? `stroke-width: ${anim.strokeWidth}px;` : ''
    ].filter(Boolean).join('\n  ');

    const targetSelector = scopeSelector
      ? `${scopeSelector} #${anim.elementId}`
      : `#${anim.elementId}`;

    rulesCSS += `
${targetSelector} {
  animation-name: ${animName};
  animation-duration: ${effectiveDuration}s;
  animation-timing-function: ${anim.easing || 'ease-in-out'};
  animation-delay: ${delayCSS};
  animation-iteration-count: ${anim.iterationCount || 'infinite'};
  animation-direction: ${anim.direction || 'normal'};
  animation-fill-mode: ${anim.fillMode || 'both'};
  animation-play-state: ${playState};
  transform-box: fill-box;
  transform-origin: ${anim.transformOrigin || 'center'};
  ${extraCSS}${strokeProps ? `${strokeProps}\n  ` : ''}
}
`;
  });

  const reducedMotionCSS = includeReducedMotion
    ? `
@media (prefers-reduced-motion: reduce) {
  ${scopeSelector ? `${scopeSelector} *` : '*'} {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`
    : '';

  return `${keyframesCSS}\n${rulesCSS}\n${reducedMotionCSS}`;
}
