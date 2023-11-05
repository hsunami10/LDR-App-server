# Setup Instructions

## PostgreSQL Database

[PostgreSQL Cheat Sheet](https://www.postgresqltutorial.com/postgresql-cheat-sheet/)

Install PostgreSQL via Homebrew: `brew install postgresql`, download [TablePlus GUI Tool](https://tableplus.com/)

Here's [list of commands](https://tableplus.com/blog/2018/10/how-to-start-stop-restart-postgresql-server.html) to start / stop the server

```shell
# Manual start
pg_ctl -D /usr/local/var/postgres start # Start server
pg_ctl -D /usr/local/var/postgres -l /usr/local/var/postgres/server.log start # Start server with log file

# Manual stop
pg_ctl -D /usr/local/var/postgres stop

# Auto on log-in
brew services start postgresql
brew services stop postgresql
```

Once started, check if postgres is running:

```shell
export PGDATA='/usr/local/var/postgres' # Set PGDATA env variable
pg_ctl status
```

`pg_ctl status` should print out:

```shell
pg_ctl: server is running (PID: 15460)
/usr/local/Cellar/postgresql/14.4/bin/postgres "-D" "/usr/local/var/postgres"
```

If this is a fresh installation, need to initialize the database cluster (a collection of databases managed by a single server)

```shell
initdb /usr/local/var/postgres
```



Default host: `127.0.0.1` / `localhost`, port: `5432`

To access the shell, run `psql -U postgres`

If you run into an error `psql: error: connection to server on socket "/tmp/.s.PGSQL.5432" failed: FATAL:  database "postgres" does not exist`, run `createdb postgres` and try again

### Set up schema

```shell
psql -U postgres # log into psql shell

\c ldr_app # Connect to a specific database
\i ./database/initialize_database.sql
```

#### Troubleshooting

**[postgis error when running initialize_database.sql](https://morphocode.com/how-to-install-postgis-on-mac-os-x/)**

```shell
ERROR:  could not open extension control file "/usr/local/share/postgresql/extension/postgis.control": No such file or directory
```

Try installing postgis via Homebrew: `brew install postgis` and run `CREATE EXTENSION postgis;` manually:

```shell
psql -U postgres
CREATE EXTENSION postgis;
```

## General Troubleshooting

### yarn install

If you run into an error like below:

```shell
node-pre-gyp WARN Pre-built binaries not found for bcrypt@3.0.3 and node@20.9.0 (node-v115 ABI, unknown) (falling back to source compile with node-gyp) 
node-pre-gyp http 404 status code downloading tarball https://github.com/kelektiv/node.bcrypt.js/releases/download/v3.0.3/bcrypt_lib-v3.0.3-node-v115-darwin-x64-unknown.tar.gz 
```

when running `yarn` / `yarn install`, try [changing to an earlier version of node](https://github.com/kelektiv/node.bcrypt.js/issues/725#issuecomment-607750417) using NVM:

```shell
nvm ls # Lists out (local) installed versions of node
nvm use 9.9.0 # Switch to an earlier version, v9.9.0 currently works
node -v # Re-confirm the version switch
```

If you see a bunch of `node-pre-gyp ERR!` that can be ignored.

**[ERROR: relation 'session' does not exist](https://stackoverflow.com/a/71285712)**

```shell
2023-11-04 15:13:19.519 CDT [42930] ERROR:  relation "session" does not exist at character 13
2023-11-04 15:13:19.519 CDT [42930] STATEMENT:  DELETE FROM "session" WHERE expire < to_timestamp($1)
Failed to prune sessions: relation "session" does not exist
```

Run the SQL query below with `psql` or TablePlus:

```sql
CREATE TABLE sessions (
  sid character varying NOT NULL PRIMARY KEY,
  sess json NOT NULL,
  expire timestamp(6) with time zone NOT NULL
);
```
### yarn start
If you get the below error:
```shell
node:internal/modules/cjs/loader:1327
  return process.dlopen(module, path.toNamespacedPath(filename));
                 ^

Error: The module '/Users/michaelhsu/Documents/GitHub/LDR-App-server/node_modules/bcrypt/lib/binding/bcrypt_lib.node'
was compiled against a different Node.js version using
NODE_MODULE_VERSION 59. This version of Node.js requires
NODE_MODULE_VERSION 115. Please try re-compiling or re-installing
the module (for instance, using `npm rebuild` or `npm install`).
    at Module._extensions..node (node:internal/modules/cjs/loader:1327:18)
    at Module.load (node:internal/modules/cjs/loader:1091:32)
```
Change your node version to `v9.9.0` using `nvm use 9.9.0`.

***TODO: Figure out `create extension postgis;` error***
