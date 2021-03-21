Til að búa til töflur og setja inn gögn:
keyra fyrst: npm run setup
og svo: npm run import


# Vefforritun 2, 2021, Hópverkefni 1

Sjá lýsingu verkefnis: [verkefni 4](https://github.com/vefforritun/vef2-2021-h1)

Sett upp á Heroku app sem [hopedihop1](https://hopedihop1.herokuapp.com/)

## Uppsetning

* Keyra npm install eftir að verkefni hefur verið sótt
* Búa til gagnagrunn fyrir verkefni, t.d. `h1`
* Setja `DATABASE_URL` fyrir gagnagrunn í `.env`
* Keyra npm run setup - býr til töflurnar í gagnagrunninum
* Keyra npm run import - setur gögnin úr .csv skránum undir /data inn í gagnagrunninn
* Í .env.example má sjá það sem þarf að setja sem JWT_SECRET og CLOUDINARY_URL
* Keyra npm start - setur vefþjón í gang
* Keyra npm test - til að keyra eslint


## Notendur

### admin
* Notendanafn: `admin`
* password: `123`
* POST /login: `{"username": "admin", "password": "123"}`

### auðkenndur notendi
* Notendanafn: `bjarnicool`
* password: `123`
* POST /login: `{"username": "bjarnicool", "password": "123"}`

## Dæmi um köll í vefþjónustu

### Sem óinnskráður notandi:
--> http://<grunnsíða>/tv
GET - mun skila síðum af sjónvarpsþáttum með grunnupplýsingum
--> http://<grunnsíða>/tv/2/season
GET - mun skila öllum seasons í sjónvarpsþætti með id 2

### Sem innskráður notandi:
Fyrst:
--> http://<grunnsíða>/users/login
`{"username": "bjarnicool", "password": "123"}`
Skilar token 
Þar sem á að gera aðgerð:
--> Authorization
    --> Velja `Bearer Token`
    --> kópera `token` sem var skilað úr login
--> http://<grunnsíða>/tv/4/rate
`{"rating": "5"}`
POST - leyfir notanda að skrá einkunnina 5 fyrir sjónvarpsþátt með id 4
PATCH - leyfir notanda að breyta einkunn fyrir sjónvarpsþátt með id 4
DELETE - eyðir einkunn notanda fyrir sjónvarpsþátt með id 4

### Sem admin:
Fyrst:
--> http://<grunnsíða>/users/login
`{"username": "admin", "password": "123"}`
Þar sem á að gera aðgerð:
--> Authorization
    --> Velja `Bearer Token`
    --> kópera `token` sem var skilað úr login
--> http://<grunnsíða>/tv
POST með form-data:
KEY og VALUE þar sem skrá er sett inn með því að velja File undir KEY
t.d.  Title - Why Women Kill
      Language - en
      Image - mynd.jpg (velja File)
      First_aired - 05-03-2020
Mun setja í gagnagrunninn ofangreindar upplýsingar, þar sem mynd.jpg er geymd á cloudinary og url á hana sett undir Image



## Hópur
* Áslaug Högnadóttir - AslaugHogna
* Bjarni Guðmundsson - bjarnig86
* Einar Pálsson - einarpalsson
* Hallbjörn Magnússon - Hallinn




> Útgáfa 0.1
