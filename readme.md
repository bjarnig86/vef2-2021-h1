
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
**/tv GET**

Kallað með GET á slóðina https://hopedihop1.herokuapp.com/tv
Skilar síðum af sjónvarpsþáttum með grunnupplýsingum.

* https://hopedihop1.herokuapp.com/tv/2/season

GET - mun skila öllum seasons í sjónvarpsþætti með id 2

### Sem innskráður notandi:
**Innskrá notanda**

Kallað með POST á slóðina https://hopedihop1.herokuapp.com/users/login
Body á kallinu á að vera `{"username": "bjarnicool", "password": "123"}`
Svar frá vefþjóninum inniheldur token.

**tv/:id/rate POST**

Skráir rating á sjónvarpsþátt með tölugildið 1 - 5.
Kallað með POST á slóðina https://hopedihop1.herokuapp.com/tv/4/rate
Setja þarf token-ið sem kom úr login kallinu sem `Bearer Token` og setja `{"rating": "5"}` í body.

### Sem admin:
**Innskrá admin notanda**

Kallað með POST á slóðina https://hopedihop1.herokuapp.com/users/login
Body á kallinu á að vera `{"username": "admin", "password": "123"}`
Svar frá vefþjóninum inniheldur token.

**tv/ POST**

Býr til sjónvarpsþáttaseríu
Kallað með POST á slóðina https://hopedihop1.herokuapp.com/tv
Setja þarf token-ið sem kom úr login kallinu sem `Bearer Token`.
Gögnunum er postað sem form-data með eftirfarandi lykla og gildi:

| Lykill | Gildi |
|--------|-------|
| title | Why Women Kill |
| first_aired | 05-03-2020 |
| in_production | true |
| image | mynd.jpg (velja file) |
| tagline | Really why? |
| description | Dr. Phil explaines it all |
| language | en |

## Hópur
* Áslaug Högnadóttir - AslaugHogna
* Bjarni Guðmundsson - bjarnig86
* Einar Pálsson - einarpalsson
* Hallbjörn Magnússon - Hallinn

> Útgáfa 0.1
