/**
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import {
    AfterRemoveEventListener,
    AfterSaveEventListener,
    BeforeRemoveEventListener,
    BeforeSaveEventListener,
    DataEventArgs
} from "@themost/data";

export declare class MongoDataNoopListener implements
    BeforeSaveEventListener, AfterSaveEventListener, BeforeRemoveEventListener, AfterRemoveEventListener
{
    afterSave(event: DataEventArgs, callback: (err?: Error) => void): void;
    beforeSave(event: DataEventArgs, callback: (err?: Error) => void): void;
    afterRemove(event: DataEventArgs, callback: (err?: Error) => void): void;
    beforeRemove(event: DataEventArgs, callback: (err?: Error) => void): void;
}
