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
                        return npminfo(command.args[0])
                    })
                    .then(function (res) {
                        const versions = res[0];
                        const node_module = versions[Object.keys(versions)[0]];
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