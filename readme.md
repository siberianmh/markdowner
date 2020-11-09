# markdowner

⚠ This module is deprecated in favor
[`electron-markdown`](https://github.com/BinaryMuse/electron-markdown) and/or
[`cmark-gfm`](https://github.com/BinaryMuse/node-cmark-gfm) ⚠

### Migrating

If you migrating from default setup of `markdowner` you just need to replace
them by `electron-markdown`.

```diff
- const { markdowner } = require('smh-markdowner')
+ const markdown = require('electron-markdown')

- const { content } = await markdowner('# Hello')
+ const content = await markdown('# Hello')
```

Please notice that the `electron-markdown` doesn't have `gray-matter` and any
caching.

---

> Convert markdown to GitHub-style HTML using a common set of [remark] plugins

[remark] is a performant markdown parser with a large plugin ecosystem. Unlike
some other node markdown parsers that provide syntax highlighting capabilities,
remark does not have any native C++ dependencies. This makes it easier to
install and reduces the likelihood of system-dependent installation failures.

## Plugins

The following [remark] plugins are used by markdowner:

- [remark-slug](http://ghub.io/remark-slug) adds DOM ids to headings
- [remark-autolink-headings](http://ghub.io/remark-autolink-headings) turns
  headings into links
- [remark-inline-links](http://ghub.io/remark-inline-links) supports markdown
  reference links`
- [remark-highlight.js](http://ghub.io/remark-highlight.js) applies syntax
  highlighting to code blocks using highlight.js
- [remark-html](http://ghub.io/remark-html) converts the parsed markdown tree to
  HTML

## Installation

```sh
yarn add smh-markdowner
# or
npm install smh-markdowner --save
```

## Usage

markdowner exports a single function that returns a promise:

```ts
import { markdowner } from 'smh-markdowner'

markdowner('I am markdown').then((doc) => {
  console.log(doc)
})
```

The resolved promise yields an object with a `content` property containing the
parsed HTML:

```ts
{
  content: '<p>I am markdown</p>'
}
```

## Using with Cache

> NOTE: If you want uses cache module you need to install `level` dependency
> manually, you can make by `npm install level`

To use the cache, bring your own [level](https://github.com/Level/level)
instance and supply it as an option to markdown. This helps keep markdowner lean
on (native) dependencies for users who don't need the cache

```ts
import { markdowner } from 'smh-markdowner'
const cache = require('level')('./my-cache')

markdowner('This is cached.', { cache }).then((doc) => {
  console.log(doc)
})
```

## API

### `markdowner(markdownString, {options})`

Arguments:

- `markdownString` String - (required)
- `options` Object - (optional)
  - `frontmatter` Boolean - Whether or not to try to parse [YML frontmatter] in
    the file. Defaults to `false`.
  - `cache` Map - An optional `level` instance in which to store preprocessed
    content.
  - `toc` Boolean - Whether or not to try generate Table of Contents of markdown
    file.

Returns a promise. The resolved object looks like this:

```ts
{
  content: 'HTML goes here'
}
```

If [YML frontmatter] is parsed, those properties will be present on the object
too:

```ts
{
  title: 'The Feminine Mystique',
  author: 'Betty Friedan',
  content: '<p>The Feminine Mystique is a book written by Betty Friedan which is widely credited with sparking the  beginning of second-wave feminism in the United States.</p>'
}
```

## Tests

```sh
yarn
yarn test
```

## License

[MIT](LICENSE)

[remark]: http://ghub.io/remark
[yml frontmatter]: https://jekyllrb.com/docs/frontmatter
