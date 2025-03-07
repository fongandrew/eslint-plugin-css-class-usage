"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CssWatcher = void 0;
const fs_1 = __importDefault(require("fs"));
const chokidar_1 = __importDefault(require("chokidar"));
const css_extractor_1 = require("./css-extractor");
const micromatch_1 = __importDefault(require("micromatch"));
class CssWatcher {
    constructor(patterns = ['**/*.css'], ignore = ['**/node_modules/**', '**/dist/**', '**/out/**', '**/build/**'], enableWatch = true) {
        this.state = {
            fileClasses: new Map(),
            lastUpdate: 0,
        };
        this.watcher = null;
        this.patterns = patterns;
        // Ignore hidden files by default
        this.ignorePatterns = ['**/.*', ...ignore];
        this.enableWatch = enableWatch;
        const cwd = process.cwd();
        this.maybeSetupWatcher(cwd);
        this.initialScan(cwd);
    }
    maybeSetupWatcher(cwd) {
        if (!this.enableWatch)
            return;
        this.watcher = chokidar_1.default.watch(cwd, {
            persistent: true,
            ignoreInitial: true, // We need to do our initial scan synchronously
            ignored: (path, stats) => {
                return (micromatch_1.default.isMatch(path, this.ignorePatterns) ||
                    !!((stats === null || stats === void 0 ? void 0 : stats.isFile()) && !micromatch_1.default.isMatch(path, this.patterns)));
            },
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
    updateClassesForFile(filePath) {
        try {
            const content = fs_1.default.readFileSync(filePath, 'utf8');
            const fileClasses = (0, css_extractor_1.extractClassesFromCss)(content);
            this.state.fileClasses.set(filePath, new Set(fileClasses));
            this.state.lastUpdate = Date.now();
        }
        catch (error) {
            console.error(`Error reading CSS file ${filePath}:`, error);
            this.state.fileClasses.delete(filePath);
        }
    }
    initialScan(cwd) {
        const dirs = [cwd];
        for (const dir of dirs) {
            const entries = fs_1.default.readdirSync(dir);
            for (const entry of entries) {
                const fullPath = `${dir}/${entry}`;
                if (micromatch_1.default.isMatch(fullPath, this.ignorePatterns)) {
                    continue;
                }
                const stats = fs_1.default.statSync(fullPath);
                if (stats.isDirectory()) {
                    dirs.push(fullPath);
                }
                else if (stats.isFile() && micromatch_1.default.isMatch(fullPath, this.patterns)) {
                    this.updateClassesForFile(fullPath);
                }
            }
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
