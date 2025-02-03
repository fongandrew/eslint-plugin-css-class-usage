import fs from 'fs';
import chokidar, { type FSWatcher } from 'chokidar';
import { extractClassesFromCss } from './css-extractor';

export class CssWatcher {
	private state = {
		fileClasses: new Map<string, Set<string>>(),
		lastUpdate: 0,
	};

	private watcher: FSWatcher | null = null;
	private patterns: string[];

	constructor(patterns: string[] = ['**/*.css']) {
		this.patterns = patterns;
		this.setupWatcher();
	}

	private setupWatcher() {
		// Initial scan and watch setup
		const watchPatterns = this.patterns.map((pattern) => {
			// Convert Windows-style paths if necessary
			return pattern.replace(/\\/g, '/');
		});

		// Set up chokidar with appropriate options
		this.watcher = chokidar.watch(watchPatterns, {
			persistent: true,
			ignoreInitial: false, // This ensures we get the initial scan
			ignored: /(^|[/\\])\../, // Ignore dotfiles
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

	private async updateClassesForFile(filePath: string) {
		try {
			const content = await fs.promises.readFile(filePath, 'utf8');
			const fileClasses = extractClassesFromCss(content);
			this.state.fileClasses.set(filePath, new Set(fileClasses));
			this.state.lastUpdate = Date.now();
		} catch (error) {
			console.error(`Error reading CSS file ${filePath}:`, error);
			this.state.fileClasses.delete(filePath);
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
