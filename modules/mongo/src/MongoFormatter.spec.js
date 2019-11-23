import {DataConfiguration, DataConfigurationStrategy, DefaultDataContext} from '@themost/data';
import {promisify} from 'es6-promisify';
import path from 'path';
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
        // let item = await context.model('Categories').where('CategoryID').equal(1).silent().getItem();
        // expect(item).toBeTruthy();
    });
});
