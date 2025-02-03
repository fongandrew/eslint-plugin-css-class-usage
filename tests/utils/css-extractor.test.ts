import { extractClassesFromCss } from '../../src/utils/css-extractor';

describe('extractClassesFromCss', () => {
	test('extracts a single class', () => {
		const css = '.test-class { color: red; }';
		const result = extractClassesFromCss(css);
		expect(result).toEqual(new Set(['test-class']));
	});

	test('extracts multiple classes', () => {
		const css = `
      .class1 { color: red; }
      .class2 { color: blue; }
      .class3 { color: green; }
    `;
		const result = extractClassesFromCss(css);
		expect(result).toEqual(new Set(['class1', 'class2', 'class3']));
	});

	test('handles nested rules', () => {
		const css = `
      .parent {
        color: red;
        .child {
          color: blue;
        }
      }
      @media (max-width: 768px) {
        .responsive {
          color: green;
        }
      }
    `;
		const result = extractClassesFromCss(css);
		expect(result).toEqual(new Set(['parent', 'child', 'responsive']));
	});

	test('handles empty input', () => {
		const result = extractClassesFromCss('');
		expect(result).toEqual(new Set());
	});

	test('ignores invalid selectors and non-class selectors', () => {
		const css = `
      #id { color: red; }
      [data-test] { color: blue; }
      div { color: green; }
      .valid-class { color: yellow; }
    `;
		const result = extractClassesFromCss(css);
		expect(result).toEqual(new Set(['valid-class']));
	});
});
