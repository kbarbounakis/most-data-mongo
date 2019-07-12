/**
 * Created by kbarbounakis on 12/10/2016.
 */
const MongoAdapter = require('../../modules/mongo').MongoAdapter;
/**
 * Important Note: Use ./../config/app.json to set adapters for MongoDB
 */
const conf = require('./../config/app.test.json');
const QueryUtils = require('@themost/query').QueryUtils;
const QueryExpression = require('@themost/query').QueryExpression;
const _ = require('lodash');
const assert = require('assert');

describe('mongo connection tests', function() {

    const options = conf.adapters[0].options;

    it('should serialize a select query expression', function(done) {
        const q = QueryUtils.query('things')
            .select('*')
            .where('familyName').equal('Barnett').and('additionalType').equal('Person');
        console.log(JSON.stringify(q, null, 4));
        return done();
    });

    it('should serialize a select query expression with order by', function(done) {
        const q = QueryUtils.query('things')
            .select('*')
            .orderBy('familyName').thenBy('givenName');
        console.log(JSON.stringify(q, null, 4));
        return done();
    });

    it('should use where with logical expression #1', function(done) {
        const q = QueryUtils.query('things')
            .select('*')
            .where('familyName').equal('Barnett').and('additionalType').equal('Person');
        const db = new MongoAdapter(options);
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

    it('should use where with logical expression #2', function(done) {
        const q = QueryUtils.query('things')
            .select('*')
            .where('familyName').equal('Barnett').or('familyName').equal('Wilkinson');
        const db = new MongoAdapter(options);
        db.open(function(err) {
            if (err) { return done(err); }
            db.execute(q, null, function(err, result) {
                if (err) { return done(err); }
                assert.strictEqual(result.length, 2, 'Results');
                console.log(JSON.stringify(result, null, 4));
                return done();
            });
        });
    });

    it('should use select expression with attribute selection', function(done) {
        const q = QueryUtils.query('things')
            .select(['givenName', 'familyName', 'jobTitle'])
            .take(5);
        const db = new MongoAdapter(options);
        db.execute(q, null, function(err, result) {
            if (err) { return done(err); }
            assert.strictEqual(result.length, 5, 'Results');
            assert.strictEqual(result[0].hasOwnProperty('address'), true, 'address exists');
            console.log(JSON.stringify(result, null, 4));
            return done();
        });
    });

    it('should use select expression with ascending order', function(done) {
        const q = QueryUtils.query('things')
            .select(['givenName', 'familyName', 'jobTitle'])
            .take(5).orderBy('familyName');
        const db = new MongoAdapter(options);
        db.execute(q, null, function(err, result) {
            if (err) { return done(err); }
            assert.strictEqual(result.length, 5, 'Results');
            assert.strictEqual(result[0].hasOwnProperty('address'), false, 'address exists');
            console.log(JSON.stringify(result, null, 4));
            return done();
        });
    });

    it('should use select expression with descending order', function(done) {
        const q = QueryUtils.query('things')
            .select(['givenName', 'familyName', 'jobTitle'])
            .take(5).orderByDescending('familyName');
        const db = new MongoAdapter(options);
        db.execute(q, null, function(err, result) {
            if (err) { return done(err); }
            assert.strictEqual(result.length, 5, 'Results');
            assert.strictEqual(result[0].hasOwnProperty('address'), true, 'address exists');
            console.log(JSON.stringify(result, null, 4));
            return done();
        });
    });

    it('should use select query with contains expression', function(done) {
        const q = QueryUtils.query('things')
            .select(['givenName', 'familyName', 'jobTitle'])
            .where('familyName').contains('Wil').equal(true);
        const db = new MongoAdapter(options);
        console.log(JSON.stringify(q, null, 4));
        db.execute(q, null, function(err, result) {
            if (err) { return done(err); }
            assert.strictEqual(result[0].hasOwnProperty('address'), true, 'address exists');
            console.log(JSON.stringify(result, null, 4));
            return done();
        });
    });

    it('should use select expression with ends with expression', function(done) {
        const q = QueryUtils.query('things')
            .select(['givenName', 'familyName', 'jobTitle'])
            .where('familyName').endsWith('nson').equal(true);
        const db = new MongoAdapter(options);
        console.log(JSON.stringify(q, null, 4));
        db.execute(q, null, function(err, result) {
            if (err) { return done(err); }
            assert.strictEqual(result[0].hasOwnProperty('address'), true, 'address exists');
            console.log(JSON.stringify(result, null, 4));
            return done();
        });
    });

    it('should use select expression with equal expression', function(done) {
        const q = QueryUtils.query('things')
            .select(['givenName', 'familyName', 'jobTitle'])
            .where('familyName').equal('Wilkinson');
        const db = new MongoAdapter(options);
        db.execute(q, null, function(err, result) {
            if (err) { return done(err); }
            _.forEach(result, function(x) {
                assert.strictEqual(x['familyName'], 'Wilkinson', 'Family Name');
            });
            console.log(JSON.stringify(result, null, 4));
            return done();
        });
    });

    it('should use select expression with or expression', function(done) {
        const q = QueryUtils.query('things')
            .select(['givenName', 'familyName', 'jobTitle'])
            .where('familyName').equal('Wilkinson')
            .or('familyName').equal('Sanders');
        const db = new MongoAdapter(options);
        console.log(JSON.stringify(q, null, 4));
        db.execute(q, null, function(err, result) {
            if (err) { return done(err); }
            _.forEach(result, function(x) {
                assert.ok((x['familyName'] === 'Wilkinson') || (x['familyName'] === 'Sanders'), 'Family Name');
            });
            console.log(JSON.stringify(result, null, 4));
            return done();
        });
    });

    it("should use greater than expression", function (done) {
        const q = new QueryExpression();
        q.from("things").select("*")
            .where("price").greaterThan(600).and('additionalType').equal('Product')
            .orderBy("price");
        const db = new MongoAdapter(options);
        console.log(JSON.stringify(q, null, 4));
        db.execute(q, null, function(err, result) {
            if (err) { return done(err); }
            _.forEach(result, function(x) {
                assert.ok(x['price'] > 600, 'price>600');
            });
            console.log(JSON.stringify(result, null, 4));
            return done();
        });
    });

    it("should use lower than expression", function (done) {
        const q = new QueryExpression();
        q.from("things").select("*")
            .where("price").lowerThan(600)
            .and('category').equal('Desktops')
            .and('additionalType').equal('Product')
            .orderBy("price").take(5);
        const db = new MongoAdapter(options);
        console.log(JSON.stringify(q, null, 4));
        db.execute(q, null, function(err, result) {
            if (err) { return done(err); }
            assert.ok(result.length <= 5, 'results<=5');
            _.forEach(result, function(x) {
                assert.ok(x['price'] < 600, 'price<600');
            });
            console.log(JSON.stringify(result, null, 4));
            return done();
        });
    });

    it("should use lower than or equal expression", function (done) {
        const q = new QueryExpression();
        q.from("things").select("*")
            .where("price").lowerOrEqual(476.49)
            .and('category').equal('Desktops')
            .and('additionalType').equal('Product')
            .orderBy("price").take(5);
        const db = new MongoAdapter(options);
        console.log(JSON.stringify(q, null, 4));
        db.execute(q, null, function(err, result) {
            if (err) { return done(err); }
            assert.ok(result.length <= 5, 'results<=5');
            _.forEach(result, function(x) {
                assert.ok(x['price'] < 600, 'price<600');
            });
            console.log(JSON.stringify(result, null, 4));
            return done();
        });
    });

    it("should use greater than or equal expression", function (done) {
        const q = new QueryExpression();
        q.from("things").select("*")
            .where("price").greaterOrEqual(476.49)
            .and('category').equal('Desktops')
            .and('additionalType').equal('Product')
            .orderBy("price").take(5);
        const db = new MongoAdapter(options);
        console.log(JSON.stringify(q, null, 4));
        db.execute(q, null, function(err, result) {
            if (err) { return done(err); }
            assert.ok(result.length <= 5, 'results<=5');
            _.forEach(result, function(x) {
                assert.ok(x['price'] >=476.49, 'price>=476.49');
            });
            console.log(JSON.stringify(result, null, 4));
            return done();
        });
    });

    it("should use between expression", function (done) {
        const q = new QueryExpression();
        q.from("things").select("*")
            .where("price").between(476.49, 665.41)
            .and('category').equal('Desktops')
            .and('additionalType').equal('Product')
            .orderBy("price").take(5);
        const db = new MongoAdapter(options);
        console.log(JSON.stringify(q, null, 4));
        db.execute(q, null, function(err, result) {
            if (err) { return done(err); }
            assert.ok(result.length <= 5, 'results<=5');
            _.forEach(result, function(x) {
                assert.ok((x['price'] >=476.49) && (x['price'] <=665.41) , 'price>=476.49 and price<=665.41');
            });
            console.log(JSON.stringify(result, null, 4));
            return done();
        });
    });

    it("should use in expression", function (done) {
        const q = new QueryExpression();
        q.from("things").select("*")
            .and('category').in(['Desktops','Laptops'])
            .and('additionalType').equal('Product')
            .orderBy("price").take(5);
        const db = new MongoAdapter(options);
        console.log(JSON.stringify(q, null, 4));
        db.execute(q, null, function(err, result) {
            if (err) { return done(err); }
            assert.ok(result.length <= 5, 'results<=5');
            _.forEach(result, function(x) {
                assert.ok(['Desktops','Laptops'].indexOf(x.category)>=0 , "category eq 'Laptops' or category eq 'Desktops'");
            });
            console.log(JSON.stringify(result, null, 4));
            return done();
        });
    });

    it("should use not in expression", function (done) {
        const q = new QueryExpression();
        q.from("things").select("*")
            .and('category').notIn(['Desktops','Laptops'])
            .and('additionalType').equal('Product')
            .orderBy("price").take(5);
        const db = new MongoAdapter(options);
        console.log(JSON.stringify(q, null, 4));
        db.execute(q, null, function(err, result) {
            if (err) { return done(err); }
            assert.ok(result.length <= 5, 'results<=5');
            _.forEach(result, function(x) {
                assert.ok(['Desktops','Laptops'].indexOf(x.category)<0 , "category ne 'Laptops' or category ne 'Desktops'");
            });
            console.log(JSON.stringify(result, null, 4));
            return done();
        });
    });


});
