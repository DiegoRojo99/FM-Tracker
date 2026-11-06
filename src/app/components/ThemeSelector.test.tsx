import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ThemeProvider from './ThemeProvider';
import ThemeSelector from './ThemeSelector';

describe('theme selector', () => {
  it('renders an accessible system-default selector without browser APIs during SSR', () => {
    const html = renderToStaticMarkup(<ThemeProvider><ThemeSelector /></ThemeProvider>);
    expect(html).toContain('aria-label="Colour theme"');
    expect(html).toContain('value="system" selected=""');
    expect(html).toContain('value="light"');
    expect(html).toContain('value="dark"');
    expect(html).toContain('fm-field');
    expect(html).not.toContain('role="alert"');
  });
});
