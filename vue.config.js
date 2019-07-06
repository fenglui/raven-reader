module.exports = {
    pluginOptions: {
        electronBuilder: {
            builderOptions: {
                "productName": "Raven Reader",
                "appId": "org.helloefficiency.ravenreader",
                "mac": {
                    "publish": [
                        "github"
                    ],
                    "icon": "build/icons/icon.icns"
                },
                "win": {
                    "publish": [
                        "github"
                    ],
                    "icon": "build/icons/icon.ico"
                },
                "linux": {
                    "publish": [
                        "github"
                    ],
                    "category": "News",
                    "icon": "build/icons"
                }
            }
        }
    }
}