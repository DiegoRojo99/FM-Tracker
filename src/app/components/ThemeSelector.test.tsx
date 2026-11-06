import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ThemeProvider from './ThemeProvider';
import ThemeSelector from './ThemeSelector';
import SettingsPage from '../settings/page';

describe('theme selector', () => {
  it('renders an accessible system-default selector without browser APIs during SSR', () => {
    const html = renderToStaticMarkup(<ThemeProvider><ThemeSelector /></ThemeProvider>);
    expect(html).toContain('for="colour-theme"');
    expect(html).toContain('id="colour-theme"');
    expect(html).toContain('aria-describedby="colour-theme-description"');
    expect(html).toContain('value="system" selected=""');
    expect(html).toContain('value="light"');
    expect(html).toContain('value="dark"');
    expect(html).toContain('fm-field');
    expect(html).not.toContain('role="alert"');
  });

  it('places theme preferences in the settings appearance section', () => {
    const html = renderToStaticMarkup(<ThemeProvider><SettingsPage /></ThemeProvider>);
    expect(html).toContain('>Settings</h1>');
    expect(html).toContain('aria-labelledby="appearance-heading"');
    expect(html).toContain('Your choice is saved in this browser.');
  });
});
