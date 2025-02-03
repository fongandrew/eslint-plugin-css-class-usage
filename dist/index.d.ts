/**
 * @fileoverview ESLint plugin to validate CSS class usage in JavaScript/TypeScript files
 * @author ESLint Plugin CSS Class Usage Contributors
 */
declare const _default: {
    /**
     * List of supported rules
     */
    rules: {
        /**
         * Rule to validate that CSS classes used in code exist in stylesheets
         * @see ./rules/no-unknown-class.ts
         */
        'no-unknown-classes': import("@typescript-eslint/utils/ts-eslint").RuleModule<"unknownClass", [import("./rules/no-unknown-class").PluginOptions], import("@typescript-eslint/utils/ts-eslint").RuleListener>;
    };
    /**
     * Recommended configuration
     */
    configs: {
        recommended: {
            plugins: string[];
            rules: {
                'css-class-usage/no-unknown-class': (string | {
                    cssFiles: string[];
                    classAttributes: string[];
                    classFunctions: string[];
                    ignore: string[];
                })[];
            };
        };
    };
};
export = _default;
