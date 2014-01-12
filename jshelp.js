const npm = require('npm');
const Promise = require('bluebird');
const npminfo = Promise.promisify(npm.info, npm);
const format = require('util').format;
const inspect = require('util').inspect;

module.exports = {
    init: function (client, imports) {
        const ready = Promise.promisify(npm.load, npm)({});

        ready.catch(function (err) {
            client.error('Plugin-JSHelp', err.name);
            client.error('Plugin-JSHelp', err.stack);
        });

        return {
            handlers: {
                '!npm': function (command) {
                    if (command.args.length === 0) {
                        return;
                    }

                    return ready
                    .then(function () {
                        return new Promise(function (resolve, reject) {
                            npm.commands.info([command.args[0], 'name', 'description'], true, function (err, res) {
                                if (err) reject(err);
                                else resolve(res);
                            });
                        });
                    })
                    .then(function (res) {
                        const node_module = res[Object.keys(res)[0]];
                        return format('%s: %s - %s -> https://npmjs.org/package/%s',
                            command.nickname, node_module.name, node_module.description, node_module.name);
                        return (inspect(res));
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
                ]
            },

            commands: ['npm']
        };
    }
};