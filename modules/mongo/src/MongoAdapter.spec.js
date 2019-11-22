/**
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import {MongoAdapter} from "./MongoAdapter";

describe('MemoryAdapter', ()=> {
    it('should create instance', () => {
        const adapter = new MongoAdapter({
            "host":"localhost",
            "port":27017,
            "database":"test"
        });
        expect(adapter).toBeTruthy();
    });
    it('should MemoryAdapter.open()', async () => {
        let adapter = new MongoAdapter({
            "host":"localhost",
            "port":27017,
            "database":"test"
        });
        await adapter.openAsync();
        expect(adapter.rawConnection).toBeTruthy();
        let failedAdapter = new MongoAdapter({
            "host":"localhost",
            "port":27018,
            "database":"test"
        });
        await expectAsync(failedAdapter.openAsync()).toBeRejected();
        failedAdapter = new MongoAdapter({
            "host":"unknown",
            "database":"test"
        });
        await expectAsync(failedAdapter.openAsync()).toBeRejected();
    });
    it('should MemoryAdapter.close()', async () => {
        const adapter = new MongoAdapter({
            "host":"localhost",
            "port":27017,
            "database":"test"
        });
        await adapter.openAsync();
        await adapter.closeAsync();
        expect(adapter.rawConnection).toBeFalsy();
    });
});
