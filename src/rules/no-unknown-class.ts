import { type RuleModule, type RuleContext } from '@typescript-eslint/utils/ts-eslint';
import { type TSESTree } from '@typescript-eslint/types';
import { CssWatcher } from '../utils/file-watcher';

export interface PluginOptions {
	/** Attributes to check in JSX elements (e.g., 'className', 'class') */
	classAttributes?: string[];
	/** Function names that handle class composition (e.g., 'clsx', 'classNames') */
	classFunctions?: string[];
	/** File patterns to watch for CSS classes */
	cssFiles?: string[];
	/** Patterns to ignore when searching for CSS files */
	ignore?: string[];
	/**
	 * Enable watcher? Defaults to "auto", which only runs if the script namae has "watch"
	 * or "serve" in it (VSCode's extension is named eslintServer).
	 */
	watch?: boolean | 'auto';
}

let cssWatcher: CssWatcher | null = null;

const DEFAULT_OPTIONS: PluginOptions = {
	classAttributes: ['className', 'class', 'classList'],
	classFunctions: ['clsx', 'classNames', 'cx'],
	cssFiles: ['**/*.css'],
	ignore: ['**/node_modules/**', '**/dist/**', '**/out/**', '**/build/**'],
	watch: 'auto',
};

const rule: RuleModule<'unknownClass', [PluginOptions]> = {
	// Not sure why we need to do this since it doesn't show up on context.options anyways,
	// but TypeScript complains if it's missing in tests
	defaultOptions: [DEFAULT_OPTIONS],
	meta: {
		type: 'problem',
		docs: {
			description: 'Ensure that CSS classes used in JS/TS files exist',
		},
		messages: {
			unknownClass: "Unknown CSS class '{{className}}'",
		},
		schema: [
			{
				type: 'object',
				properties: {
					classAttributes: {
						type: 'array',
						items: { type: 'string' },
					},
					classFunctions: {
						type: 'array',
						items: { type: 'string' },
					},
					cssFiles: {
						type: 'array',
						items: { type: 'string' },
					},
					ignore: {
						type: 'array',
						items: { type: 'string' },
					},
				},
				additionalProperties: false,
			},
		],
	},

	create(context: Readonly<RuleContext<'unknownClass', [PluginOptions]>>) {
		const options: PluginOptions = {
			...DEFAULT_OPTIONS,
			...context.options[0],
		};

		// Initialize watcher if not already done
		if (!cssWatcher) {
			const shouldWatch = (() => {
				if (options.watch === 'auto') {
					const script = process.argv[1]?.toLowerCase() ?? '';
					return script.includes('watch') || script.includes('serve');
				}
				return options.watch;
			})();
			cssWatcher = new CssWatcher(options.cssFiles, options.ignore, shouldWatch);
		}

		/** Helper to check if a class exists in our CSS files */
		const validate = (className: string, node: TSESTree.Node) => {
			// Ignore Tailwind classes with arbitrary values
			if (className.includes('[')) {
				return;
			}
			// Remove any Tailwind modifiers
			const baseClass = className.split(':').pop()!;
			if (!cssWatcher?.hasClass(baseClass)) {
				context.report({
					node,
					messageId: 'unknownClass',
					data: { className: baseClass },
				});
			}
		};

		/** Helper to validate string literal class names */
		const validateStringLiteral = (value: string, node: TSESTree.Node) => {
			const classNames = value.trim().split(/\s+/);
			classNames.forEach((className: string) => {
				validate(className, node);
			});
		};

		/** Helper to validate class names in object expressions */
		const validateObjectExpression = (objExpr: TSESTree.ObjectExpression) => {
			objExpr.properties.forEach((prop: TSESTree.Property | TSESTree.SpreadElement) => {
				if (prop.type === 'Property') {
					if (prop.key.type === 'Literal' && typeof prop.key.value === 'string') {
						validate(prop.key.value, prop);
					} else if (prop.key.type === 'Identifier') {
						validate(prop.key.name, prop);
					}
				}
				// We ignore SpreadElement as it can't contain class names directly
			});
		};

		/** Helper to validate expressions that might contain class names */
		const validateExpression = (expr: TSESTree.Expression) => {
			switch (expr.type) {
				case 'Literal':
					if (typeof expr.value === 'string') {
						validateStringLiteral(expr.value, expr);
					}
					break;
				case 'ObjectExpression':
					validateObjectExpression(expr);
					break;
				case 'ConditionalExpression':
					// Handle ternary expressions: condition ? 'class1' : 'class2'
					validateExpression(expr.consequent);
					validateExpression(expr.alternate);
					break;
				case 'LogicalExpression':
					// Handle logical expressions: condition && 'class1'
					validateExpression(expr.right);
					break;
			}
		};

		return {
			// Check JSX className attributes
			JSXAttribute(node: TSESTree.JSXAttribute) {
				if (
					node.name.type === 'JSXIdentifier' &&
					options.classAttributes?.includes(node.name.name)
				) {
					if (node.value?.type === 'Literal' && typeof node.value.value === 'string') {
						validateStringLiteral(node.value.value, node);
					} else if (node.value?.type === 'JSXExpressionContainer') {
						const expr = node.value.expression;
						if (expr.type === 'ObjectExpression') {
							validateObjectExpression(expr);
						}
					}
				}
			},

			// Check class utility function calls
			CallExpression(node: TSESTree.CallExpression) {
				if (
					node.callee.type === 'Identifier' &&
					options.classFunctions?.includes(node.callee.name)
				) {
					node.arguments.forEach((arg: TSESTree.Node) => {
						validateExpression(arg as TSESTree.Expression);
					});
				}
			},
		};
	},
};

export default rule;
