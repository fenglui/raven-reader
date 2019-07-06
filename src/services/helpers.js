import store from '../store'
import {
    parseFeed
} from '../parsers/feed'
import uuid from 'uuid-by-string'
import opmlGenerator from 'opml-generator'
import async from 'async'
import db from './db.js'
import notifier from 'node-notifier'
import _ from 'lodash'
import axios from 'axios'
import ElectronStore from 'electron-store'

const electronStore = new ElectronStore()

export default {
    async syncInoReader() {
        const token = electronStore.get('inoreader_token')
        if (token) {
            const subscriptionLists = await axios.get('https://www.inoreader.com/reader/api/0/subscription/list', {
                headers: {
                    'Authorization': `Bearer ${JSON.parse(token).access_token}`
                }
            })
            const rssFeedUrls = subscriptionLists.data.subscriptions.map((item) => {
                item.feedUrl = item.url
                return item
            })
            this.subscribe(rssFeedUrls, null, false)
            return true
        }
    },
    exportOpml() {
        const header = {
            'title': 'RSS Reader',
            'dateCreated': new Date(2014, 2, 9)
        }
        const outlines = []
        store.state.Feed.feeds.forEach((feed) => {
            outlines.push({
                text: feed.description ? feed.description : '',
                title: feed.title,
                type: 'rss',
                xmlUrl: feed.xmlurl,
                htmlUrl: feed.link
            })
        })

        return opmlGenerator(header, outlines)
    },
    subscribe(feeds, faviconData = null, refresh = false, importData = false) {
        const q = async.queue((task, cb) => {
            const posts = []
            if (!refresh) {
                task.feed.meta.favicon = task.favicon
                task.feed.meta.id = uuid(task.feed.meta.xmlurl)
                store.dispatch('addFeed', task.feed.meta)
            }
            task.feed.posts.forEach((post) => {
                post.feed_id = task.feed.meta.id
                post.favicon = task.favicon
                post.link = post.link ? post.link : task.feed.meta.xmlurl
                post.guid = uuid(post.link ? post.link : task.feed.meta.xmlurl)
                const postItem = _.omit(post, ['creator', 'dc:creator'])
                posts.push(postItem)
            })
            if (refresh) {
                db.addArticles(posts, docs => {
                    if (typeof docs !== 'undefined') {
                        notifier.notify({
                            type: 'info',
                            title: `${docs.length} articles added`,
                            timeout: 3,
                            sticky: false,
                            wait: false,
                            sound: true
                        })
                    }
                })
            } else {
                store.dispatch('addArticle', posts)
            }
            cb()
        }, 2)

        q.drain = () => {
            // console.log('all feeds are processed')
        }

        feeds.forEach(async function (feed) {
            let faviconUrl
            let url

            if (!importData) {
                url = feed.url
            }

            if (feed.xmlurl) {
                url = feed.xmlurl
            }

            if (feed.feedUrl) {
                url = feed.feedUrl
            }

            const feeditem = await parseFeed(url, faviconUrl)
            if (faviconData) {
                faviconUrl = faviconData
            } else {
                faviconUrl = `https://www.google.com/s2/favicons?domain=${feeditem.meta.link}`
            }
            if (refresh) {
                feeditem.meta.id = feed.id
            }
            q.push({
                feed: feeditem,
                favicon: faviconUrl
            })
        })
    }
}