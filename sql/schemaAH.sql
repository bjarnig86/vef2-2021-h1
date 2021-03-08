
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS shows;
DROP TABLE IF EXISTS seasons;
DROP TABLE IF EXISTS episodes;
DROP TABLE IF EXISTS shows_categories;
DROP TABLE IF EXISTS users_shows;

CREATE TABLE users (
  id serial primary key,
  username varchar(32) NOT NULL UNIQUE,
  email varchar(255) NOT NULL,
  password varchar(255) NOT NULL,
  admin boolean default false
);

CREATE TABLE categories (
  id serial primary key,
  title varchar(255) NOT NULL UNIQUE
);

CREATE TABLE shows (
  id serial primary key,
  title varchar(255) NOT NULL,
  broadcast date,
  inproduction boolean,
  tagline varchar(255),
  image varchar(255) NOT NULL,
  description text,
  language varchar(2) NOT NULL,
  network varchar(255),
  webpage varchar(255)
);

CREATE TABLE seasons (
  id serial primary key,
  title varchar(255) NOT NULL,
  number integer NOT NULL CHECK (number > 0),
  broadcast date,
  description text,
  poster varchar(255) NOT NULL,
);

CREATE TABLE episodes (
  id serial primary key,
  title varchar(255) NOT NULL,
  number integer NOT NULL CHECK (number > 0),
  broadcast date,
  description text
);

CREATE TABLE shows_categories (
  id SERIAL PRIMARY KEY,
  show INTEGER NOT NULL,
  category INTEGER NOT NULL,
  CONSTRAINT show FOREIGN KEY (show) REFERENCES shows (id),
  CONSTRAINT category FOREIGN KEY (category) REFERENCES categories (id),
);

CREATE TABLE users_shows (
  id SERIAL PRIMARY KEY,
  show INTEGER NOT NULL,
  "user" INTEGER NOT NULL,
  CONSTRAINT show FOREIGN KEY (show) REFERENCES shows (id),
  CONSTRAINT "user" FOREIGN KEY ("user") REFERENCES users (id),
  rating INTEGER CHECK (rating between 0 and 5),

Staða, má vera tóm, eitt af Langar að horfa, Er að horfa, Hef horft (hægt að nota strengi eða enum)
);
