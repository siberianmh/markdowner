require('chai').should()

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

  before(async () => {
    file = await markdowner(fixtures.basic)
    $ = cheerio.load(file.content)
  })

  it('adds DOM ids to headings', () => {
    $('h2#basic-fixture').length.should.equal(1)
  })

  // it('turns headings into links', () => {
  //   $('h2#basic-fixture a[href="#basic-fixture"]').text().should.equal('Basic Fixture')
  // })

  it('handles markdown links', () => {
    // @ts-ignore
    fixtures.basic.should.include('[link](https://link.com)')
    file.content.should.include('<a href="https://link.com">link</a>')
  })

  it('handles emoji shortcodes', async () => {
    const file = await markdowner(fixtures.emoji)
    // @ts-ignore
    fixtures.emoji.should.include(':tada:')
    file.content.should.include('🎉')

    // @ts-ignore | does not mess with existing emoji
    fixtures.emoji.should.include('✨')
    file.content.should.include('✨')
  })

  describe('footnotes', () => {
    let file: any

    before(async () => {
      file = await markdowner(fixtures.footnotes)
    })

    it('handles footnotes in markdown links', async () => {
      // @ts-ignore
      fixtures.footnotes.should.include('[link]')
      file.content.should.include('<a href="http://example.com">link</a>')
    })

    it('handles full reference links', () => {
      // @ts-ignore
      fixtures.footnotes.should.include('[full reference link][full]')
      file.content.should.include('<a href="http://full.com">full reference link</a>')
    })
  })

  describe('frontmatter', () => {
    it('does not parse frontmatter by default', async () => {
      const file = await markdowner(fixtures.frontmatter)
      // @ts-ignore
      Object.keys(file).should.include('content')
      // @ts-ignore
      Object.keys(file).should.not.include('title')
    })

    it('parses YML frontmatter if the frontmatter option is true', async () => {
      const file = await markdowner(fixtures.frontmatter, {frontmatter: true})
      // @ts-ignore
      Object.keys(file).should.include('content')
      // @ts-ignore
      Object.keys(file).should.include('title')
      file.title.should.equal('Team post: The new database')
      file.author.should.equal('HashimotoYT')
      file.date.should.equal('2018-09-12')
    })
  })
})
