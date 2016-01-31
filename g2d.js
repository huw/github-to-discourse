#! /usr/bin/env node
var fs      = require('fs');
var http    = require('http')
var request = require('request')

var config = JSON.parse(
    fs.readFileSync('config.json')
);

// Ensure all files in object
var mandatory_discourse_props = ["api_key", "api_user", "domain", "topic_id"]
var mandatory_webhook_props = ["secret"]

for (property of mandatory_discourse_props) {
    if (!config.discourse.hasOwnProperty(property)) {
        throw new Error("Required property discourse." + 
            property + 
            " not found in config.json")
    }
}

for (property of mandatory_webhook_props) {
    if (!config.webhook.hasOwnProperty(property)) {
        throw new Error("Required property webhook." + 
            property + 
            " not found in config.json")
    }
}

var handler = require('github-webhook-handler')({
    path: "/" + config.webhook.path,
    secret: config.webhook.secret
})

// Start the server with our handler
var port = config.webhook.hasOwnProperty('port') ? config.webhook.port : 8080
http.createServer(function (req, res) {
    handler(req, res, function (err) {
        res.statusCode = 404
        res.end('Not Found')
    })
}).listen(port, function() {
    console.log("Accepting webhooks to /" + config.webhook.path + " on port " 
                + port)
})

handler.on('push', function(event) {

    console.log("Received push from " + 
        event.payload["respository"]["full_name"])
    var commits = event.payload.commits

    // Handle multiple commits in one webhook
    for (var commit of commits) {

        // BUILD THE MESSAGE
        // We put together the forum post in Markdown
        // by splitting the commit message and adding
        // quote delimeters (`>`) to the beginning of
        // each. If it's the first line, add a `#` to
        // highlight it as a title. If your forum has
        // oneboxes and you'd rather use them, we can
        // skip this.

        var comment_text = ""
        if (config.hasOwnProperty('onebox_enabled') && config.onebox_enabled) {
            commit = commit.message.split("\n")
            comment_text = "_latest changes on github:_\n\n---\n"

            for (var x = 0; x < commit.length; x++) {
                var line = commit[x]
                comment_text += "> " + (x==0 ? "# " : "") + line + "\n"
            }

            comment_text += 
                "\n\n---\n_[more details at github](" +
                commit.url + 
                ") - this is an automated post_"
        } else {
            comment_text = commit.url
        }

        // MAKE THE COMMENT
        // Given the details you added to config.json
        // we make a POST to your thread with details
        // about your commit.

        var discourse_url = ((
            config.discourse.hasOwnProperty('https_enabled') && 
            config.discourse.https_enabled) 
            ? "https://" 
            : "http://"
        ) + config.discourse.domain

        request({
            url: discourse_url + "/posts",
            method: "POST",
            qs: {
                'api_key': config.discourse.api_key,
                'api_username': config.discourse.api_user
            },
            form: {
                topic_id: config.discourse.topic_id,
                raw: comment_text
            }
        }, function(err, res, body) {
            if (err) throw err
            var post_url = discourse_url + "/t/" + config.discourse.topic_id + 
                "/" + res.body["post_number"]
            console.log("Success: " + commit.id + " / " + post_url)
        })
    };
})

handler.on('ping', function(event) {
    console.log("Received ping: " + event.payload.zen)
})

handler.on('error', function(event) {
    console.log(event)
})
