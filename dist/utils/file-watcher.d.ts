export declare class CssWatcher {
    private state;
    private watcher;
    private patterns;
    private ignorePatterns;
    constructor(patterns?: string[], ignore?: string[]);
    private setupWatcher;
    private updateClassesForFile;
    private initialScan;
    hasClass(className: string): boolean;
    close(): Promise<void>;
}
