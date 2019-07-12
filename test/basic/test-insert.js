/**
 * Created by kbarbounakis on 12/10/2016.
 */
const MongoAdapter = require('../../modules/mongo').MongoAdapter;
/**
 * IMPORTANT NOTE: Create a copy of app.json as app.test.json and use it to set adapters for MongoDB databases
 */
const conf = require('./../config/app.test.json');
const randoms = require('./randoms');
const QueryUtils = require('@themost/query').QueryUtils;
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const LangUtils = require('@themost/common').LangUtils;

describe('mongo connection tests', function() {

    const options = conf.adapters.find(function (x) {
        return x.name === 'test'
    }).options;

    it('should serialize an insert query expression', function(done) {
        const q = QueryUtils.insert(randoms.person()).into('things');
        console.log(JSON.stringify(q, null, 4));
        assert.ok(q['$insert']['things']);
        return done();
    });



    it('should insert persons', function(done) {

        let str = fs.readFileSync(path.resolve(__dirname, './person-seed.json'), 'utf-8');
        const newItems = JSON.parse(str, (key, value) => {
            if (LangUtils.isDate(value)) {
                return new Date(value);
            }
            return value;
        });
        const q = QueryUtils.insert(newItems).into('things');
        const db = new MongoAdapter(options);
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

    it('should insert products', function(done) {

        let str = fs.readFileSync(path.resolve(__dirname, './product-seed.json'), 'utf-8');
        const newItems = JSON.parse(str, (key, value) => {
            if (LangUtils.isDate(value)) {
                return new Date(value);
            }
            return value;
        });
        const q = QueryUtils.insert(newItems).into('things');
        const db = new MongoAdapter(options);
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
