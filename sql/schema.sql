
DROP TABLE IF EXISTS signatures;
DROP TABLE IF EXISTS users;

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
  broadcast ...,
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
  number integer NOT NULL,
  broadcast ...,
  description text,
  poster varchar(255) NOT NULL,
);

CREATE TABLE episodes (
  id serial primary key,
  title varchar(255) NOT NULL,
  number integer NOT NULL,
  broadcast...,
  description text
);
