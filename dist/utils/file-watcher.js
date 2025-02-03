"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CssWatcher = void 0;
const fs_1 = __importDefault(require("fs"));
const chokidar_1 = __importDefault(require("chokidar"));
const css_extractor_1 = require("./css-extractor");
class CssWatcher {
    constructor(patterns = ['**/*.css'], ignore = ['**/node_modules/**', '**/dist/**', '**/out/**', '**/build/**']) {
        this.state = {
            fileClasses: new Map(),
            lastUpdate: 0,
        };
        this.watcher = null;
        this.patterns = patterns;
        this.ignorePatterns = ignore;
        this.setupWatcher();
    }
    setupWatcher() {
        // Initial scan and watch setup
        const watchPatterns = this.patterns.map((pattern) => {
            // Convert Windows-style paths if necessary
            return pattern.replace(/\\/g, '/');
        });
        // Set up chokidar with appropriate options
        this.watcher = chokidar_1.default.watch(watchPatterns, {
            persistent: true,
            ignoreInitial: false, // This ensures we get the initial scan
            ignored: [...this.ignorePatterns, /(^|[/\\])\../], // Ignore dotfiles and user-specified patterns
            cwd: '.', // Use current working directory as base
            followSymlinks: true,
            awaitWriteFinish: {
                stabilityThreshold: 200,
                pollInterval: 100,
            },
        });
        // Setup event handlers
        this.watcher
            .on('add', (filePath) => {
            this.updateClassesForFile(filePath);
        })
            .on('change', (filePath) => {
            this.updateClassesForFile(filePath);
        })
            .on('unlink', (filePath) => {
            this.state.fileClasses.delete(filePath);
            this.state.lastUpdate = Date.now();
        })
            .on('error', (error) => {
            console.error(`Watcher error: ${error}`);
        });
    }
    async updateClassesForFile(filePath) {
        try {
            const content = await fs_1.default.promises.readFile(filePath, 'utf8');
            const fileClasses = (0, css_extractor_1.extractClassesFromCss)(content);
            this.state.fileClasses.set(filePath, new Set(fileClasses));
            this.state.lastUpdate = Date.now();
        }
        catch (error) {
            console.error(`Error reading CSS file ${filePath}:`, error);
            this.state.fileClasses.delete(filePath);
        }
    }
    hasClass(className) {
        for (const classes of this.state.fileClasses.values()) {
            if (classes.has(className)) {
                return true;
            }
        }
        return false;
    }
    // Clean up method to close the watcher when done
    async close() {
        if (this.watcher) {
            await this.watcher.close();
            this.watcher = null;
        }
    }
}
exports.CssWatcher = CssWatcher;
