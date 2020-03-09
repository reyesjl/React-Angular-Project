DROP DATABASE IF EXISTS server2;

CREATE DATABASE server2;
\c server2;

CREATE TABLE IF NOT EXISTS users (
    firstname text NOT NULL,
    lastname text NOT NULL,
    username text UNIQUE NOT NULL,
    email text NOT NULL,
    PRIMARY KEY (username)
);

CREATE TABLE IF NOT EXISTS workshops (
    workshopID SERIAL UNIQUE,
    wsname text NOT NULL,
    wsdate date NOT NULL,
    wslocation text NOT NULL,
    wsmaxseats int NOT NULL,
    wsinstructor text NOT NULL,
    PRIMARY KEY (workshopID)
);

CREATE TABLE IF NOT EXISTS attending (
    username text REFERENCES users (username),
    workshopID int REFERENCES workshops (workshopID)
);
