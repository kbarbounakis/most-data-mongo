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
        const products = context.model('Products');
        /**
         * @type {*}
         */
        const event = {
            target: {
                "ProductID": 3,
                "ProductName": "Aniseed Syrup",
                "Supplier": 1,
                "Category": 2,
                "Unit": "12 - 550 ml bottles",
                "Price": 10.0
            },
            state: 1,
            model: products
        };
        await MongoDataObjectAssociationListener.prototype.beforeSaveAsync(event);
        expect(event).toBeTruthy();
        expect(event.target.Category).toBeTruthy();
        expect(event.target.Category.$ref).toBe(context.model('Category').sourceAdapter);
        expect(event.target.Supplier).toBeTruthy();
        expect(event.target.Supplier.$ref).toBe(context.model('Supplier').sourceAdapter);
    });
});
