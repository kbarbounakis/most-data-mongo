import {DataConfiguration, DataConfigurationStrategy, DefaultDataContext} from '@themost/data';
import {promisify} from 'es6-promisify';
import path from 'path';
import {MongoFormatter} from "./MongoFormatter";
const debug = require('debug')('themost-framework:mongo');
describe('MongoFormatter', () => {
    /**
     * @type {DataConfiguration}
     */
    let configuration;
    /**
     * @type NamedDataContext
     */
    let context;
    beforeAll(() => {
        configuration = new DataConfiguration(path.resolve(__dirname, 'test/config'));
        configuration.setSourceAt('adapterTypes', [
            {
                "name": "MongoDB Data Adapter",
                "invariantName": "mongo",
                "type": path.resolve("./modules/mongo/src/MongoAdapter")
            }
        ]);
        configuration.setSourceAt('adapters', [
            {
                "name": "mongo-db",
                "invariantName": "mongo",
                "default": true,
                "options": {
                    "host":"localhost",
                    "port":27017,
                    "database":"test"
                }
            }
        ]);
        // reset data configuration strategy
        configuration.useStrategy(DataConfigurationStrategy, DataConfigurationStrategy);
        // set current configuration
        DataConfiguration.setCurrent(configuration);
    });
    beforeEach(() => {
        // create context
        context = new DefaultDataContext();
    });
    afterEach(async () => {
        // finalize context
        if (context) {
            await promisify(context.finalize.bind(context))();
        }
    });
    it('should use MongoFormatter.formatSelect()',async () => {
        debug(`context.model('Categories').getItems()`);
        let items = await context.model('Categories').silent().getItems();
        expect(items).toBeTruthy();
        expect(items.length).toBeTruthy();
    });
    it('should use MongoFormatter.formatWhere()',async () => {
        let item = await context.model('Categories').where('CategoryID').equal(1).silent().getItem();
        expect(item).toBeTruthy();
    });
    it('should use DataQueryable.equal()',async () => {
        const query = await context.model('Categories').where('CategoryID').equal(1).query;
        const formatter = new MongoFormatter({
            collectionName: 'Categories'
        });
        let expr = formatter.formatWhere(query.$where);
        expect(expr).toEqual({
            $eq: [
                '$CategoryID',
                1
            ]
        });
    });
    it('should use DataQueryable.greaterThan()',async () => {
        const query = await context.model('Categories').where('CategoryID').greaterThan(1).query;
        const formatter = new MongoFormatter({
            collectionName: 'Categories'
        });
        let expr = formatter.formatWhere(query.$where);
        expect(expr).toEqual({
            $gt: [
                '$CategoryID',
                1
            ]
        });
    });
    it('should use DataQueryable.getYear()',async () => {
        let query = context.model('Employees').where('BirthDate').getYear().equal(1968).query;
        let formatter = new MongoFormatter({
            collectionName: 'Employees'
        });
        let expr = formatter.formatWhere(query.$where);
        expect(expr).toEqual({
            $eq: [
                {
                    $year:{
                        date: '$BirthDate',
                        timezone: new Date().toTimeString().match(/(\+\d+)/)[0]
                    }
                },
                1968
            ]
        });

        let items = await context.model('Employees').where('BirthDate').getYear().equal(1968)
            .silent().getItems();
        expect(items).toBeTruthy();
        expect(items.filter( x => {
            // noinspection JSUnresolvedVariable
            return x.BirthDate.getFullYear() !== 1968;
        }).length).toEqual(0);

    });

    it('should use DataQueryable.getYear().greaterThan()',async () => {

        let query = context.model('Employees').where('BirthDate').getYear().greaterThan(1968).query;
        let formatter = new MongoFormatter({
            collectionName: 'Employees'
        });
        let expr = formatter.formatWhere(query.$where);
        expect(expr).toEqual({
            $gt: [
                {
                    $year: {
                        date: '$BirthDate',
                        timezone: new Date().toTimeString().match(/(\+\d+)/)[0]
                    }
                },
                1968
            ]
        });

        let items = await context.model('Employees').where('BirthDate').getYear().greaterThan(1968)
            .silent().getItems();
        expect(items).toBeTruthy();
        expect(items.filter( x => {
            // noinspection JSUnresolvedVariable
            return x.BirthDate.getFullYear() <= 1968;
        }).length).toEqual(0);

    });

    it('should use DataQueryable.getMonth()',async () => {
        let query = context.model('Employees').where('BirthDate').getMonth().equal(12).query;
        let formatter = new MongoFormatter({
            collectionName: 'Employees'
        });
        let expr = formatter.formatWhere(query.$where);
        expect(expr).toEqual({
            $eq: [
                {
                    $month: {
                        date: '$BirthDate',
                        timezone: new Date().toTimeString().match(/(\+\d+)/)[0]
                    }
                },
                12
            ]
        });

        let items = await context.model('Employees').where('BirthDate').getMonth().equal(12)
            .silent().getItems();
        expect(items).toBeTruthy();
        items.forEach( x => {
           // noinspection JSUnresolvedVariable
            expect(x.BirthDate.getMonth()).toEqual(11);
        });
    });

    it('should use DataQueryable.getDay()',async () => {
        let query = context.model('Employees').where('BirthDate').getDay().equal(8).query;
        let formatter = new MongoFormatter({
            collectionName: 'Employees'
        });
        let expr = formatter.formatWhere(query.$where);
        expect(expr).toEqual({
            $eq: [
                {
                    $dayOfMonth: {
                        date: '$BirthDate',
                        timezone: new Date().toTimeString().match(/(\+\d+)/)[0]
                    }
                },
                8
            ]
        });

        let items = await context.model('Employees').where('BirthDate').getDay().equal(8)
            .silent().getItems();
        expect(items).toBeTruthy();
        items.forEach( x=> {
            // noinspection JSUnresolvedVariable
            expect(x.BirthDate.getDate()).toEqual(8);
        });
    });
});
