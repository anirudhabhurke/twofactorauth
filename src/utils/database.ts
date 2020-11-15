import { JsonDB } from 'node-json-db';
import { Config } from 'node-json-db/dist/lib/JsonDBConfig';

let db: JsonDB | null;

export const getDb = () => {
      if (!db) {
            db = new JsonDB(new Config('myDatabase', true, true, '/'));
            return db;
      } else {
            return db;
      }
};
