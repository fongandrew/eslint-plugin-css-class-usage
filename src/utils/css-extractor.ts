export function extractClassesFromCss(content: string): Set<string> {
	const classes = new Set<string>();

	// Regex for CSS classes
	const classRegex = /\.([a-zA-Z][a-zA-Z0-9_-]*)/g;

	let match;
	while ((match = classRegex.exec(content)) !== null) {
		if (match[1]) {
			// Regular CSS class
			classes.add(match[1]);
		}
	}

	return classes;
}
