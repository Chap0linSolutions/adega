import type { Knex } from "knex";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'sqlite3',
      connection: {
          filename: path.resolve(__dirname, 'src', 'database', 'database.sqlite')
      },
      migrations:{
        directory: path.resolve(__dirname, 'src', 'database', 'migrations')
      },
      useNullAsDefault: true,
  },
  production: {
    client: 'mysql2',
    connection: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    },
    migrations:{
      directory: path.resolve(__dirname, 'src', 'database', 'migrations')
    }
  }

};

export default config;
