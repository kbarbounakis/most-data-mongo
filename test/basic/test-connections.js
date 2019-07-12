/**
 * Created by kbarbounakis on 12/10/2016.
 */
const MongoAdapter = require('../../modules/mongo').MongoAdapter;
/**
 * IMPORTANT NOTE: Create a copy of app.json as app.test.json and use it to set adapters for MongoDB databases
 */
const conf = require('./../config/app.test.json');
const assert = require('assert');

describe('mongo connection tests', function() {

    const options = conf.adapters.find(function (x) {
        return x.name === 'test';
    }).options;

    const invalidOptions = conf.adapters.find(function (x) {
        return x.name === 'invalid';
    }).options;

    it('should open and close connection', function(done) {
        const db = new MongoAdapter(options);
        db.open(function(err) {
            if (err) { return done(err); }
           db.close(function() {
               return done();
           })
        });
    });

    it('should get an error for invalid credentials', function(done) {
        const db = new MongoAdapter(invalidOptions);
        db.open(function(err) {
            assert.ok(err, 'Expected error');
            assert.strictEqual(err.message, 'failed to connect to server [localhost:27017] on first connect [MongoError: Authentication failed.]');
            return done();
        });
    });

});
