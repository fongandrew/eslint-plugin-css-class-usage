"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const file_watcher_1 = require("../utils/file-watcher");
let cssWatcher = null;
const DEFAULT_OPTIONS = {
    classAttributes: ['className', 'class', 'classList'],
    classFunctions: ['clsx', 'classNames', 'cx'],
    cssFiles: ['**/*.css'],
    ignore: ['**/node_modules/**', '**/dist/**', '**/out/**', '**/build/**'],
    watch: 'auto',
};
const rule = {
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
    create(context) {
        const options = {
            ...DEFAULT_OPTIONS,
            ...context.options[0],
        };
        // Initialize watcher if not already done
        if (!cssWatcher) {
            const shouldWatch = (() => {
                var _a, _b;
                if (options.watch === 'auto') {
                    const script = (_b = (_a = process.argv[1]) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== null && _b !== void 0 ? _b : '';
                    return script.includes('watch') || script.includes('serve');
                }
                return options.watch;
            })();
            cssWatcher = new file_watcher_1.CssWatcher(options.cssFiles, options.ignore, shouldWatch);
        }
        /** Helper to check if a class exists in our CSS files */
        const validate = (className, node) => {
            // Ignore Tailwind classes with arbitrary values
            if (className.includes('[')) {
                return;
            }
            // Remove any Tailwind modifiers
            const baseClass = className.split(':').pop();
            if (!(cssWatcher === null || cssWatcher === void 0 ? void 0 : cssWatcher.hasClass(baseClass))) {
                context.report({
                    node,
                    messageId: 'unknownClass',
                    data: { className: baseClass },
                });
            }
        };
        /** Helper to validate string literal class names */
        const validateStringLiteral = (value, node) => {
            const classNames = value.split(/\s+/);
            classNames.forEach((className) => {
                validate(className, node);
            });
        };
        /** Helper to validate class names in object expressions */
        const validateObjectExpression = (objExpr) => {
            objExpr.properties.forEach((prop) => {
                if (prop.type === 'Property') {
                    if (prop.key.type === 'Literal' && typeof prop.key.value === 'string') {
                        validate(prop.key.value, prop);
                    }
                    else if (prop.key.type === 'Identifier') {
                        validate(prop.key.name, prop);
                    }
                }
                // We ignore SpreadElement as it can't contain class names directly
            });
        };
        /** Helper to validate expressions that might contain class names */
        const validateExpression = (expr) => {
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
            JSXAttribute(node) {
                var _a, _b, _c;
                if (node.name.type === 'JSXIdentifier' &&
                    ((_a = options.classAttributes) === null || _a === void 0 ? void 0 : _a.includes(node.name.name))) {
                    if (((_b = node.value) === null || _b === void 0 ? void 0 : _b.type) === 'Literal' && typeof node.value.value === 'string') {
                        validateStringLiteral(node.value.value, node);
                    }
                    else if (((_c = node.value) === null || _c === void 0 ? void 0 : _c.type) === 'JSXExpressionContainer') {
                        const expr = node.value.expression;
                        if (expr.type === 'ObjectExpression') {
                            validateObjectExpression(expr);
                        }
                    }
                }
            },
            // Check class utility function calls
            CallExpression(node) {
                var _a;
                if (node.callee.type === 'Identifier' &&
                    ((_a = options.classFunctions) === null || _a === void 0 ? void 0 : _a.includes(node.callee.name))) {
                    node.arguments.forEach((arg) => {
                        validateExpression(arg);
                    });
                }
            },
        };
    },
};
exports.default = rule;
