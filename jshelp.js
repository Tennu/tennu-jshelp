const npm = require('npm');
const Promise = require('bluebird');
const npminfo = Promise.promisify(npm.info, npm);
const format = require('util').format;
const inspect = require('util').inspect;
const request = require('request');
const unescape = require('lodash.unescape');

module.exports = {
    init: function (client, imports) {
        const npm_ready = Promise.promisify(npm.load, npm)({});

        npm_ready.catch(function (err) {
            client.error('Plugin-JSHelp', err.name);
            client.error('Plugin-JSHelp', err.stack);
        });

        return {
            handlers: {
                '!npm': function (command) {
                    if (command.args.length === 0) {
                        return;
                    }

                    return npm_ready
                    .then(function () {
                        return new Promise(function (resolve, reject) {
                            npm.commands.info([command.args[0], 'name', 'description'], true, function (err, res) {
                                if (err) reject(err);
                                else resolve(res);
                            });
                        });
                    })
                    .then(function (res) {
                        const version = Object.keys(res)[0];
                        const node_module = res[version];
                        return format('%s: %s (%s) - %s -> https://npmjs.org/package/%s',
                            command.nickname, node_module.name, version, node_module.description, node_module.name);
                        return (inspect(res));
                    })
                    .catch(function (err) {
                        client.error('Plugin-JSHelp', err.name);
                        client.error('Plugin-JSHelp', err.stack);
                    });
                },

                '!mdn': function (command) {
                    if (command.args.length === 0) {
                        return 'https://developer.mozilla.org/ - Mozilla Developer Network';
                    }

                    return new Promise(function (resolve, reject) {
                        var query = ["site%3Adeveloper.mozilla.org"];
                        query = query.concat(command.args.map(encodeURIComponent)).join('%20');

                        client.notice('JSHelp', 'MDN Query', query);

                        request({
                            'url': 'https://ajax.googleapis.com/ajax/services/search/web?v=1.0&q=' + query,
                            'json': true
                        }, function (err, message, res) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(res.responseData.results[0]);
                            }
                        });
                    })
                    .then(function (res) {
                        // Turn &gt; into >, ect.
                        // Strip the " | MDN" from end of title.
                        return {
                            url: res.url, 
                            title: unescape(res.titleNoFormatting.slice(0, -6))
                        };
                    })
                    .then(function (res) {
                        return format("%s - %s", res.url, res.title)
                    })
                    .catch(function (err) {
                        client.error('Plugin-JSHelp', err.name);
                        client.error('Plugin-JSHelp', err.stack);
                    });
                }
            },

            help: {
                npm: [
                    '!npm <module>',
                    'Look up the description and link to the specified module.'
                ],

                mdn: [
                    '!mdn <query>',
                    'Search the Mozilla Developer Network'
                ]
            },

            commands: ['npm', 'mdn']
        };
    }
};