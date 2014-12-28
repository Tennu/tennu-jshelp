//const sinon = require('sinon');
const assert = require('better-assert');
// const equal = require('deep-eql');
const inspect = require('util').inspect;
const format = require('util').format;

const debug = false;
const logfn = debug ? console.log.bind(console) : function () {};

const jshelp_plugin = require('./jshelp');
const client = {
    notice: logfn,
    error: function err (pluginName, errorState) {
        if (err.showedName !== true) {
            logfn("Error: " + errorState);
            err.showedName = true;
            return;
        }

        logfn("Error: " + errorState);
        assert(false);
    }
};

describe("MDN -", function () {
    it("Escapes common HTML entities", function () {
        const jshelp = jshelp_plugin.init(client, {});
        return jshelp.handlers["!mdn"]({args: ['HTML script']})
        .then(function (output) {
            logfn(format("'%s'", output));
            assert(output === "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script - <script> - HTML (HyperText Markup Language)")
        });
    });
});