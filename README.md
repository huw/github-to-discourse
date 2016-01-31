# GitHub to Discourse
[![npm](https://img.shields.io/npm/v/github-to-discourse.svg)](https://www.npmjs.com/package/github-to-discourse)

This is very simple.

It will forward any 'push' webhooks it receives to a specified thread on a [Discourse](https://discourse.org) forum. I couldn't find anything similar around, presumably because people don't really use Discourse to publish new commits. But hey, maybe there's a use-case somewhere.

# Install
1. `npm install -g github-to-discourse`
2. ``cd `npm root -g`/github-to-discourse``
2. `mv config.json.0 config.json` and edit properties (see below)
3. `g2d`

# Config.json Format
_Note: All properties are required unless listed otherwise_
## `discourse`
### `api_key`
Your Discourse API Key. You should ask an admin for this. They'll need your username as well.
### `api_user`
Your Discourse username.
### `domain`
The domain of your Discourse server, without protocols or slashes. e.g. `meta.discourse.org`.
### `https_enabled`
Does the Discourse server use HTTPS? This is optional, defaults to `false`
### `topic_id`
The topic that the program should be posting replies to. You can get this from the number at the end of your topic URL: For `https://meta.discourse.org/t/presence-features-for-forums/12` it's `12`.
## `onebox_enabled`
Some Discourse installations enable a 'onebox' for GitHub commit links, which displays them in a fancy format with the title and message. If you'd like to use this, and your server supports it, you can set this to `true`. Otherwise it's optional, and defaults to false.
## `webhook`
### `path`
The path name on your server that GitHub is sending Webhooks to. Include no slashes, e.g. `push-to-here` if you're hooking to `http://myurl.com/push-to-here`.
### `port`
The port to run on. Optional, will default to 8080.
### `secret`
Your secret for the GitHub webhook.
