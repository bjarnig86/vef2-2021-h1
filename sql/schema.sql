
DROP TABLE IF EXISTS signatures;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id serial primary key,
  username varchar(32) NOT NULL UNIQUE,
  email varchar(255) NOT NULL,
  password varchar(255) NOT NULL,
  admin boolean default false
);

DROP TABLE IF EXISTS categories;
CREATE TABLE categories (
  id serial primary key,
  title varchar(255) NOT NULL UNIQUE
);

DROP TABLE IF EXISTS shows;
CREATE TABLE shows (
  id serial primary key,
  title varchar(255) NOT NULL,
  first_aired date NOT NULL,
  in_production boolean,
  tagline varchar(255),
  image varchar(255) NOT NULL,
  description text,
  language varchar(2) NOT NULL,
  network varchar(255),
  webpage varchar(255)
);

DROP TABLE IF EXISTS seasons;
CREATE TABLE seasons (
  id serial primary key,
  title varchar(255) NOT NULL,
  number smallint NOT NULL,
  first_aired date,
  description text,
  poster varchar(255) NOT NULL
);

DROP TABLE IF EXISTS episodes;
CREATE TABLE episodes (
  id serial primary key,
  title varchar(255) NOT NULL,
  number smallint NOT NULL CHECK (number > 0),
  first_aired date,
  description text
);
