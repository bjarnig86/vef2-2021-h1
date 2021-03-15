Til að búa til töflur og setja inn gögn:
keyra fyrst: npm run setup
og svo: npm run import

# Vefforritun 2, 2021, Hópverkefni 1

Sjá lýsingu verkefnis: [verkefni 4](https://github.com/vefforritun/vef2-2021-h1)

Sett upp á Heroku app sem [hopedihop1](https://hopedihop1.herokuapp.com/)

## Leiðbeiningar

Setja repo upp locally: --> `gh repo clone bjarnig86/vef2-h1`

Setja upp umhverfi locally:
--> `npm install`

Starta postgres server locally á unix tölvu:
--> `sudo service postgresql start`

Starta postgres server locally á Windows tölvu:
--> `???`

Setja þarf .env skjal í rót skv. .env.example

Stofna þarf gagnagrunn locally og setja réttan userstreng í .env skránna:
`DATABASE_URL=postgres://<USER>:<PASS>@localhost/<DATABASENAME>`

Setja töflur í gagnagrunn:
--> `npm run setup`

Keyra gög inn í gagnagrunn:
--> `npm run importcsv`

Keyra eslint á js skjöl og Stylelint á scss skjöl: --> `npm test`

Setja vefþjón í gang:
--> `npm start`

## NTG

Bætti við undirkafla í Readme: "Note To Group" til að halda aðeins utan um nauðsynlegar upplýsingar sem við þurfum að vita og muna. (Halli)

Vinna með gagnagrunn í terminal sem postgres user: --> `sudo -u postgres psql vef2-v3`

Pushar yfir á Heroku: --> `gp heroku`

Keyrir node skipanir á Heroku: --> `heroku run` + `skipun`

Keyrir logga á Heroku: --> `heroku logs -t`

### Git vinnuhringur
1. Færa sig yfir á main til að sækja nýjasta: --> `git checkout main`
2. Sækja nýjasta: Verandi á main: --> `git pull`
3. Fara yfir á branch: --> `git checkout aslaug/bjarni/einar/halli`
4. Sameina: --> `git merge main`
5. Vinna og gera breytingar.
6. Commit-a: --> `gc -a -m"texti"`
7. Push-a: --> `gp`
8. Merge-a: Framkvæma "Compare & pull request" uppi á [github](https://github.com/bjarnig86/vef2-h1) 


> Útgáfa 0.1
