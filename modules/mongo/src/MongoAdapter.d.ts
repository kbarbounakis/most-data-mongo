/**
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
/**
 *
 */
declare interface MongoAdapterExecuteCallback {
    ( error?: Error, result?: any ) : void;
}
declare interface MongoTransactionFunctionCallback {
    ( error?: Error ) : void;
}

declare interface MongoTransactionFunction {
    () : Promise<any>;
}

declare interface MongoAdapterOptions {
    /**
     * Gets or sets a string which represents mongoDB server address
     */
    host?: string;
    /**
     * Gets or sets a number which represents mongoDB server port
     */
    port?: string;
    /**
     * Gets or sets a string which represents the target mongoDB  database
     */
    database: string;
    /**
     * Gets or sets a string which represents a mongoDB authentication database that is going to used while connecting
     */
    authenticationDatabase?: string;
    /**
     * Gets or sets a string which represents a user name that is going to used while connecting
     */
    user?: string;
    /**
     * Gets or sets a string which represents user password that is going to used while connecting
     */
    password: string;
    /**
     * Gets or sets an object which contains extra options for mongoDB connection
     */
    options?: any;
}

/**
 * @class
 */
export declare class MongoAdapter {
    constructor(options: any);
    open(callback: MongoAdapterExecuteCallback): void;
    openAsync(): Promise<void>;
    close(callback: MongoAdapterExecuteCallback): void;
    closeAsync(): Promise<void>;
    prepare(sql: string, values?: Array<any>): string;
    executeInTransaction(transactionFunc: MongoTransactionFunctionCallback, callback: MongoAdapterExecuteCallback): void;
    executeInTransactionAsync(transactionFunc: MongoTransactionFunction): Promise<void>;
    execute(query: any, values: Array<any>, callback: MongoAdapterExecuteCallback): void;
    selectIdentity(entity: string, attribute: string, callback: MongoAdapterExecuteCallback): void;
    selectIdentity(entity: string, attribute: string): Promise<any>;
    executeAsync(query: any, values?: Array<any>): Promise<any>;
    migrate(migration: any, callback: MongoAdapterExecuteCallback): void;
    migrateAsync(migration: any): Promise<void>;
    createView(name: string, query: any, callback: MongoAdapterExecuteCallback): void;
    createViewAsync(name: string, query: any): Promise<void>;
}

export declare function createInstance(options: any): MongoAdapter;
