import { type RuleModule } from '@typescript-eslint/utils/ts-eslint';
export interface PluginOptions {
    /** Attributes to check in JSX elements (e.g., 'className', 'class') */
    classAttributes?: string[];
    /** Function names that handle class composition (e.g., 'clsx', 'classNames') */
    classFunctions?: string[];
    /** File patterns to watch for CSS classes */
    cssFiles?: string[];
    /** Patterns to ignore when searching for CSS files */
    ignore?: string[];
}
declare const rule: RuleModule<'unknownClass', [PluginOptions]>;
export default rule;
