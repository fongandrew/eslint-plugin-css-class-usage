export interface PluginOptions {
	/** Attributes to check in JSX elements (e.g., 'className', 'class') */
	classAttributes?: string[];
	/** Function names that handle class composition (e.g., 'clsx', 'classNames') */
	classFunctions?: string[];
	/** File patterns to watch for CSS classes */
	cssFiles?: string[];
}
