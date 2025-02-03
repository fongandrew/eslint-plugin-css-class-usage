import { TSESLint } from '@typescript-eslint/utils';
import rule from '../../src/rules/no-unknown-class';
import '../../src/utils/file-watcher';

// Mock CssWatcher
jest.mock('../../src/utils/file-watcher', () => ({
	CssWatcher: jest.fn().mockImplementation(() => ({
		hasClass: jest.fn((className: string) => {
			const validClasses = ['btn', 'primary', 'container', 'flex', 'p-4'];
			return validClasses.includes(className);
		}),
	})),
}));

const ruleTester = new TSESLint.RuleTester({
	parser: require.resolve('@typescript-eslint/parser'),
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
		ecmaFeatures: {
			jsx: true,
		},
	},
});

ruleTester.run('no-unknown-class', rule, {
	valid: [
		// Test JSX className with valid classes
		{
			code: '<div className="btn primary"></div>',
			options: [{ classAttributes: ['className'] }],
		},
		// Test class utility function with valid classes
		{
			code: 'clsx("container flex", "p-4")',
			options: [{ classFunctions: ['clsx'] }],
		},
		// Test object expression with valid classes
		{
			code: 'clsx({ flex: true, "p-4": condition })',
			options: [{ classFunctions: ['clsx'] }],
		},
		// Test Tailwind arbitrary value (should be ignored)
		{
			code: '<div className="h-[64px]"></div>',
			options: [{ classAttributes: ['className'] }],
		},
		// Test Tailwind modifier
		{
			code: '<div className="hover:btn"></div>',
			options: [{ classAttributes: ['className'] }],
		},
		// Test JSX attribute that isn't a className
		{
			code: '<div id="id123"></div>',
			options: [{ classAttributes: ['className'] }],
		},
		// Test function that isn't a class utility
		{
			code: 'cls("btn")',
			options: [{ classFunctions: ['clsx'] }],
		},
	],
	invalid: [
		// Test JSX className with invalid class
		{
			code: '<div className="invalid-class"></div>',
			options: [{ classAttributes: ['className'] }],
			errors: [{ messageId: 'unknownClass', data: { className: 'invalid-class' } }],
		},
		// Test class utility function with invalid class
		{
			code: 'clsx("unknown-class")',
			options: [{ classFunctions: ['clsx'] }],
			errors: [{ messageId: 'unknownClass', data: { className: 'unknown-class' } }],
		},
		// Test object expression with invalid class
		{
			code: 'clsx({ "invalid-class": true })',
			options: [{ classFunctions: ['clsx'] }],
			errors: [{ messageId: 'unknownClass', data: { className: 'invalid-class' } }],
		},
		// Test Tailwind modifier with invalid base class
		{
			code: '<div className="hover:invalid-class"></div>',
			options: [{ classAttributes: ['className'] }],
			errors: [{ messageId: 'unknownClass', data: { className: 'invalid-class' } }],
		},
		// Test multiple classes with one invalid in attributte
		{
			code: '<div className="btn invalid-class primary"></div>',
			options: [{ classAttributes: ['className'] }],
			errors: [{ messageId: 'unknownClass', data: { className: 'invalid-class' } }],
		},
		// Test multiple classes with one invalid in function
		{
			code: 'clsx("btn", "invalid-class", "primary")',
			options: [{ classFunctions: ['clsx'] }],
			errors: [{ messageId: 'unknownClass', data: { className: 'invalid-class' } }],
		},
	],
});
