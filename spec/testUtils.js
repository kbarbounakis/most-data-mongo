import {DataConfiguration, DataConfigurationStrategy, DefaultDataContext} from "@themost/data";
import path from "path";
import {DataObjectAssociationListener} from "@themost/data/data-associations";
import {DataNestedObjectListener} from '@themost/data/data-nested-object-listener';
import {DataValidatorListener} from '@themost/data/data-validator';
import {DataPermissionEventListener} from '@themost/data/data-permission';
import {MongoDataObjectAssociationListener, MongoDataNoopListener, MongoDataModel} from "../modules/mongo/src";

export function testConnectionOptionsFromEnv() {
    const connectionOptions = {
        host: process.env.DB_HOST || 'localhost',
        port:process.env.DB_PORT || 27017,
        database: process.env.DB || 'test'
    };
    if (process.env.DB_USER) {
        Object.assign(connectionOptions, {
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });
    }
    if (process.env.DB_AUTH) {
        Object.assign(connectionOptions, {
            authenticationDatabase: process.env.DB_AUTH
        });
    }
    return connectionOptions;
}

export function setTestConfiguration() {
    let configuration = new DataConfiguration(path.resolve(__dirname, 'config'));
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
            "options": testConnectionOptionsFromEnv()
        }
    ]);
    // reset data configuration strategy
    configuration.useStrategy(DataConfigurationStrategy, DataConfigurationStrategy);
    // set current configuration
    DataConfiguration.setCurrent(configuration);
    Object.assign(DefaultDataContext.prototype, {
        model: function(name) {
            const definition = this.getConfiguration().getStrategy(DataConfigurationStrategy).model(name);
            if (definition == null) {
                return null;
            }
            const res = new MongoDataModel(definition);
            res.context = this;
            return res;
        }
    });
    // override listeners
    Object.assign(DataObjectAssociationListener.prototype, {
        beforeSave: MongoDataObjectAssociationListener.prototype.beforeSave,
        afterSave: MongoDataObjectAssociationListener.prototype.afterSave
    });
    Object.assign(DataValidatorListener.prototype, {
        beforeSave: MongoDataNoopListener.prototype.beforeSave
    });
    Object.assign(DataNestedObjectListener.prototype, {
        beforeSave: MongoDataNoopListener.prototype.beforeSave,
        afterSave: MongoDataNoopListener.prototype.afterSave
    });
    Object.assign(DataPermissionEventListener.prototype, {
        beforeSave: MongoDataNoopListener.prototype.beforeSave,
        beforeRemove: MongoDataNoopListener.prototype.afterSave,
        beforeExecute: MongoDataNoopListener.prototype.beforeExecute
    });
}