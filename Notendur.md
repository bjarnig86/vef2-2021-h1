# Óauðkenndur notandi:

    Getur skoðað gögn, Sign up-að og skráð sig inn

# Auðkenndur notandi:

- Getur skráð sína "stöðu" á þáttum:
  - `Langar að horfa`
  - `Er að horfa`
  - `Hef horft`
- Getur gefið þátt, mynd, etc, einkunn, int á bilinu 0 - 5.

# Auðkenndur stjórnandi:

- Getur breytt, bætt við, og eytt sjónvarpsþáttum, seasons og stökum þáttum.
- Getur gert aðra notendur að stjórnendum

# Admin:

- Notendanafn: `admin`
- password: `123`
- POST /login: `{"username": "admin", "password": "123"}`

- Í Postman:

  - POST
    --> http://<linkur.com>/login
    --> Body
    --> Raw
    --> JSON
    --> `{"username": "admin", "password": "123"}`
    --> Send
  - Ef password er rétt er `token` skilað

  - GET
    --> http://<linkur.com>/users
    --> GET --> Authorization
    --> Velja `Bearer Token`
    --> kópera `token` sem var skilað úr login
    --> Send
  - Viðeigandi "message" koma svo hér

  - PATCH
    --> http://<linkur.com>/users/{id}
    --> Authorization
    --> Velja `Bearer Token`
    --> kópera `token` sem var skilað úr login
    --> Body
    --> Raw
    --> JSON
    --> `{"email": "bjarnirosacool@egercool.com"}`
    --> Send

# ENV Skrá

DATABASE_URL=<!PATH TO DATABASE!>
SESSION_SECRET="xxx"
JWT_SECRET=$dk3Ae9dknv#Gposiuhvkjkljd
CLOUDINARY_URL=cloudinary://xxx
