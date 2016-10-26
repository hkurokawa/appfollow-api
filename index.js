'use strict';

var _ = require('lodash');
var errorFactory = require('error-factory');
var querystring = require('querystring');
var md5 = require('md5');
var request = require('superagent');
var endpoints = require(__dirname + '/api-endpoints.json');
var BASE_URL = "http://api.appfollow.io";

var appfollow = {};

var UnexpectedArgumentError = errorFactory('UnexpectedArgumentError');
var MissingArgumentError = errorFactory('MissingArgumentError');
var NetworkError = errorFactory('NetworkError');
var AppFollowServerError = errorFactory('AppFollowError', ['message', 'statusCode', 'response']);
var AppFollowError = errorFactory('AppFollowError', ['message', 'error']);

var api = function (api_secret) {
    return _.mapValues(endpoints, function (e, name) {
        return callee(api_secret, name);
    });
};

function callee(api_secret, name) {
    return function call(args, done) {
        if (_.isUndefined(args) && _.isFunction(done)) {
            done = args;
            args = {};
        }
        if (_.isUndefined(args)) {
            args = {};
        }
        if (_.isUndefined(done)) {
            done = function () {
            }
        }
        if (!endpoints.hasOwnProperty(name)) {
            throw new ReferenceError('API ' + name + ', does not exist.');
        }
        var spec = endpoints[name];
        validateArgs(args, spec);
        var path = spec.path;
        var params = _.clone(args);
        params["sign"] = sign(path, args, api_secret);
        var url = BASE_URL + path + '?' + querystring.stringify(params);
        if (appfollow.debug) {
            console.log("Requesting " + url);
        }
        request.get(url)
            .end(function (err, response) {
                if (err) {
                    return done(new NetworkError('Failed to get the status for ' + url + ': ' + err), null);
                }
                if (!response.ok) {
                    return done(new AppFollowServerError('Error status returned for ' + url), {
                        statusCode: response.statusCode,
                        response: response.body
                    }, null);
                }
                if (!!response.body.error) {
                    return done(new AppFollowError('Error occurred while executing ' + url, {
                        error: response.body.error
                    }), response.body);
                }
                done(null, response.body);
            });
    }
}

function validateArgs(args, spec) {
    console.dir(spec['arguments']);
    var requiredArgs = _(spec['arguments'])
        .omitBy(function (o) {
            return !o.required;
        })
        .keys()
        .value();
    _(args)
        .entries()
        .forEach(function (kv) {
            var key = kv[0];
            if (!_(spec['arguments']).has(key)) {
                throw new UnexpectedArgumentError('The given argument does not match the spec of API ' + spec.path + ': ' + key);
            }
            _.remove(requiredArgs, function (a) {
                return a === key;
            });
        });
    if (!_.isEmpty(requiredArgs)) {
        throw new MissingArgumentError('Some of the required arguments are not specified: ' + requiredArgs);
    }
}

function sign(path, params, api_secret) {
    var p = _(params)
        .entries()
        .sortBy(function (o) {
            return o[0];
        })
        .map(function (o) {
            return o[0] + '=' + o[1];
        })
        .join();
    var s = p + path + api_secret;
    return md5(s);
}

appfollow.api = api;
module.exports = appfollow;