import {DataConfiguration, DataConfigurationStrategy} from "@themost/data";
import path from "path";

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
}