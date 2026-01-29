"use strict";

const sharp = require('sharp');
const GifEncoder = require('gif-encoder');
const fs = require('fs');
const path = require('path');
const { getPool } = require('../modules/pool');
const imagePool = getPool('image');

// Color palette for wheel segments
const WHEEL_COLORS = [
    '#ef4444', // Red 500
    '#f97316', // Orange 500
    '#f59e0b', // Amber 500
    '#84cc16', // Lime 500
    '#10b981', // Emerald 500
    '#06b6d4', // Cyan 500
    '#3b82f6', // Blue 500
    '#8b5cf6', // Violet 500
    '#d946ef', // Fuchsia 500
    '#f43f5e', // Rose 500
];

// Default settings - optimized for speed
const DEFAULT_SETTINGS = {
    duration: 1.5, // seconds - reduced from 3 for faster generation
    fps: 10, // reduced from 15 for faster generation
    size: 500, // reduced from 600 for faster processing
    pointerColor: '#ffffff',
    borderColor: '#1e293b',
    backgroundColor: '#0f172a'
};

/**
 * Easing function: EaseOutQuart
 * @param {number} t - Progress from 0 to 1
 * @returns {number} Eased progress
 */
function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
}

/** Max effective length per option; if exceeded, caller should use text version */
const MAX_OPTION_EFFECTIVE_LENGTH = 36;

/**
 * Effective text length: full-width (CJK etc.) = 1, half-width (ASCII) = 0.5
 */
function effectiveTextLength(str) {
    if (!str || typeof str !== 'string') return 0;
    let len = 0;
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        len += (code > 0xff) ? 1 : 0.5;
    }
    return len;
}

/**
 * Get max characters per line based on option count and wheel geometry
 * Returns { maxEffective: number, maxRaw: number }.
 * - maxEffective: max effective length per line (for wrap; full-width=1, half-width=0.5)
 * - maxRaw: max raw character count per line (for circle; half-width digits often render full-width in SVG)
 */
function getMaxCharsPerLine(optionCount, radius, fontSize = 28) {
    if (optionCount < 2) return { maxEffective: 10, maxRaw: 10 };
    const sliceAngle = (2 * Math.PI) / optionCount;
    const textRadius = radius * 0.55;
    const chordLength = 2 * textRadius * Math.sin(sliceAngle / 2);
    const charsByChord = Math.floor(chordLength / fontSize);
    const maxLineWidthPx = 2 * (radius - textRadius);
    const charsByCircle = Math.floor(maxLineWidthPx / fontSize);
    const effective = Math.max(2, Math.min(Math.min(charsByChord, charsByCircle), 12));
    const raw = Math.max(2, charsByCircle);
    return { maxEffective: effective, maxRaw: raw };
}

/**
 * Wrap text into lines by effective length and optionally by raw char count; maxLines caps total lines
 * @param {number} [maxRawCharsPerLine] - if set, no line may exceed this many characters (keeps half-width digits inside circle)
 * Returns { lines: string[], truncated: boolean }
 */
function wrapText(text, maxCharsPerLine, maxLines = 3, maxRawCharsPerLine = null) {
    const safe = String(text).trim();
    if (!safe) return { lines: [''], truncated: false };
    const lines = [];
    let currentLine = '';
    let currentEffLen = 0;
    let i = 0;
    for (; i < safe.length && lines.length < maxLines; i++) {
        const c = safe[i];
        const w = (safe.charCodeAt(i) > 0xff) ? 1 : 0.5;
        const wouldExceedEffective = currentEffLen + w > maxCharsPerLine && currentLine.length > 0;
        const wouldExceedRaw = maxRawCharsPerLine != null && currentLine.length >= maxRawCharsPerLine;
        if ((wouldExceedEffective || wouldExceedRaw) && currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = c;
            currentEffLen = w;
        } else {
            currentLine += c;
            currentEffLen += w;
        }
    }
    if (currentLine.length > 0) lines.push(currentLine);
    const truncated = i < safe.length;
    if (truncated && lines.length > 0) {
        lines[lines.length - 1] = lines[lines.length - 1] + '…';
    }
    return { lines: lines.slice(0, maxLines), truncated };
}

/**
 * Escape XML/SVG special characters
 */
function escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

/**
 * Generate SVG for wheel frame
 */
