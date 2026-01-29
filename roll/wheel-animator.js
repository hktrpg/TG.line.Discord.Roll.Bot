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

// Default settings
const DEFAULT_SETTINGS = {
    duration: 3, // seconds
    fps: 15,
    size: 600,
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

        // Add text - positioned closer to center
        const textAngle = startAngle + sliceAngle / 2;
        const textRadius = radius * 0.55; // Move text closer to center (was radius - 20)
        const textX = centerX + textRadius * Math.cos(textAngle - Math.PI / 2);
        const textY = centerY + textRadius * Math.sin(textAngle - Math.PI / 2);
        
        let displayText = escapeXml(option.text || '');
        if (displayText.length > 20) {
            displayText = displayText.substring(0, 17) + '...';
        }

        // Larger font size and better text positioning
        // Text rotation: rotate text in opposite direction (add 180 degrees)
        // This makes text face the opposite direction from the arc
        const textRotation = (textAngle * 180 / Math.PI) + 90 + 180;
        textSVG += `<text x="${textX}" y="${textY}" 
            text-anchor="middle" dominant-baseline="middle" 
            fill="#ffffff" font-family="Arial, sans-serif" font-size="28" font-weight="bold"
            transform="rotate(${textRotation} ${textX} ${textY})">${displayText}</text>`;
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
    const minRotations = 8 * Math.PI * 2;
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

    // Generate and add frames
    for (let i = 0; i <= totalFrames; i++) {
        const currentTime = i * (1000 / fps);
        let progress = Math.min(currentTime / durationMs, 1);
        const easedProgress = easeOutQuart(progress);
        const currentRot = totalRotation * easedProgress;

        // Generate SVG
        const svg = generateWheelSVG(normalizedOptions, currentRot, finalSettings);
        
        // Convert SVG to PNG buffer using sharp
        const pngBuffer = await imagePool.run(() => 
            sharp(Buffer.from(svg))
                .png()
                .toBuffer()
        );
        
        // Get raw pixel data (RGBA)
        const { data } = await imagePool.run(() =>
            sharp(pngBuffer)
                .ensureAlpha()
                .raw()
                .toBuffer({ resolveWithObject: true })
        );

        // Convert to pixel array format expected by gif-encoder
        // gif-encoder expects pixels as a flat array [r, g, b, a, r, g, b, a, ...]
        // Blend alpha channel with background for better quality
        const bgColor = hexToRgb(finalSettings.backgroundColor);
        const pixels = [];
        for (let j = 0; j < data.length; j += 4) {
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
    DEFAULT_SETTINGS
};
