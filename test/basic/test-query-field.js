const MongoFormatter = require('./../../index').MongoFormatter;
const MongoAdapter = require('./../../index').MongoAdapter;
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
        const result = formatter.format(new QueryField().max('field1').as('field'), '%f');
        assert.isObject(result);
        assert.property(result, 'field');
        assert.equal(result.field, '$field1');
    });
});
