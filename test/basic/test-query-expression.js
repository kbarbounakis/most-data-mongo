const MongoAdapter = require('../../modules/mongo').MongoAdapter;
/**
 * IMPORTANT NOTE: Create a copy of app.json as app.test.json and use it to set adapters for MongoDB databases
 */
const conf = require('./../config/app.test.json');
const QueryUtils = require('@themost/query').QueryUtils;
const QueryField = require('@themost/query').QueryField;
const assert = require('chai').assert;
describe('test mongoDB query expression', function() {
    /**
     * @type MongoAdapter
     */
    let db;
    before((done) => {
        let adapter = conf.adapters.find( x => {
            return x.name === 'test'
        });
        db = new MongoAdapter(adapter.options);
        return done();
    });
    it('should QueryExpression.equal()', (done) => {
        let query = QueryUtils.query('things').select('*').where('additionalType').equal('Product');
        db.execute(query, null, (err, result) => {
           if (err) {
               return done(err);
           }
           assert.isArray(result);
            assert.isAtLeast(result.length, 1);
           result.forEach( item => {
               assert.equal(item.additionalType, 'Product');
           });
           return done();
        });
    });
    it('should QueryExpression.or()', (done) => {
        let query = QueryUtils.query('things').select('*')
            .where('givenName').equal('Chelsea')
            .or('givenName').equal('Megan');
        db.execute(query, null, (err, result) => {
            if (err) {
                return done(err);
            }
            assert.isArray(result);
            assert.isAtLeast(result.length, 1);
            result.forEach( item => {
                assert.oneOf(item.givenName, ['Chelsea', 'Megan']);
            });
            return done();
        });
    });
    it('should QueryExpression.and()', (done) => {
        let query = QueryUtils.query('things').select('*')
            .where('givenName').equal('Chelsea')
            .and('gender').equal('F');
        db.execute(query, null, (err, result) => {
            if (err) {
                return done(err);
            }
            assert.isArray(result);
            assert.equal(result.length, 1);
            assert.equal(result[0].givenName, 'Chelsea');
            assert.equal(result[0].gender, 'F');
            return done();
        });
    });
    it('should QueryExpression.notEqual()', (done) => {
        let query = QueryUtils.query('things').select('*').where('additionalType').notEqual('Product');
        db.execute(query, null, (err, result) => {
            if (err) {
                return done(err);
            }
            assert.isArray(result);
            assert.isAtLeast(result.length, 1);
            result.forEach( item => {
                assert.notEqual(item.additionalType, 'Product');
            });
            return done();
        });
    });
    it('should QueryExpression.startsWith()', (done) => {
        let query = QueryUtils.query('things').select('*')
            .where('additionalType').equal('Person')
            .and('givenName').startsWith('B');
        console.log('INFO', 'QUERY', JSON.stringify(query, null, 4));
        db.execute(query, null, (err, result) => {
            if (err) {
                return done(err);
            }
            assert.isArray(result);
            assert.isAtLeast(result.length, 1);
            result.forEach( item => {
                assert.equal(item.additionalType, 'Person');
                assert.ok(item.givenName.indexOf('B') === 0)
            });
            return done();
        });
    });
    it('should QueryExpression.endsWith()', (done) => {
        let query = QueryUtils.query('things').select('*')
            .where('additionalType').equal('Person')
            .and('familyName').endsWith('in');
        console.log('INFO', 'QUERY', JSON.stringify(query, null, 4));
        db.execute(query, null, (err, result) => {
            if (err) {
                return done(err);
            }
            assert.isArray(result);
            assert.isAtLeast(result.length, 1);
            result.forEach( item => {
                assert.equal(item.additionalType, 'Person');
                assert.ok(item.familyName.indexOf('in') > 0)
            });
            return done();
        });
    });
    it('should QueryExpression.greaterThan()', (done) => {
        let query = QueryUtils.query('things').select('*')
            .where('additionalType').equal('Product')
            .and('price').greaterThan(1000);
        console.log('INFO', 'QUERY', JSON.stringify(query, null, 4));
        db.execute(query, null, (err, result) => {
            if (err) {
                return done(err);
            }
            assert.isArray(result);
            assert.isAtLeast(result.length, 1);
            result.forEach( item => {
                assert.equal(item.additionalType, 'Product');
                assert.isAbove(item.price, 1000);
            });
            return done();
        });
    });
    it('should QueryExpression.greaterOrEqual()', (done) => {
        let query = QueryUtils.query('things').select('*')
            .where('additionalType').equal('Product')
            .and('price').greaterOrEqual(1104.46);
        console.log('INFO', 'QUERY', JSON.stringify(query, null, 4));
        db.execute(query, null, (err, result) => {
            if (err) {
                return done(err);
            }
            assert.isArray(result);
            assert.isAtLeast(result.length, 1);
            result.forEach( item => {
                assert.equal(item.additionalType, 'Product');
                assert.isAtLeast(item.price, 1104.46);
            });
            return done();
        });
    });
    it('should QueryExpression.lowerThan()', (done) => {
        let query = QueryUtils.query('things').select('*')
            .where('additionalType').equal('Product')
            .and('price').lowerThan(1104.46);
        console.log('INFO', 'QUERY', JSON.stringify(query, null, 4));
        db.execute(query, null, (err, result) => {
            if (err) {
                return done(err);
            }
            assert.isArray(result);
            assert.isAtLeast(result.length, 1);
            result.forEach( item => {
                assert.equal(item.additionalType, 'Product');
                assert.isBelow(item.price, 1104.46);
            });
            return done();
        });
    });
    it('should QueryExpression.lowerOrEqual()', (done) => {
        let query = QueryUtils.query('things').select('*')
            .where('additionalType').equal('Product')
            .and('price').lowerOrEqual(1104.46);
        console.log('INFO', 'QUERY', JSON.stringify(query, null, 4));
        db.execute(query, null, (err, result) => {
            if (err) {
                return done(err);
            }
            assert.isArray(result);
            assert.isAtLeast(result.length, 1);
            result.forEach( item => {
                assert.equal(item.additionalType, 'Product');
                assert.isAtMost(item.price, 1104.46);
            });
            return done();
        });
    });
    it('should QueryExpression.between()', (done) => {
        let query = QueryUtils.query('things').select('*')
            .where('additionalType').equal('Product')
            .and('price').between(1040.32, 1104.46);
        console.log('INFO', 'QUERY', JSON.stringify(query, null, 4));
        db.execute(query, null, (err, result) => {
            if (err) {
                return done(err);
            }
            assert.isArray(result);
            assert.isAtLeast(result.length, 1);
            result.forEach( item => {
                assert.equal(item.additionalType, 'Product');
                assert.isAtMost(item.price, 1104.46);
                assert.isAtLeast(item.price, 1040.32);
            });
            return done();
        });
    });

    it('should QueryExpression.select()', (done) => {
        let query = QueryUtils.query('things').select('name', 'releaseDate', 'additionalType')
            .where('additionalType').equal('Product')
            .orderBy('name')
            .take(5);
        console.log('INFO', 'QUERY', JSON.stringify(query, null, 4));
        db.execute(query, null, (err, result) => {
            if (err) {
                return done(err);
            }
            assert.isArray(result);
            assert.isAtLeast(result.length, 1);
            console.log('INFO', 'QUERY', JSON.stringify(result, null, 4));
            result.forEach( item => {
                assert.equal(item.additionalType, 'Product');
            });
            return done();
        });
    });

    it('should QueryExpression.select(year())', (done) => {

        let query = QueryUtils.query('things').select(
            'name',
            {
                releaseDateYear: { $year: "$releaseDate" }
            },
            'additionalType')
            .where('additionalType').equal('Product')
            .and('releaseDateYear').equal(2014)
            .orderBy('name')
            .take(5);
        console.log('INFO', 'QUERY', JSON.stringify(query, null, 4));
        db.execute(query, null, (err, result) => {
            if (err) {
                return done(err);
            }
            assert.isArray(result);
            assert.isAtLeast(result.length, 1);
            console.log('INFO', 'QUERY', JSON.stringify(result, null, 4));
            result.forEach( item => {
                assert.equal(item.additionalType, 'Product');
            });
            return done();
        });
    });

    it('should QueryExpression.select(max(attribute))', (done) => {

        let query = QueryUtils.query('things').select(
            new QueryField().max('price')).as('maxPrice')
            .where('additionalType').equal('Product');
        console.log('INFO', 'QUERY', JSON.stringify(query, null, 4));
        db.execute(query, null, (err, result) => {
            if (err) {
                return done(err);
            }
            assert.isArray(result);
            assert.isAtLeast(result.length, 1);
            console.log('INFO', 'QUERY', JSON.stringify(result, null, 4));
            result.forEach( item => {
                assert.equal(item.additionalType, 'Product');
            });
            return done();
        });
    });

});
