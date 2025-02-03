export declare class CssWatcher {
    private state;
    private watcher;
    private patterns;
    private ignorePatterns;
    private enableWatch;
    constructor(patterns?: string[], ignore?: string[], enableWatch?: boolean);
    private maybeSetupWatcher;
    private updateClassesForFile;
    private initialScan;
    hasClass(className: string): boolean;
    close(): Promise<void>;
}
