import { type Rule } from 'eslint';
import type * as JSXTree from 'estree-jsx';
import { type PluginOptions } from '../types';
import { CssWatcher } from '../utils/file-watcher';
import { DEFAULT_OPTIONS } from '../defaults';

let cssWatcher: CssWatcher | null = null;

const rule: Rule.RuleModule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Ensure that CSS classes used in JS/TS files exist',
			category: 'Possible Errors',
			recommended: true,
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

	create(context: Rule.RuleContext) {
		const options: PluginOptions = {
			...DEFAULT_OPTIONS,
			...(context.options[0] || {}),
		};

		// Initialize watcher if not already done
		if (!cssWatcher) {
			cssWatcher = new CssWatcher(options.cssFiles);
		}

		// Helper to check if a class exists in our CSS files
		const validate = (className: string, node: JSXTree.Node) => {
			// Ignore Tailwind classes with arbitrary values
			if (className.includes('[')) {
				return;
			}
			// Remove any Tailwind modifiers
			const baseClass = className.split(':').pop()!;
			if (!cssWatcher?.hasClass(baseClass)) {
				context.report({
					node,
					message: `Unknown CSS class '${className}'`,
				});
			}
		};

		return {
			// Check JSX className attributes
			JSXAttribute(node: JSXTree.Node) {
				const jsxNode = node as JSXTree.JSXAttribute;
				if (
					jsxNode.name.type === 'JSXIdentifier' &&
					options.classAttributes?.includes(jsxNode.name.name) &&
					jsxNode.value?.type === 'Literal' &&
					typeof jsxNode.value.value === 'string'
				) {
					const classNames = jsxNode.value.value.split(/\s+/);
					classNames.forEach((className: string) => {
						validate(className, jsxNode);
					});
				}
			},

			// Check class utility function calls
			CallExpression(node: JSXTree.Node) {
				const callNode = node as JSXTree.CallExpression;
				if (
					callNode.callee.type === 'Identifier' &&
					options.classFunctions?.includes(callNode.callee.name)
				) {
					callNode.arguments.forEach((arg) => {
						if (arg.type === 'Literal' && typeof arg.value === 'string') {
							const classNames = arg.value.split(/\s+/);
							classNames.forEach((className: string) => {
								validate(className, arg);
							});
						}
					});
				}
			},
		};
	},
};

export default rule;
