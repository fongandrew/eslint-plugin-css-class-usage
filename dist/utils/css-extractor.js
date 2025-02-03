"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractClassesFromCss = extractClassesFromCss;
function extractClassesFromCss(content) {
    const classes = new Set();
    // Regex for CSS classes
    const classRegex = /\.([a-zA-Z][a-zA-Z0-9_-]*)/g;
    let match;
    while ((match = classRegex.exec(content)) !== null) {
        if (match[1]) {
            // Regular CSS class
            classes.add(match[1]);
        }
    }
    return classes;
}
