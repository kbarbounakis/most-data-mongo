/**
 * Created by kbarbounakis on 12/10/2016.
 */
var mongoadp = require('./../../index'),
    _ = require('lodash'),
    /**
     * IMPORTANT NOTE: Create a copy of app.json as app.test.json and use it to set adapters for MongoDB databases
     */
    conf = require('./../config/app.test.json');
    assert = require('assert');

describe('mongo connection tests', function() {

    var options = _.find(conf.adapters, function(x) {
      return x.name === 'test';
    }).options;

    var invalidOptions = _.find(conf.adapters, function(x) {
        return x.name === 'invalid';
    }).options;

    it('should open and close connection', function(done) {
        var db = mongoadp.createInstance(options);
        db.open(function(err) {
            if (err) { return done(err); }
           db.close(function() {
               return done();
           })
        });
    });

    it('should get an error for invalid credentials', function(done) {
        var db = mongoadp.createInstance(invalidOptions);
        db.open(function(err) {
            assert.ok(err, 'Expected error');
            assert.equal(err.message, 'Not Authenticated');
            return done();
        });
    });

});