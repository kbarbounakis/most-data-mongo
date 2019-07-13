const MongoFormatter = require('../../modules/mongo').MongoFormatter;
const MongoAdapter = require('../../modules/mongo').MongoAdapter;
const QueryField = require('@themost/query').QueryField;
const assert = require('chai').assert;

describe('test query field format', function () {
    it('should format string', () => {
        const formatter = new MongoFormatter();
        const result = formatter.format('field1', '%f');
        assert.isObject(result);
        assert.property(result, 'field1');
    });
    it('should format QueryField instance', () => {
        const formatter = new MongoFormatter();
        const result = formatter.format(new QueryField('field1'), '%f');
        assert.isObject(result);
        assert.property(result, 'field1');
    });
    it('should format QueryField with alias', () => {
        const formatter = new MongoFormatter();
        const result = formatter.format(new QueryField('field1').as('field'), '%f');
        assert.isObject(result);
        assert.property(result, 'field');
        assert.equal(result.field, '$field1');
    });

    it('should format QueryField with max', () => {
        const formatter = new MongoFormatter();
        const result = formatter.formatFieldEx(new QueryField().max('field1').as('field'), '%f');
        // expected { "field": { "$max": "field1" } }
        assert.isObject(result);
        assert.property(result, 'field');
        assert.property(result.field, '$max');
        assert.equal(result.field.$max, '$field1');
    });

    it('should format QueryField with min', () => {
        const formatter = new MongoFormatter();
        const result = formatter.formatFieldEx(new QueryField().min('price').as('minPrice'), '%f');
        // expected { "field": { "$min": "field1" } }
        assert.isObject(result);
        assert.property(result, 'minPrice');
        assert.property(result['minPrice'], '$min');
        assert.equal(result['minPrice'].$min, 'price');
    });

    it('should format QueryField with function', () => {
        const formatter = new MongoFormatter();
        const result = formatter.formatFieldEx(new QueryField('year(releaseDate)').as('releaseDateYear'), '%f');
        assert.isObject(result);
    });

});
