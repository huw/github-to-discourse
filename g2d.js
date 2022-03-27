#! /usr/bin/env node
var fs      = require('fs');
var http    = require('http')
var request = require('request')

var config_path;
if (process.argv[2]) {
  config_path = process.argv[2];
} else {
  config_path = 'config.json';
}

var config = JSON.parse(
    fs.readFileSync(config_path)
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

    // Extract some parameters from event payload.
    var repository_name = event.payload["repository"]["full_name"]
    var default_branch = event.payload["repository"]["default_branch"]
    var target_ref = event.payload["ref"]
    var commits = event.payload.commits

    console.log("Received push from " + repository_name)

    // When configured, only process push events to the default branch.
    if (config.repository && config.repository.default_branch_only) {
        var default_branch_ref = "refs/heads/" + default_branch
        if (target_ref != default_branch_ref) {
            console.log("Ignoring push to non-default branch ref " + target_ref)
            return
        }
    }

    // Handle multiple commits in one webhook
    for (var commit of commits) {

        console.log("Processing commit '" + commit.id + "': " + commit.message)

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
            comment_text = commit.url
        } else {
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
        }

        create_post(commit, comment_text)

    };
})

function create_post(commit, comment_text) {

        // http://learndiscourse.org/discourse-api-documentation/#posts

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

        var post_url = discourse_url + "/posts"

        console.log("Posting to Discourse: url=" + post_url + ", topic_id=" + config.discourse.topic_id + ", raw=" + comment_text)
        request({
            sync: true,
            async: false,
            url: post_url,
            method: "POST",
            headers: {
                'Api-Key': config.discourse.api_key,
                'Api-Username': config.discourse.api_user
            },
            form: {
                topic_id: config.discourse.topic_id,
                raw: comment_text
            }
        }, function(err, res, body) {
            if (err) throw err
            var response = JSON.parse(body)
            if (response.errors) {
                console.error("Error posting commit '" + commit.id + "': " + response.errors)
            } else {
                var post_url = discourse_url + "/t/" + config.discourse.topic_id +
                    "/" + JSON.parse(body).post_number
                console.log("Success: " + commit.id + " / " + post_url)
            }
        })

}

handler.on('ping', function(event) {
    console.log("Received ping: " + event.payload.zen)
})

handler.on('error', function(event) {
    console.log(event)
})
