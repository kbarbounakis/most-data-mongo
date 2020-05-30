/**
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import {MongoAdapter} from '@themost/mongo';
import {QueryExpression} from '@themost/query';
import {testConnectionOptionsFromEnv} from "./testUtils";
const testConnectionOptions = testConnectionOptionsFromEnv();

describe('MongoAdapter', ()=> {
    it('should create instance', () => {
        const adapter = new MongoAdapter(testConnectionOptions);
        expect(adapter).toBeTruthy();
    });
    it('should use MongoAdapter.open()', async () => {
        let adapter = new MongoAdapter(testConnectionOptions);
        await adapter.openAsync();
        expect(adapter.rawConnection).toBeTruthy();
        const failedConnectionOptions = Object.assign({}, testConnectionOptions, {
            host: 'unknown'
        });
        let failedAdapter = new MongoAdapter(failedConnectionOptions);
        await expectAsync(failedAdapter.openAsync()).toBeRejected();
    });
    it('should use MongoAdapter.close()', async () => {
        const adapter = new MongoAdapter(testConnectionOptions);
        await expectAsync(adapter.openAsync()).toBeResolved();
        await expectAsync(adapter.closeAsync()).toBeResolved();
        expect(adapter.rawConnection).toBeFalsy();
    });

    it('should use MongoAdapter.execute()', async () => {
        const adapter = new MongoAdapter(testConnectionOptions);
        // insert
        let query = new QueryExpression()
            .insert({
            message: 'Hello world!'
        }).into('messages');
        const lastIdentity = await adapter.executeAsync(query);
        expect(lastIdentity).toBeTruthy();
        expect(lastIdentity._id).toBeTruthy();
        // select
        query = new QueryExpression()
            .select('_id', 'message')
            .where('_id').equal(lastIdentity._id)
            .from('messages');
        let items = await adapter.executeAsync(query);
        expect(items).toBeTruthy();
        expect(items.length).toEqual(1);
        // get item
        const item = items[0];
        // remove item
        query = new QueryExpression()
            .delete('messages').where('_id').equal(item._id);
        await adapter.executeAsync(query);
        // validate remove
        query = new QueryExpression()
            .select('_id', 'message')
            .from('messages').where('_id').equal(item._id);
        items = await adapter.executeAsync(query);
        expect(items).toBeTruthy();
        expect(items.length).toEqual(0);
    });

    it('should use MongoAdapter.executeInTransaction()', async () => {
        const adapter = new MongoAdapter(testConnectionOptions);
        let lastIdentity;
        await adapter.executeInTransactionAsync(async () => {
            let query = new QueryExpression()
                .insert({
                    message: 'Hello world!'
                }).into('messages');
            lastIdentity = await adapter.executeAsync(query);
            expect(lastIdentity).toBeTruthy();
            expect(lastIdentity._id).toBeTruthy();
            // remove item
            query = new QueryExpression()
                .delete('messages').where('_id').equal(lastIdentity._id);
            await adapter.executeAsync(query);
        });

        let query = new QueryExpression()
            .select('_id', 'message')
            .from('messages').where('_id').equal(lastIdentity._id);
        let items = await adapter.executeAsync(query);
        expect(items).toBeTruthy();
        expect(items.length).toEqual(0);

        await expectAsync(adapter.executeInTransactionAsync(async () => {
            let query = new QueryExpression()
                .insert({
                    message: 'Hello world!'
                }).into('messages');
            lastIdentity = await adapter.executeAsync(query);
            throw new Error('Operation cancelled by the user');
        })).toBeRejected();


    });

    it('should use MongoAdapter.selectIdentity()', async () => {
        const adapter = new MongoAdapter(testConnectionOptions);
        let newIdentity = await adapter.selectIdentityAsync('Customers', 'CustomerID');
        expect(newIdentity).toBeTruthy();
        let anotherIdentity = await adapter.selectIdentityAsync('Customers', 'CustomerID');
        expect(anotherIdentity).toBeTruthy();
        expect(anotherIdentity).toBeGreaterThan(newIdentity);

    });

});
