/**
 * Created by kbarbounakis on 12/10/2016.
 */

var MongoAdapter = require('./../../index').MongoAdapter,
    MongoFormatter = require('./../../index').MongoFormatter,
    /**
     * Important Note: Use ./../config/app.json to set adapters for MongoDB
     */
     conf = require('./../config/app.test.json'),
    randoms = require('./randoms'),
    qry = require('most-query'),
    _ = require('lodash'),
    assert = require('assert');

describe('mongo connection tests', function() {

    var options = _.find(conf.adapters, function(x) {
        return x.name === 'test'
    }).options;

    it("should use add expression", function (done) {
        var q = new qry.classes.QueryExpression();
        q.from("things").select([ "name", "price", "additionalType", "category" ])
            .where('price').add(50).lowerOrEqual(400)
            .and('additionalType').equal('Product')
            .orderBy("price").take(5);

        console.log(JSON.stringify(q, null, 4));

        q = {
            "$select": {
                "things": [
                    { "productName":"$name" }, "price", "additionalType", "category", { "priceAdded": { $add:["$price", 50] } }
                ]
            },
            "$order": [
                {
                    "$asc": "price"
                }
            ],
            "$where": {
                "$and": [
                    { "priceAdded": { "$lte": 400 } },
                    { "category": "Desktops" },
                    { "additionalType": "Product" }
                ]
            },
            "$take": 5
        };

        var db = new MongoAdapter(options);
        db.execute(q, null, function(err, result) {
            if (err) { return done(err); }
            assert.ok(result.length <= 5, 'results<=5');
            _.forEach(result, function(x) {
                assert.ok(x.priceAdded<400 , "priceAdded le 400");
            });
            console.log(JSON.stringify(result, null, 4));
            return done();
        });
    });

});