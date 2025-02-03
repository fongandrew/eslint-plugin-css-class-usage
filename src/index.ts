import noUnknownClass from './rules/no-unknown-class';

/**
 * @fileoverview ESLint plugin to validate CSS class usage in JavaScript/TypeScript files
 * @author ESLint Plugin CSS Class Usage Contributors
 */

export = {
	/**
	 * List of supported rules
	 */
	rules: {
		/**
		 * Rule to validate that CSS classes used in code exist in stylesheets
		 * @see ./rules/no-unknown-class.ts
		 */
		'no-unknown-class': noUnknownClass,
	},
	/**
	 * Recommended configuration
	 */
	configs: {
		recommended: {
			plugins: ['css-class-usage'],
			rules: {
				'css-class-usage/no-unknown-class': [
					'error',
					{
						cssFiles: ['src/**/*.css', 'src/**/*.scss'],
						classAttributes: ['className', 'class', 'classList'],
						classFunctions: ['clsx', 'classNames', 'cx'],
					},
				],
			},
		},
	},
};
