/**
 * Created by kbarbounakis on 12/10/2016.
 */
const MongoAdapter = require('./../../index').MongoAdapter;
/**
 * IMPORTANT NOTE: Create a copy of app.json as app.test.json and use it to set adapters for MongoDB databases
 */
const conf = require('./../config/app.test.json');
const QueryUtils = require('@themost/query').QueryUtils;
const assert = require('assert');

describe('mongo connection tests', function() {

    let options = conf.adapters[0].options;
    it('should serialize an insert query expression', function(done) {
        let query = QueryUtils.insert({
            "name":"anonymous",
            "description":"Anonymous User",
            "additionalType":"User",
            "dateCreated": new Date(),
            "dateModified": new Date()
        }).into('things');
        console.log(JSON.stringify(query, null, 4));
        assert.strictEqual(query['$insert']['things'].name,'anonymous');
        return done();
    });

    it('should serialize a delete query expression', function(done) {
        let query = QueryUtils.delete('things')
            .where('name').equal('anonymous').and('additionalType').equal('User');
        console.log(JSON.stringify(query, null, 4));
        return done();
    });

    it('should serialize a select query expression', function(done) {
        let query = QueryUtils
            .select(['name','description','additionalType'])
            .from('things')
            .where('name').equal('anonymous').and('additionalType').equal('User');
        console.log(JSON.stringify(query, null, 4));
        return done();
    });


    it('should serialize an update query expression', function(done) {
        let query = QueryUtils.update('things').set(
        {
            "description":"Anonymous Site User",
            "dateModified": new Date()
        }).where('name').equal('anonymous').and('additionalType').equal('User');
        console.log(JSON.stringify(query, null, 4));
        return done();
    });

    it('should insert an object', function(done) {
        let query = QueryUtils.insert({
            "name":"anonymous",
            "description":"Anonymous User",
            "additionalType":"User",
            "dateCreated": new Date(),
            "dateModified": new Date()
        }).into('things');
        let db = new MongoAdapter(options);
        db.open(function(err) {
            if (err) { return done(err); }
            db.execute(query, null, function(err, result) {
                if (err) { return done(err); }
                assert.ok(result);
                // get data
                db.execute(
                    QueryUtils.select(['name'])
                        .from('things')
                        .where('name')
                        .equal('anonymous'), null, function(err, result) {
                    if (err) {
                        return done(err);
                    }
                    assert.ok(result);
                    return done();
                });

            });
        });
    });

    it('should update an object', function(done) {
        let q = QueryUtils.update('things').set(
            {
                "description":"Anonymous Site User",
                "dateModified": new Date()
            }).where('name').equal('anonymous').and('additionalType').equal('User');

        let db = new MongoAdapter(options);
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
        let q = QueryUtils.delete('things')
            .where('name').equal('anonymous').and('additionalType').equal('User');
        let db = new MongoAdapter(options);
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
