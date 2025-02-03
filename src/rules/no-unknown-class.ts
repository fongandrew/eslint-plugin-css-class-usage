import { type RuleModule, type RuleContext } from '@typescript-eslint/utils/ts-eslint';
import { type TSESTree } from '@typescript-eslint/types';
import { type PluginOptions } from '../types';
import { CssWatcher } from '../utils/file-watcher';
import { DEFAULT_OPTIONS } from '../defaults';

let cssWatcher: CssWatcher | null = null;

const rule: RuleModule<'unknownClass', [typeof DEFAULT_OPTIONS]> = {
	defaultOptions: [DEFAULT_OPTIONS],
	meta: {
		type: 'problem',
		docs: {
			description: 'Ensure that CSS classes used in JS/TS files exist',
			recommended: 'recommended',
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
				},
				additionalProperties: false,
			},
		],
	},

	create(context: Readonly<RuleContext<'unknownClass', [typeof DEFAULT_OPTIONS]>>) {
		const options: PluginOptions = {
			...DEFAULT_OPTIONS,
			...(context.options[0] || {}),
		};

		// Initialize watcher if not already done
		if (!cssWatcher) {
			cssWatcher = new CssWatcher(options.cssFiles);
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

		return {
			// Check JSX className attributes
			JSXAttribute(node: TSESTree.JSXAttribute) {
				if (
					node.name.type === 'JSXIdentifier' &&
					options.classAttributes?.includes(node.name.name)
				) {
					if (node.value?.type === 'Literal' && typeof node.value.value === 'string') {
						const classNames = node.value.value.split(/\s+/);
						classNames.forEach((className: string) => {
							validate(className, node);
						});
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
						if (arg.type === 'Literal' && typeof arg.value === 'string') {
							const classNames = arg.value.split(/\s+/);
							classNames.forEach((className: string) => {
								validate(className, arg);
							});
						} else if (arg.type === 'ObjectExpression') {
							validateObjectExpression(arg);
						}
					});
				}
			},
		};
	},
};

export default rule;
