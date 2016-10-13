/**
 * Created by kbarbounakis on 12/10/2016.
 */

var MongoAdapter = require('./../../index').MongoAdapter,
    MongoFormatter = require('./../../index').MongoFormatter,
    /**
     * IMPORTANT NOTE: Create a copy of app.json as app.test.json and use it to set adapters for MongoDB databases
     */
     conf = require('./../config/app.test.json'),
    randoms = require('./randoms'),
    qry = require('most-query'),
    assert = require('assert');

describe('mongo connection tests', function() {

    var options = conf.adapters[0].options;
    it('should serialize an insert query expression', function(done) {
        var q = qry.insert(randoms.person()).into('things');
        console.log(JSON.stringify(q, null, 4));
        assert.ok(q['$insert']['things']);
        return done();
    });

    it('should insert objects', function(done) {

        var newItems = require('./person-seed.json');
        var q = qry.insert(newItems).into('things');
        var db = new MongoAdapter(options);
        db.open(function(err) {
            if (err) { return done(err); }
            db.execute(q, null, function(err, result) {
                if (err) { return done(err); }
                assert.ok(result);
                console.log(JSON.stringify(newItems, null, 4));
                console.log(JSON.stringify(result, null, 4));
                return done();
            });
        });
    });


});