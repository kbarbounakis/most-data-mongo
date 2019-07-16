/**
 * Created by kbarbounakis on 12/10/2016.
 */
const MongoAdapter = require('../../modules/mongo').MongoAdapter;
/**
 * Important Note: Use ./../config/app.json to set adapters for MongoDB
 */
const conf = require('./../config/app.test.json');
const QueryExpression = require('@themost/query').QueryExpression;
const assert = require('assert');

describe('mongo connection tests', function() {

    const options = conf.adapters.find(function (x) {
        return x.name === 'test'
    }).options;

    it("should use add expression", function (done) {
        let q = new QueryExpression();
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

        const db = new MongoAdapter(options);
        db.execute(q, null, function(err, result) {
            if (err) { return done(err); }
            assert.ok(result.length <= 5, 'results<=5');
            result.forEach(function(x) {
                assert.ok(x.priceAdded<400 , "priceAdded le 400");
            });
            console.log(JSON.stringify(result, null, 4));
            return done();
        });
    });

});
