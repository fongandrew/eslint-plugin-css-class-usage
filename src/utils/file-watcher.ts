import fs from 'fs';
import chokidar, { type FSWatcher } from 'chokidar';
import { extractClassesFromCss } from './css-extractor';
import micromatch from 'micromatch';

export class CssWatcher {
	private state = {
		fileClasses: new Map<string, Set<string>>(),
		lastUpdate: 0,
	};

	private watcher: FSWatcher | null = null;
	private patterns: string[];
	private ignorePatterns: string[];
	private enableWatch: boolean;

	constructor(
		patterns: string[] = ['**/*.css'],
		ignore: string[] = ['**/node_modules/**', '**/dist/**', '**/out/**', '**/build/**'],
		enableWatch = true,
	) {
		this.patterns = patterns;
		// Ignore hidden files by default
		this.ignorePatterns = ['**/.*', ...ignore];
		this.enableWatch = enableWatch;

		const cwd = process.cwd();
		this.maybeSetupWatcher(cwd);
		this.initialScan(cwd);
	}

	private maybeSetupWatcher(cwd: string) {
		if (!this.enableWatch) return;
		this.watcher = chokidar.watch(cwd, {
			persistent: true,
			ignoreInitial: true, // We need to do our initial scan synchronously
			ignored: (path, stats) => {
				return (
					micromatch.isMatch(path, this.ignorePatterns) ||
					!!(stats?.isFile() && !micromatch.isMatch(path, this.patterns))
				);
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

	private updateClassesForFile(filePath: string) {
		try {
			const content = fs.readFileSync(filePath, 'utf8');
			const fileClasses = extractClassesFromCss(content);
			this.state.fileClasses.set(filePath, new Set(fileClasses));
			this.state.lastUpdate = Date.now();
		} catch (error) {
			console.error(`Error reading CSS file ${filePath}:`, error);
			this.state.fileClasses.delete(filePath);
		}
	}

	private initialScan(cwd: string) {
		const dirs = [cwd];
		for (const dir of dirs) {
			const entries = fs.readdirSync(dir);
			for (const entry of entries) {
				const fullPath = `${dir}/${entry}`;
				if (micromatch.isMatch(fullPath, this.ignorePatterns)) {
					continue;
				}

				const stats = fs.statSync(fullPath);
				if (stats.isDirectory()) {
					dirs.push(fullPath);
				} else if (stats.isFile() && micromatch.isMatch(fullPath, this.patterns)) {
					this.updateClassesForFile(fullPath);
				}
			}
		}
	}

	hasClass(className: string): boolean {
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
