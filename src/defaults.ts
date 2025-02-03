import { type PluginOptions } from './types';

export const DEFAULT_OPTIONS: PluginOptions = {
	classAttributes: ['className', 'class', 'classList'],
	classFunctions: ['clsx', 'classNames', 'cx'],
	cssFiles: ['**/*.css'],
};
