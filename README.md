# Anvil theme documentation

Static documentation site for the Anvil Shopify theme, published with GitHub Pages from the `docs/` folder.

- `src/*.html`: hand-written pages. The comment on the first line holds the page title and description.
- `src/assets/`: stylesheet, script, and favicon.
- `build.js`: wraps the pages in the shared layout and generates `sections.html` and `theme-settings.html` from the theme's schemas.
- `site.config.json`: the public site URL and the support form endpoint.

## Build

```bash
node build.js --sync
```

`--sync` reads the schemas from `../anvil` so the reference pages match the theme editor. Run it after every theme release, then commit `docs/`.

## Support form

The form on `support.html` posts to FormSubmit (free). Set `form_action` in `site.config.json` to `https://formsubmit.co/<your-form-id>` and rebuild. The first submission sends an activation email; after you confirm it, FormSubmit gives you a random form ID to use instead of your email address.
