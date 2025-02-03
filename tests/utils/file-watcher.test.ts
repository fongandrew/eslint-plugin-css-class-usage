import { CssWatcher } from '../../src/utils/file-watcher';
import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';

// Mock chokidar and fs modules
jest.mock('chokidar');
jest.mock('fs', () => ({
	readFileSync: jest.fn(),
	readdirSync: jest.fn(),
	statSync: jest.fn(),
}));

describe('CssWatcher', () => {
	let watcher: CssWatcher;
	let mockChokidarWatcher: {
		on: jest.Mock;
		close: jest.Mock;
	};

	beforeEach(() => {
		// Clear all mocks before each test
		jest.clearAllMocks();

		// Mock fs.readdirSync to return empty array by default
		(fs.readdirSync as jest.Mock).mockReturnValue([]);
		(fs.statSync as jest.Mock).mockImplementation((fn: string) => ({
			isDirectory: () => path.extname(fn) === '',
			isFile: () => path.extname(fn) !== '',
		}));

		// Setup mock chokidar watcher
		mockChokidarWatcher = {
			on: jest.fn().mockReturnThis(),
			close: jest.fn().mockResolvedValue(undefined),
		};
		(chokidar.watch as jest.Mock).mockReturnValue(mockChokidarWatcher);
	});

	afterEach(async () => {
		// Clean up watcher after each test
		if (watcher) {
			await watcher.close();
		}
	});

	it('calls watch on current directory', () => {
		watcher = new CssWatcher();
		expect(chokidar.watch).toHaveBeenCalledWith(process.cwd(), expect.any(Object));
	});

	it('performs initial scan, respecting glob patterns', () => {
		(fs.readdirSync as jest.Mock).mockImplementation((path: string) => {
			if (path === process.cwd()) {
				return ['src', 'node_modules'];
			} else if (path.endsWith('/src')) {
				return ['components', 'styles', 'index.css', 'index.js'];
			} else if (path.endsWith('/src/components')) {
				return ['button.css', 'button.tsx'];
			} else if (path.endsWith('/src/styles')) {
				return ['utilities.css'];
			}
			throw new Error(`Unexpected directory read: ${path}`);
		});
		(fs.readFileSync as jest.Mock).mockImplementation((path: string) => {
			if (path.endsWith('src/index.css')) {
				return '.main { color: red; }';
			} else if (path.endsWith('src/components/button.css')) {
				return '.btn { color: blue; }';
			} else if (path.endsWith('styles/utilities.css')) {
				return '.hidden { display: none; }';
			}
			throw new Error(`Unexpected file read: ${path}`);
		});

		watcher = new CssWatcher();
		expect(watcher.hasClass('main')).toBe(true);
		expect(watcher.hasClass('btn')).toBe(true);
		expect(watcher.hasClass('hidden')).toBe(true);
	});

	it('handles file add/change events', async () => {
		const mockContent = '.test-class { color: red; }';
		(fs.readFileSync as jest.Mock).mockReturnValue(mockContent);

		watcher = new CssWatcher();

		// Simulate file add event
		const addHandler = mockChokidarWatcher.on.mock.calls.find((call) => call[0] === 'add')[1];
		await addHandler('test.css');

		// Check if hasClass returns true for existing class
		expect(watcher.hasClass('test-class')).toBe(true);
		// Check if hasClass returns false for non-existing class
		expect(watcher.hasClass('non-existent')).toBe(false);
	});

	it('handles file unlink events', async () => {
		const mockContent = '.test-class { color: red; }';
		(fs.readFileSync as jest.Mock).mockReturnValue(mockContent);

		watcher = new CssWatcher();

		// First add a file
		const addHandler = mockChokidarWatcher.on.mock.calls.find((call) => call[0] === 'add')[1];
		await addHandler('test.css');

		// Then simulate file deletion
		const unlinkHandler = mockChokidarWatcher.on.mock.calls.find(
			(call) => call[0] === 'unlink',
		)[1];
		unlinkHandler('test.css');

		// Class should no longer be found
		expect(watcher.hasClass('test-class')).toBe(false);
	});

	it('closes watcher properly', async () => {
		watcher = new CssWatcher();
		await watcher.close();
		expect(mockChokidarWatcher.close).toHaveBeenCalled();
	});
});
