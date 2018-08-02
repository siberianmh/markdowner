import * as grayMatter from 'gray-matter'
import * as pify from 'pify'

const remark = require('remark')
const slug = require('remark-slug')
const hljs = require('remark-highlight.js')
const html = require('remark-html')
const emoji = require('remark-gemoji-to-emoji')
const autolinkHeadings = require('remark-autolink-headings')
const inlineLinks = require('remark-inline-links')

const renderer = remark()
  .use(slug)
  .use(autolinkHeadings, { behaviour: 'wrap' })
  .use(inlineLinks)
  .use(emoji)
  .use([hljs, html], { sanitize: false })

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
  frontmatter: boolean
}

export async function markdowner(
  markdownString: string,
  opts?: IOptions
): Promise<any> {
  const defaults: IOptions = {
    frontmatter: false
  }

  opts = Object.assign(defaults, opts)

  let data = {}
  let content = markdownString

  if (opts.frontmatter) {
    const parsed = grayMatter(markdownString)
    data = parsed.data
    content = parsed.content
  }

  const md = await pify(renderer.process)(content)
  return Promise.resolve<any>(
    Object.assign(data as any, { content: md.contents as any })
  )
}
