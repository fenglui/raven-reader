import jetpack from 'fs-jetpack'
import fs from 'fs'
import DataStore from 'nedb'
import {
    remote
} from 'electron'

export default class {
    constructor() {
        this.db = null
        this.useDataDir = jetpack.cwd(remote.app.getPath('home'))
    }

    createOrReadDatabase(db) {
        const dirName = process.env.NODE_ENV === 'development' ? '.rss-reader-dev' : '.rss-reader'
        const existsDir = jetpack.exists(this.useDataDir.path(dirName))
        if (!existsDir) {
            fs.mkdir(this.useDataDir.path(`${dirName}`), () => {})
        }
        const existsArticle = fs.existsSync(this.useDataDir.path(`${dirName}/${db.article}`))
        const existsFeed = fs.existsSync(this.useDataDir.path(`${dirName}/${db.feed}`))
        const existsCategory = fs.existsSync(this.useDataDir.path(`${dirName}/${db.category}`))

        let database = {}

        if (!existsArticle && !existsFeed && !existsCategory) {
            this.useDataDir.write(this.useDataDir.path(`${dirName}/${db.article}`), '')
            this.useDataDir.write(this.useDataDir.path(`${dirName}/${db.feed}`), '')
            this.useDataDir.write(this.useDataDir.path(`${dirName}/${db.category}`), '')
        }

        database.article = new DataStore({
            filename: this.useDataDir.path(`${dirName}/${db.article}`),
            autoload: true
        })

        database.feed = new DataStore({
            filename: this.useDataDir.path(`${dirName}/${db.feed}`),
            autoload: true
        })

        database.categories = new DataStore({
            filename: this.useDataDir.path(`${dirName}/${db.category}`),
            autoload: true
        })

        return database
    }

    init() {
        if (this.db) {
            return this.db
        }

        this.db = this.createOrReadDatabase({
            article: 'articles.db',
            feed: 'feeds.db',
            category: 'categories.db'
        })

        return this.db
    }
}