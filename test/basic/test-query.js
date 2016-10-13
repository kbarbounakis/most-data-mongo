/**
 * Created by kbarbounakis on 12/10/2016.
 */

var MongoAdapter = require('./../../index').MongoAdapter,
    MongoFormatter = require('./../../index').MongoFormatter,
    /**
     * IMPORTANT NOTE: Create a copy of app.json as app.test.json and use it to set adapters for MongoDB databases
     */
     conf = require('./../config/app.test.json'),
    qry = require('most-query'),
    assert = require('assert');

describe('mongo connection tests', function() {

    var options = conf.adapters[0].options;
    it('should serialize an insert query expression', function(done) {
        var q = qry.insert({
            "name":"anonymous",
            "description":"Anonymous User",
            "additionalType":"User",
            "dateCreated": new Date(),
            "dateModified": new Date()
        }).into('things');
        console.log(JSON.stringify(q, null, 4));
        assert.equal(q['$insert']['things'].name,'anonymous');
        return done();
    });

    it('should serialize a delete query expression', function(done) {
        var q = qry.deleteFrom('things')
            .where('name').equal('anonymous').and('additionalType').equal('User');
        console.log(JSON.stringify(q, null, 4));
        return done();
    });

    it('should serialize a select query expression', function(done) {
        var q = qry.selectFrom('things')
            .select(['name','description','additionalType'])
            .where('name').equal('anonymous').and('additionalType').equal('User');
        console.log(JSON.stringify(q, null, 4));
        return done();
    });


    it('should serialize an update query expression', function(done) {
        var q = qry.update('things').set(
        {
            "description":"Anonymous Site User",
            "dateModified": new Date()
        }).where('name').equal('anonymous').and('additionalType').equal('User');
        console.log(JSON.stringify(q, null, 4));
        return done();
    });

    it('should insert an object', function(done) {
        var q = qry.insert({
            "name":"anonymous",
            "description":"Anonymous User",
            "additionalType":"User",
            "dateCreated": new Date(),
            "dateModified": new Date()
        }).into('things');
        var db = new MongoAdapter(options);
        db.open(function(err) {
            if (err) { return done(err); }
            db.execute(q, null, function(err, result) {
                if (err) { return done(err); }
                assert.ok(result);
                console.log(JSON.stringify(result, null, 4));
                return done();
            });
        });
    });

    it('should update an object', function(done) {
        var q = qry.update('things').set(
            {
                "description":"Anonymous Site User",
                "dateModified": new Date()
            }).where('name').equal('anonymous').and('additionalType').equal('User');

        var db = new MongoAdapter(options);
        db.open(function(err) {
            if (err) { return done(err); }
            db.execute(q, null, function(err, result) {
                if (err) { return done(err); }
                assert.ok(result);
                console.log(JSON.stringify(result, null, 4));
                return done();
            });
        });
    });

    it('should delete an object', function(done) {
        var q = qry.deleteFrom('things')
            .where('name').equal('anonymous').and('additionalType').equal('User');
        var db = new MongoAdapter(options);
        db.open(function(err) {
            if (err) { return done(err); }
            db.execute(q, null, function(err, result) {
                if (err) { return done(err); }
                assert.ok(result);
                console.log(JSON.stringify(result, null, 4));
                return done();
            });
        });
    });


});