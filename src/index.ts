import noUnknownClass from './rules/no-unknown-class';

export = {
	rules: {
		'no-unknown-class': noUnknownClass,
	},
	configs: {
		recommended: {
			plugins: ['css-class-usage'],
			rules: {
				'css-class-usage/no-unknown-class': 'error',
			},
		},
	},
};
