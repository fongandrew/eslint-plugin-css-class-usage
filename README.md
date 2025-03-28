# eslint-plugin-css-class-usage

<a href="https://www.npmjs.com/package/eslint-plugin-css-class-usage"><img src="https://img.shields.io/npm/v/eslint-plugin-css-class-usage" alt="NPM badge" />
</a>

This is an ESLint plugin to check that CSS classes used in JS/TS files exist in your stylesheets. It's loosely inspired by the `no-custom-classname` rule from https://github.com/francoismassart/eslint-plugin-tailwindcss, but minus the Tailwind aspects.

## Installation

Install the [NPM package](https://www.npmjs.com/package/eslint-plugin-css-class-usage):

```
npm install eslint-plugin-css-class-usage
```

## Usage

Add the plugin to your ESLint configuration. If you're using the new flat config (eslint.config.js):

```javascript
import cssClassUsagePlugin from 'eslint-plugin-css-class-usage';

export default [
  {
    plugins: {
      'css-class-usage': cssClassUsagePlugin
    },
    rules: {
      'css-class-usage/no-unknown-classes': 'error'
    }
  }
];
```

Or if you're using the traditional configuration (.eslintrc.js):

```javascript
module.exports = {
  plugins: ['css-class-usage'],
  rules: {
    'css-class-usage/no-unknown-classes': 'error'
  }
};
```

## Configuration

The plugin supports the following configuration options:

```javascript
{
  'css-class-usage/no-unknown-classes': ['error', {
    // Attributes to check in JSX elements (default: ['className', 'class', 'classList'])
    classAttributes: ['className', 'class', 'classList'],

    // Function names that handle class composition (default: ['clsx', 'classNames', 'cx'])
    classFunctions: ['clsx', 'classNames', 'cx'],

    // Glob patterns for your CSS files (default: ['**/*.css'])
    cssFiles: ['**/*.css'],

    // Glob patterns for files to ignore (default: ['**/node_modules/**', '**/dist/**', '**/out/**', '**/build/**'])
    ignore: ['**/node_modules/**', '**/dist/**', '**/out/**', '**/build/**']

    // Whether to enable the file watcher for changes to CSS files. This is
    // useful when used as part of an editor plugin but can cause CI jobs
    // to hang. By default, the watcher is enabled only if the running script
    // has `serve` or `watch` in its name (the VSCode ESLint extension is
    // named `eslintServer`). This behavior can be overridden by running
    // your own check and setting this option to true or false accordingly.
    watch: 'auto'
  }]
}
```

All configuration options are optional and will use their default values if not specified.

## Rules

### css-class-usage/no-unknown-classes

This rule ensures that any CSS classes referenced in your JavaScript/TypeScript code actually exist in your CSS files. It helps catch typos and maintains consistency between your code and styles.

#### Examples

```javascript
// ❌ Error: Class 'non-existent-class' does not exist in CSS files
const element = <div className="non-existent-class">Content</div>;

// ✅ Valid: Class exists in CSS files
const element = <div className="existing-class">Content</div>;

// ✅ Valid: Multiple classes that exist
const element = <div className="header main-content">Content</div>;

// ❌ Error: One of the classes doesn't exist
const element = <div className="header non-existent">Content</div>;
```

The rule supports:
- String literals in JSX attributes (e.g., `className="my-class"`)
- Multiple classes in a single string (e.g., `className="header main-content"`)
- Object syntax in JSX (e.g., `className={{ active: true }}`)
- Class utility functions (e.g., `clsx('foo', { bar: true })`)
- Tailwind modifiers (e.g., `hover:bg-blue-500`) - modifiers are automatically stripped when checking
- Tailwind arbitrary values (e.g., `[mask-type:luminance]`) - these are automatically ignored

## Contributing

Pull requests are welcome! Please make sure to update tests as appropriate.

## License

[MIT](./LICENSE)
