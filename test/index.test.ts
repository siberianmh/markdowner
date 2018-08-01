import * as fs from 'fs'
import * as path from 'path'
import { markdowner } from '../lib/index'
const cheerio = require('cheerio')
const fixtures = {
  basic: fs.readFileSync(path.join(__dirname, 'fixtures/basic.md'), 'utf8'),
  emoji: fs.readFileSync(path.join(__dirname, 'fixtures/emoji.md'), 'utf8'),
  footnotes: fs.readFileSync(path.join(__dirname, 'fixtures/footnotes.md'), 'utf8'),
  frontmatter: fs.readFileSync(path.join(__dirname, 'fixtures/frontmatter.md'), 'utf8')
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

  // it('turns headings into links', () => {
  //   $('h2#basic-fixture a[href="#basic-fixture"]').text().should.equal('Basic Fixture')
  // })

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
      expect(file.content).toContain('<a href="http://full.com">full reference link</a>')
    })
  })

  describe('frontmatter', () => {
    it('does not parse frontmatter by default', async () => {
      const file = await markdowner(fixtures.frontmatter)
      expect(Object.keys(file)).toContain('content')
      expect(Object.keys(file)).not.toContain('title')
    })

    it('parses YML frontmatter if the frontmatter option is true', async () => {
      const file = await markdowner(fixtures.frontmatter, {frontmatter: true})
      expect(Object.keys(file)).toContain('content')
      expect(Object.keys(file)).toContain('title')
      expect(file.title).toEqual('Team post: The new database')
      expect(file.author).toEqual('HashimotoYT')
      expect(file.date).toEqual('2018-09-12')
    })
  })
})
