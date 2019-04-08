import * as fs from 'fs'
import * as path from 'path'
import { markdowner } from '../lib/index'
const cheerio = require('cheerio')
const level = require('level')
import hasha = require('hasha')

const readFile = (file: string) =>
  fs.readFileSync(path.join(__dirname, `${file}`), 'utf8')

const fixtures = {
  basic: readFile('fixtures/basic.md'),
  emoji: readFile('fixtures/emoji.md'),
  footnotes: readFile('fixtures/footnotes.md'),
  frontmatter: readFile('fixtures/frontmatter.md'),
  code: readFile('fixtures/code.md'),
  table: readFile('fixtures/table.md'),
  toc: readFile('fixtures/toc.md')
}

describe('markdowner', () => {
  let file: any, $: any

  beforeAll(async () => {
    file = await markdowner(fixtures.basic)
    $ = cheerio.load(file.content)
  })

  it('adds DOM ids to headings', () => {
    expect($('h2#basic-fixture').length).toEqual(1)
  })

  it('turns headings into links', () => {
    expect($('h2#basic-fixture a[href="#basic-fixture"]').text()).toEqual(
      'Basic Fixture'
    )
  })

  it('handles markdown links', () => {
    expect(fixtures.basic).toContain('[link](https://link.com)')
    expect(file.content).toContain('<a href="https://link.com">link</a>')
  })

  it('handles emoji shortcodes', async () => {
    const file = await markdowner(fixtures.emoji)
    expect(fixtures.emoji).toContain(':tada:')
    expect(file.content).toContain('🎉')

    // does not mess with existing emoji
    expect(fixtures.emoji).toContain('✨')
    expect(file.content).toContain('✨')
  })

  it('handles syntax highlight', async () => {
    const file = await markdowner(fixtures.code)
    expect(file.content).toContain("<pre><code class=\"hljs language-js\">")
  })

  it('table renders', async () => {
    const file = await markdowner(fixtures.table)
    expect(file.content).toContain('li')
  })

  describe('footnotes', () => {
    let file: any

    beforeAll(async () => {
      file = await markdowner(fixtures.footnotes)
    })

    it('handles footnotes in markdown links', async () => {
      expect(fixtures.footnotes).toContain('[link]')
      expect(file.content).toContain('<a href="http://example.com">link</a>')
    })

    it('handles full reference links', () => {
      expect(fixtures.footnotes).toContain('[full reference link][full]')
      expect(file.content).toContain(
        '<a href="http://full.com">full reference link</a>'
      )
    })
  })

  describe('table of contents', () => {
    it('generates', async () => {
      const file = await markdowner(fixtures.toc, { toc: true })
      expect(fixtures.toc).not.toContain('Table Of Contents')
      expect(file.content).toContain('Table of Contents')
    })

    it('to contain table', async () => {
      const file = await markdowner(fixtures.toc, { toc: true })
      expect(file.content).toContain('ul')
    })
  })

  describe('frontmatter', () => {
    it('does not parse frontmatter by default', async () => {
      const file = await markdowner(fixtures.frontmatter)
      expect(Object.keys(file)).toContain('content')
      expect(Object.keys(file)).not.toContain('title')
    })

    it('parses YML frontmatter if the frontmatter option is true', async () => {
      const file = await markdowner(fixtures.frontmatter, { frontmatter: true })
      expect(Object.keys(file)).toContain('content')
      expect(Object.keys(file)).toContain('title')
      expect(file.title).toEqual('Team post: The new database')
      expect(file.author).toEqual('HashimotoYT')
      expect(file.date).toEqual('2018-09-12')
    })
  })

  describe('caching', () => {
    const db = level('./test/.cache', {valueEncoding: 'json'})

    it('accepts an optional leveldb instance as a cache', async () => {
      const hash = hasha(fixtures.basic)
      await db.put(hash, {content: 'Hello from the caching world'})

      const uncached = await markdowner(fixtures.basic)
      expect(uncached.content).toContain('<h2')

      const cached = await markdowner(fixtures.basic, {cache: db})
      expect(cached.content).toEqual('Hello from the caching world')
    })

    it('saves to the cache', async () => {
      const hash = hasha('This is cached?')
      await db.del(hash)

      await markdowner('This is cached?', {cache: db})
      const cached = await db.get(hash)
      expect(cached.content).toEqual('<p>This is cached?</p>\n')
    })
  })
})
