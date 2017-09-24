//const sinon = require("sinon");
const assert = require("better-assert");
// const equal = require("deep-eql");
const inspect = require("util").inspect;
const format = require("util").format;

const debug = Boolean(false || process.env.VERBOSE);
const logfn = debug ? console.log.bind(console) : function () {};

const jshelp_plugin = require("./jshelp");
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

describe("!MDN", function () {
    it.skip("escapes common HTML entities", function () {
        const jshelp = jshelp_plugin.init(client, {});
        return jshelp.handlers["!mdn"]({args: ["HTML script tag"].split(" ")})
        .then(function (output) {
            logfn(format("'%s'", output));
            assert(output === "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script - <script> - HTML (HyperText Markup Language)")
        });
    });
});


describe("!npm", function () {
    it("gives information on specified packages", function () {
        const jshelp = jshelp_plugin.init(client, {});
        return jshelp.handlers["!npm"]({args: ["r-result"], nickname: "Havvy"})
        .then(function (output) {
            logfn(output);
            assert(output === "Havvy: r-result (1.5.1) - Rust's Result in JS -> https://npmjs.org/package/r-result");
        });
    });
});
