import { CssWatcher } from '../../src/utils/file-watcher';
import chokidar from 'chokidar';
import fs from 'fs';

// Mock chokidar and fs modules
jest.mock('chokidar');
jest.mock('fs', () => ({
	promises: {
		readFile: jest.fn(),
	},
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

	it('initializes with default patterns', () => {
		watcher = new CssWatcher();
		expect(chokidar.watch).toHaveBeenCalledWith(['**/*.css'], expect.any(Object));
	});

	it('initializes with custom patterns', () => {
		const patterns = ['src/**/*.css', 'styles/**/*.css'];
		watcher = new CssWatcher(patterns);
		expect(chokidar.watch).toHaveBeenCalledWith(patterns, expect.any(Object));
	});

	it('handles file add/change events', async () => {
		const mockContent = '.test-class { color: red; }';
		(fs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);

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
		(fs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);

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