function generateWheelSVG(options, rotation, settings) {
    const { size, borderColor, pointerColor, backgroundColor } = settings;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size / 2) - 20;
    const sliceAngle = (2 * Math.PI) / options.length;

    // Build SVG paths for segments
    let segmentsSVG = '';
    let textSVG = '';

    options.forEach((option, index) => {
        const startAngle = index * sliceAngle;
        const endAngle = startAngle + sliceAngle;
        const color = option.color || WHEEL_COLORS[index % WHEEL_COLORS.length];
        
        // Calculate arc points
        const startX = centerX + radius * Math.cos(startAngle - Math.PI / 2);
        const startY = centerY + radius * Math.sin(startAngle - Math.PI / 2);
        const endX = centerX + radius * Math.cos(endAngle - Math.PI / 2);
        const endY = centerY + radius * Math.sin(endAngle - Math.PI / 2);
        const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

        // Create path for segment
        segmentsSVG += `<path d="M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z" 
            fill="${color}" stroke="${borderColor}" stroke-width="2"/>`;

        // Add text - position and size by option count
        const textAngle = startAngle + sliceAngle / 2;
        const textRadius = radius * 0.55;
        const textX = centerX + textRadius * Math.cos(textAngle - Math.PI / 2);
        const textY = centerY + textRadius * Math.sin(textAngle - Math.PI / 2);

        const optionCount = options.length;
        const fontSize = optionCount <= 4 ? 28 : optionCount <= 8 ? 24 : 20;
        const { maxEffective, maxRaw } = getMaxCharsPerLine(optionCount, radius, fontSize);
        const maxLines = optionCount <= 4 ? 3 : optionCount <= 8 ? 2 : 2;
        const lineHeight = 1.15;
        // For 2–3 options, also limit raw char count so half-width digits don't overflow (SVG often renders them full-width)
        const maxRawCharsPerLine = optionCount <= 3 ? maxRaw : null;

        const rawText = option.text || '';
        const { lines: wrappedLines } = wrapText(rawText, maxEffective, maxLines, maxRawCharsPerLine);
        const displayLines = wrappedLines.map(line => escapeXml(line));

        const textRotation = (textAngle * 180 / Math.PI) + 90 + 180;
        const tspanContent = displayLines.map((line, lineIndex) => {
            const dy = lineIndex === 0
                ? -((displayLines.length - 1) / 2) * lineHeight
                : lineHeight;
            return `<tspan x="${textX}" dy="${dy}em">${line}</tspan>`;
        }).join('');
        textSVG += `<text x="${textX}" y="${textY}" 
            text-anchor="middle" dominant-baseline="middle" 
            fill="#ffffff" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold"
            transform="rotate(${textRotation} ${textX} ${textY})">${tspanContent}</text>`;
    });

    // Pointer SVG (triangle at right side) - larger arrow
    const pointerX = size - 10;
    const pointerY = centerY;
    const pointerSize = 30; // Increased from 20 to 30
    const pointerWidth = 25; // Increased from 20 to 25
    const pointerSVG = `<polygon points="${pointerX},${pointerY} ${pointerX - pointerWidth},${pointerY - pointerSize} ${pointerX - pointerWidth},${pointerY + pointerSize}" 
        fill="${pointerColor}" stroke="#ffffff" stroke-width="3"/>`;

    // Center hub
    const centerHubSVG = `<circle cx="${centerX}" cy="${centerY}" r="20" fill="#ffffff" stroke="${borderColor}" stroke-width="4"/>`;

    // Build complete SVG with rotation
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
    <g transform="translate(${centerX},${centerY}) rotate(${rotation * 180 / Math.PI}) translate(${-centerX},${-centerY})">
        ${segmentsSVG}
        ${textSVG}
        ${centerHubSVG}
    </g>
    ${pointerSVG}
