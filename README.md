# eslint-plugin-css-class-usage

This is an ESLint plugin to check that CSS classes used in JS/TS files exist in your stylesheets. It's loosely inspired by the `no-custom-classname` rule from https://github.com/francoismassart/eslint-plugin-tailwindcss, but minus the Tailwind aspects.

## Installation

This isn't published on NPM yet, so you'll have to install directly from the repo:

```
npm install https://github.com/fongandrew/eslint-plugin-css-class-usage.git
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
      'css-class-usage/no-unknwon-classes': 'error'
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
    // Glob patterns for your CSS/SCSS files
    cssFiles: ['src/**/*.css', 'src/**/*.scss'],
    // Glob patterns for files to ignore
    ignore: ['node_modules/**'],
    // Enable watching CSS files for changes (default: true)
    watch: true
  }]
}
```

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
- String literals
- Multiple classes in a single string
- class or className prop in JSX
- classList prop in SolidJS
- Various other common patterns for applying CSS classes

## Contributing

Pull requests are welcome! Please make sure to update tests as appropriate.

## License

[MIT](./LICENSE)