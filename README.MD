# Chrome Cookies Extension
A nicer way of dealing with cookies in Chrome.

## Features
- **Editable decoded value!** Supports JSON and plain strings
- Flexible columns width
- Columns visibility control
- Comprehensive hosts tree
- Convenient cookie editor

## Features examples

### Editable Decoded Value & Cookie Viewer
![Editable Decoded Value & Cookie Viewer](docs/decoded.gif)

### Flexible Columns/Areas Sizes
![Flexible Columns/Areas Sizes](docs/widths.gif)

### Columns Visibility Control
![Columns Visibility Control](docs/visibility.gif)

## Contributing

1. Pull the project
2. Install with `npm install`
3. Run `npm run watch` to enable the watcher
4. Add the project directory as an Unpacked Extension to your Chrome instance [as per docs](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked)
5. Enjoy!
6. Check your code with Eslint before pushing `npm run cs`

## Known Limitations
- `Secure` is not updatable - this is a limitation in the native Chrome's cookie manager. It's likely dictated by the fact that you cannot change Secure without changing the host from `https` to `http`.
- Expiration date `Session` is not updatable - the limitation of the very first version of the extension. Is planned to be fixed.
- Cookies with the same name and different path are treated wrong - a very rare case when you have a cookie with a same name but different path. Will be fixed as well.
- SameSite cannot be set to None - don't know why but you can't do it even in the native Chrome's cookies panel.