</svg>`;

    return svg;
}

/**
 * Generate animated GIF of spinning wheel
 * @param {Array} options - Array of option strings or objects with text property
 * @param {Object} settings - Optional settings to override defaults
 * @param {number} selectedIndex - Index of the selected option (for landing position)
 * @returns {Promise<string>} Path to generated GIF file
 */
async function generateWheelGif(options, settings = {}, selectedIndex = null) {
    // Merge settings with defaults
    const finalSettings = { ...DEFAULT_SETTINGS, ...settings };
    
    // Normalize options to objects with text property
    const normalizedOptions = options.map((opt, index) => {
        if (typeof opt === 'string') {
            return {
                text: opt,
                color: WHEEL_COLORS[index % WHEEL_COLORS.length]
            };
        }
        return {
            text: opt.text || String(opt),
            color: opt.color || WHEEL_COLORS[index % WHEEL_COLORS.length]
        };
    });

    if (normalizedOptions.length === 0) {
        throw new Error('Options array cannot be empty');
    }

    // Calculate target rotation
    const sliceAngle = (2 * Math.PI) / normalizedOptions.length;
    let targetIndex = selectedIndex;
    if (targetIndex === null || targetIndex < 0 || targetIndex >= normalizedOptions.length) {
        targetIndex = Math.floor(Math.random() * normalizedOptions.length);
    }
    
    // Calculate rotation to land on selected segment
    // Ensure the selected segment is upright (text facing up) when it stops at the pointer
    // Pointer is at 0 radians (right side, 3 o'clock)
    // We want the selected segment's center to align with the pointer
    // But we also want the text to be upright (not rotated)
    // So we need to rotate so that the segment center is at the pointer position
    // Segment centers are measured from top (12 o'clock = -π/2), going counter-clockwise
    const segmentCenterAngle = targetIndex * sliceAngle + sliceAngle / 2;
    // Convert segment center angle from top reference to right reference (canvas coordinates)
    // Top is -π/2, so segment center from right is: segmentCenterAngle - π/2
    // To align with pointer (0 radians), rotate by: -(segmentCenterAngle - π/2) = π/2 - segmentCenterAngle
    // Add small random offset for natural feel
    const randomOffset = (Math.random() - 0.5) * sliceAngle * 0.2; // Reduced random offset for better alignment
    const targetRotation = Math.PI / 2 - segmentCenterAngle + randomOffset;
    const minRotations = 3 * Math.PI * 2; // Reduced from 8 to 3 for faster animation
    const totalRotation = minRotations + targetRotation;

    // Create temp directory
    const tempDir = path.join(__dirname, '../tmp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    const filename = `wheel_${Date.now()}_${Math.random().toString(36).substring(7)}.gif`;
    const filepath = path.join(tempDir, filename);

    // Generate frames
    const durationMs = finalSettings.duration * 1000;
    const fps = finalSettings.fps;
    const totalFrames = Math.ceil((durationMs / 1000) * fps);
    const frameDelay = Math.round(1000 / fps); // Delay in centiseconds (100th of a second)

    // Create GIF encoder
    const encoder = new GifEncoder(finalSettings.size, finalSettings.size);

    // Set up file stream
    const fileStream = fs.createWriteStream(filepath);
    encoder.pipe(fileStream);

    // Configure encoder
    encoder.setDelay(frameDelay); // Delay in milliseconds
    encoder.writeHeader();

    // Generate and add frames - optimized for speed
    // Use batch processing and yield to event loop periodically
    const bgColor = hexToRgb(finalSettings.backgroundColor);
    
    for (let i = 0; i <= totalFrames; i++) {
        // Yield to event loop every 5 frames to prevent blocking
        if (i > 0 && i % 5 === 0) {
            await new Promise(resolve => setImmediate(resolve));
        }
        
        const currentTime = i * (1000 / fps);
        let progress = Math.min(currentTime / durationMs, 1);
        const easedProgress = easeOutQuart(progress);
        const currentRot = totalRotation * easedProgress;

        // Generate SVG
        const svg = generateWheelSVG(normalizedOptions, currentRot, finalSettings);
        
        // Convert SVG to PNG buffer using sharp (in pool to avoid blocking)
        const pngBuffer = await imagePool.run(() => 
            sharp(Buffer.from(svg))
                .png()
                .toBuffer()
        );
        
        // Get raw pixel data (RGBA) - optimized processing
        const { data } = await imagePool.run(() =>
            sharp(pngBuffer)
                .ensureAlpha()
                .raw()
                .toBuffer({ resolveWithObject: true })
        );

        // Convert to pixel array format - optimized processing
        // Blend alpha channel with background for better quality
        const pixels = [];
        const dataLength = data.length;
        for (let j = 0; j < dataLength; j += 4) {
            const r = data[j];
            const g = data[j + 1];
            const b = data[j + 2];
            const a = data[j + 3] / 255;
            
            // Blend with background color (gif doesn't support alpha)
            pixels.push(Math.round(r * a + bgColor.r * (1 - a)));
            pixels.push(Math.round(g * a + bgColor.g * (1 - a)));
            pixels.push(Math.round(b * a + bgColor.b * (1 - a)));
            pixels.push(255); // Full opacity for GIF
        }

        // Add frame to encoder
        encoder.addFrame(pixels);
    }

    // Finish encoding
    encoder.finish();

    // Wait for stream to finish
    return new Promise((resolve, reject) => {
        fileStream.on('finish', () => {
            resolve(filepath);
        });
        fileStream.on('error', (error) => {
            reject(error);
        });
    });
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 15, g: 23, b: 42 }; // Default to backgroundColor
}

module.exports = {
    generateWheelGif,
    WHEEL_COLORS,
    DEFAULT_SETTINGS,
    MAX_OPTION_EFFECTIVE_LENGTH,
    effectiveTextLength
};
