# GitHub to Discourse
This is very simple.

It will forward any 'push' webhooks it receives to a specified thread on a [Discourse](https://discourse.org) forum. I couldn't find anything similar around, presumably because people don't really use Discourse to publish new commits. But hey, maybe there's a use-case somewhere.

# Install
1. `npm install -g git+ssh://git@github.com/huw/github-to-discourse.git`
2. `mv config.json.0 config.json` and edit properties (see below)
3. `g2d`

# Config.json Format
You can rename `config.json.0` or just copy this:
```
    {
        "discourse": {
            "api_key": "",          // Your discourse API Key (Ask an admin for one)
            "api_user": "",         // Your discourse username
            "domain": "",           // Domain of your discourse server (format: "meta.discourse.org")
            "https_enabled": false, // Use https for the discourse server, optional (default: false)
            "topic_id": 0           // Topic ID to post comments to (See number at end of URL, eg. `meta.discourse.org/t/topic/233`)
        },
        "onebox_enabled": false,    // If your forum converts a commit link to a fancy box and you'd rather use that, set to true. Optional (default: false)
        "webhook": {
            "path": "",             // Path name that GitHub will send webhooks to (format: "path-name", omit slashes)
            "port": 8080,           // Port to run on, optional (default: 8080)
            "secret": ""            // GitHub webhook secret
        }
    }
```

Edit the propeties as appropriate. Everything except `discourse.https_enabled`, `onebox_enabled` and `webhook.port` is mandatory.
