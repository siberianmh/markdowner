import * as grayMatter from 'gray-matter'
import { promisify } from 'util'
import hasha = require('hasha')
import * as stableStringify from 'json-stable-stringify'
import * as remark from 'remark'

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
  frontmatter?: boolean

  /**
   * An optional `level` instance in which to store
   * preprocessed content.
   */
  cache?: Map<string, boolean> | any

  runBefore?: Array<any>

  /**
   * Whether or not to try generate Table of Contents
   * of markdown file.
   * @default false
   */
  toc?: boolean
}

export async function markdowner(
  markdownString: string,
  opts?: IOptions,
): Promise<any> {
  const hash = makeHash(markdownString, opts)

  const defaults: IOptions = {
    frontmatter: false,
    runBefore: [],
    toc: false,
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
    opts.runBefore = [toc]
  }

  const renderer = remark()
    .use(opts.runBefore ?? [])
    .use(slug)
    .use(autolinkHeadings, { behavior: 'wrap' })
    .use(inlineLinks)
    .use(emoji)
    .use(hljs)
    .use(html, { sanitize: false })

  const md = await promisify(renderer.process)(content)
  Object.assign(data, { content: md.contents })

  // Save processed markdown in cache
  if (opts.cache) await opts.cache.put(hash, data)

  return data
}

// Create a unique hash from the given input (markdown + options object)
function makeHash(markdownString: string, opts: IOptions | undefined): string {
  // Copy existing opts object to avoid mutation
  const hashableOpts = Object.assign({}, opts)

  // Ignore `cache` prop when creating hash
  delete hashableOpts.cache

  // Deterministic stringifier gets a consistent hash from stringified results
  // object keys are sorted to ensure {a:1, b:2} has the same hash as {b:2, a:1}
  // empty object should become an empty string, not {}
  const optsString = Object.keys(hashableOpts).length
    ? stableStringify(hashableOpts)
    : ''

  return hasha(markdownString + optsString)
}
