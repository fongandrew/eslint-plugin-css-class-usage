"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const no_unknown_class_1 = __importDefault(require("./rules/no-unknown-class"));
module.exports = {
    /**
     * List of supported rules
     */
    rules: {
        /**
         * Rule to validate that CSS classes used in code exist in stylesheets
         * @see ./rules/no-unknown-class.ts
         */
        'no-unknown-classes': no_unknown_class_1.default,
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
                        ignore: ['**/node_modules/**', '**/dist/**', '**/out/**', '**/build/**'],
                    },
                ],
            },
        },
    },
};
