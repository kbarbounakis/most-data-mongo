/**
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import {AfterSaveEventListener, BeforeSaveEventListener, DataEventArgs} from "@themost/data";

export declare class MongoDataObjectAssociationListener implements BeforeSaveEventListener, AfterSaveEventListener {
    afterSave(event: DataEventArgs, callback: (err?: Error) => void): void;
    afterSaveAsync(event: DataEventArgs): Promise<void>;
    beforeSave(event: DataEventArgs, callback: (err?: Error) => void): void;
    beforeSaveAsync(event: DataEventArgs): Promise<void>;
}
