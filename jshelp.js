const format = require("util").format;
const inspect = require("util").inspect;

const npm = require("npm");
const Promise = require("bluebird");
// const npminfo = Promise.promisify(npm.commands.info, npm.commands);
const fetch = require("node-fetch");
const {Builder, responseIsValid, SearchResponse} = require("mdn-search-api");
const {Ok, Fail} = require("r-result");
const unescape = require("lodash.unescape");

const builder = Builder();
["js", "html", "api", "canvas", "webgl"].forEach(function (topic) {
    builder.addTopic(topic);
});

module.exports = {
    init: function (client, imports) {
        const npm_ready = Promise.promisify(npm.load, npm)({progress: false});

        npm_ready.catch(function (err) {
            client.error("Plugin-JSHelp", err.name);
            client.error("Plugin-JSHelp", err.stack);
        });

        return {
            handlers: {
                "!npm": function (command) {
                    if (command.args.length === 0) {
                        return;
                    }

                    return npm_ready
                    .then(function () {
                        // return npminfo([command.args[0], "name", "description"], true);
                        return new Promise(function (resolve, reject) {
                            npm.commands.info([command.args[0], "name", "description"], true, function (err, res) {
                                if (err) reject(err);
                                else resolve(res);
                            });
                        });
                    })
                    .then(function (res) {
                        const version = Object.keys(res)[0];
                        const node_module = res[version];
                        return format("%s: %s (%s) - %s -> https://npmjs.org/package/%s",
                            command.nickname, node_module.name, version, node_module.description, node_module.name);
                        return (inspect(res));
                    })
                    .catch(function (err) {
                        client.error("Plugin-JSHelp", err.name);
                        client.error("Plugin-JSHelp", err.stack);
                    });
                },

                "!mdn": function (command) {
                    if (command.args.length === 0) {
                        return "https://developer.mozilla.org/ - Mozilla Developer Network";
                    }

                    const query = command.args.join(" ");
                    const url = Builder().query(query).build();
                    client.notice("JSHelp", "MDN Query", query);

                    return fetch(url)
                    .then(function (res) {
                        return res.json();
                    })
                    .then(function (json) {
                        if (!responseIsValid(json)) {
                            return Fail({
                                out: "Error: Unexpected response format from MDN.",
                                log: ["Response from MDN wasn't valid.", JSON.stringify(json)]
                            });
                            console.error("Plugin-JSHelp", "Response from MDN wasn't valid.");
                            console.error("Plugin-JSHelp")
                        } else {
                            return Ok(SearchResponse(json));
                        }
                    })
                    .then(function (responseResult) {
                        return responseResult.andThen(function (searchResponse) {
                            const firstSearchResult = searchResponse.firstResult();

                            if (firstSearchResult === null) {
                                return Fail({
                                    out: `No search result found for query '${query}'`,
                                    log: []
                                });
                            } else {
                                return Ok(firstSearchResult);
                            }
                        });
                    })
                    .then(function (firstSearchResultResult) {
                        // Read as "Result of first search result". :(
                        return firstSearchResultResult
                        .map(function (firstSearchResult) {
                            return format("%s - %s", firstSearchResult.url, firstSearchResult.title);
                        })
                        .unwrapOrElse(function ({out, log}) {
                            log.forEach(function (message) {
                                client.error("Plugin-JSHelp", message);
                            });

                            return out;
                        });
                    })
                    .catch(function (err) {
                        client.error("Plugin-JSHelp", err.name);
                        client.error("Plugin-JSHelp", err.stack);
                    });
                }
            },

            help: {
                npm: [
                    "{{!}}npm <package>",
                    "Look up the description and link to the specified package."
                ],

                mdn: [
                    "{{!}}mdn <query>",
                    "Search the Mozilla Developer Network"
                ]
            },

            commands: ["npm", "mdn"]
        };
    }
};