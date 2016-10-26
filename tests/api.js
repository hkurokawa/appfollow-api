var assert = require('assert');
var mock = require('mock-require');
var mockagent = {
    verifyUrl: function (url) {
    },
    setResponse: function (err, response) {
        this._err = err;
        this._response = response;
    }
};

mock('superagent', {
    get: function (url) {
        mockagent.verifyUrl(url);
        return {
            end: function (callback) {
                callback(mockagent._err, mockagent._response);
            }
        }
    }
});
var appfollow = require(__dirname + '/../index.js');
var endpoints = require(__dirname + '/../api-endpoints.json');

describe('#api', function () {
    it('should throw an error if an unexpected argument is passed', function () {
        try {
            appfollow.api('dummy-secret').apps({cid: 'hoge', fuga: ''});
            assert.fail('Error should occur');
        } catch (e) {
        }
    });
    it('should throw an error if a required argument is missing', function () {
        try {
            appfollow.api('dummy-secret').app({cid: 'hoge'});
            assert.fail('Error should occur');
        } catch (e) {
        }
    });
    it('should return success response', function (done) {
        mockagent.verifyUrl = function (url) {
            assert.equal(url, 'http://api.appfollow.io/apps?cid=my-client-id&sign=786fa5d8b29a18aed8c1c9071b03ffd0');
        };
        mockagent.setResponse(null, {ok: true, body: {apps: [{id: "1"}]}});
        appfollow.api('my-api-secret').apps({cid: 'my-client-id'}, function (err, result) {
            if (err) {
                done(err);
            } else {
                assert.equal(result.apps[0].id, '1');
                done();
            }
        });
    })
});