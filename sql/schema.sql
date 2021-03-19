begin;
DROP TABLE IF EXISTS shows_genres;
DROP TABLE IF EXISTS users_shows;
DROP TABLE IF EXISTS genres;
DROP TABLE IF EXISTS episodes;
DROP TABLE IF EXISTS seasons;
DROP TABLE IF EXISTS shows;
DROP TABLE IF EXISTS users;
DROP TYPE IF EXISTS status;

CREATE TABLE users (
  id serial primary key,
  username varchar(32) NOT NULL UNIQUE,
  email varchar(255) NOT NULL,
  password varchar(255) NOT NULL,
  admin boolean default false
);

INSERT INTO users (username, email, password, admin) VALUES ('admin', 'admin@admin.com', '$2a$11$pgj3.zySyFOvIQEpD7W6Aund1Tw.BFarXxgLJxLbrzIv/4Nteisii', true);
INSERT INTO users (username, email, password, admin) VALUES ('bjarnicool', 'bjarni@egercool.com', '$2a$11$pgj3.zySyFOvIQEpD7W6Aund1Tw.BFarXxgLJxLbrzIv/4Nteisii', false);


CREATE TABLE genres (
  id serial primary key,
  title varchar(255) NOT NULL UNIQUE
);


CREATE TABLE shows (
  id serial primary key,
  title varchar(255) NOT NULL,
  first_aired date,
  in_production boolean,
  tagline varchar(255),
  image varchar(255) NOT NULL,
  description text,
  language varchar(2) NOT NULL,
  network varchar(255),
  webpage varchar(255)
);


CREATE TABLE seasons (
  --id serial primary key,
  title varchar(255) NOT NULL,
  number smallint NOT NULL CHECK (number > 0),
  first_aired date,
  description text,
  poster varchar(255) NOT NULL,
  show integer REFERENCES shows(id) ON DELETE CASCADE,
  PRIMARY KEY (show, number)
);


CREATE TABLE episodes (
  id serial --primary key,
  title varchar(255) NOT NULL,
  number smallint NOT NULL CHECK (number > 0),
  first_aired date,
  description text,
  season integer,
  show integer,
  FOREIGN KEY(show, season) REFERENCES seasons ON DELETE CASCADE
  PRIMARY KEY (show, season, number)
);


CREATE TABLE shows_genres (
  id SERIAL PRIMARY KEY,
  show INTEGER NOT NULL,
  genre INTEGER NOT NULL,
  CONSTRAINT show FOREIGN KEY (show) REFERENCES shows (id) ON DELETE CASCADE,
  CONSTRAINT genre FOREIGN KEY (genre) REFERENCES genres (id)
);


CREATE TYPE status AS ENUM('Langar að horfa', 'Er að horfa', 'Hef horft');
CREATE TABLE users_shows (
  id SERIAL PRIMARY KEY,
  show INTEGER NOT NULL,
  "user" INTEGER NOT NULL,
  CONSTRAINT show FOREIGN KEY (show) REFERENCES shows (id),
  CONSTRAINT "user" FOREIGN KEY ("user") REFERENCES users (id),
  rating INTEGER CHECK (rating between 0 and 5),
  status status
);
commit;
