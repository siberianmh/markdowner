import grayMatter from 'gray-matter'
import pify from 'pify'
import hasha = require('hasha')
import stableStringify from 'json-stable-stringify'

const remark = require('remark')
const slug = require('remark-slug')
const hljs = require('remark-highlight.js')
const html = require('remark-html')
const emoji = require('remark-gemoji-to-emoji')
const autolinkHeadings = require('remark-autolink-headings')
const inlineLinks = require('remark-inline-links')
const toc = require('remark-toc')

/**
 * Interface for standard options.
 *
 * @interface IOptions
 */
export interface IOptions {
  /**
   * Whether or not to try to parse YML frontmatter in
   * the file.
   * @default false
   */
  frontmatter?: boolean,

  /**
   * An optional `level` instance in which to store
   * preprocessed content.
   */
  cache?: Map<string, boolean> | any

  /**
   * Whether or not to try generate Table of Contents
   * of markdown file.
   * @default false
   */
  toc?: boolean
}

export async function markdowner(
  markdownString: string,
  opts?: IOptions
): Promise<any> {
  let renderer = remark()
    .use(slug)
    .use(autolinkHeadings, { behaviour: 'wrap' })
    .use(inlineLinks)
    .use(emoji)
    .use([hljs, html], { sanitize: false })

  const hash = makeHash(markdownString, opts)

  const defaults: IOptions = {
    frontmatter: false,
    toc: false
  }

  opts = Object.assign(defaults, opts)

  let data = {}
  let content = markdownString

  // Check the cache for preprocessed markdown
  if (opts.cache) {
    let existing = false
    try {
      existing = await opts.cache.get(hash)
    } catch (err) {
      if (!err.notFound) console.error(err)
    }
    if (existing) return existing
  }

  if (opts.frontmatter) {
    const parsed = grayMatter(markdownString)
    data = parsed.data
    content = parsed.content
  }

  if (opts.toc) {
    renderer = remark()
    .use(slug)
    .use(autolinkHeadings, { behaviour: 'wrap' })
    .use(inlineLinks)
    .use(emoji)
    .use([hljs, html], { sanitize: false })
    .use(toc)
  }

  const md = await pify(renderer.process)(content)
  Object.assign(data, {content: md.contents})

  // Save processed markdown in cache
  if (opts.cache) await opts.cache.put(hash, data)

  return data
}

// Create a unique hash from the given input (markdown + options object)
function makeHash (markdownString: string, opts: IOptions | undefined): string {
  // Copy existing opts object to avoid mutation
  const hashableOpts = Object.assign({}, opts)

  // Ignore `cache` prop when creating hash
  delete hashableOpts.cache

  // Deterministic stringifier gets a consistent hash from stringified results
  // object keys are sorted to ensure {a:1, b:2} has the same hash as {b:2, a:1}
  // empty object should become an empty string, not {}
  const optsString = Object.keys(hashableOpts).length ? stableStringify(hashableOpts) : ''

  return hasha(markdownString + optsString)
}
