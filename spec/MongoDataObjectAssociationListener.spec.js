import {DefaultDataContext} from '@themost/data';
import {promisify} from 'es6-promisify';
const debug = require('debug')('themost-framework:mongo');
import {setTestConfiguration} from "./testUtils";
import { MongoDataObjectAssociationListener } from "../modules/mongo/src/listeners/MongoDataObjectAssociationListener";

fdescribe('Data Associations', () => {
    /**
     * @type DefaultDataContext
     */
    let context;
    beforeAll(() => {
        setTestConfiguration();
    });
    beforeEach(() => {
        // create context
        // noinspection JSValidateTypes
        context = new DefaultDataContext();
    });
    afterEach(async () => {
        // finalize context
        if (context) {
            await promisify(context.finalize.bind(context))();
        }
    });
    it('should use MongoDataObjectAssociationListener.beforeSave()',async () => {
        const product = await context.model('Products')
            .where('ProductID')
            .equal(2)
            .getItem();
        await context.model('Products').silent().save(product);
        expect(product).toBeTruthy();
    });
});
