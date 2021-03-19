### Sjónvarpsþættir

- `/tv` <komið>
  - `GET` skilar síðum af sjónvarpsþáttum með grunnupplýsingum <komið>
  - `POST` býr til nýjan sjónvarpsþátt, aðeins ef notandi er stjórnandi <komið>
- `/tv/:id` <komið>
  - `GET` skilar stöku sjónvarpsþáttum með grunnupplýsingum, meðal einkunn sjónvarpsþáttar, fjölda einkunna sem hafa verið skráðar fyrir sjónvarpsþátt, fylki af tegundum sjónvarpsþáttar (genres), fylki af seasons, rating notanda, staða notanda <komið>
  - `PATCH`, uppfærir sjónvarpsþátt, reit fyrir reit, aðeins ef notandi er stjórnandi <komið>
  - `DELETE`, eyðir sjónvarpsþátt, aðeins ef notandi er stjórnandi <komið>
- `/tv/:id/season/` <komið>
  - `GET` skilar fylki af öllum seasons fyrir sjónvarpsþátt <komið>
  - `POST` býr til nýtt í season í sjónvarpþætti, aðeins ef notandi er stjórnandi <komið>
- `/tv/:id/season/:id` <komið>
  - `GET` skilar stöku season fyrir þátt með grunnupplýsingum, fylki af þáttum <komið>
  - `DELETE`, eyðir season, aðeins ef notandi er stjórnandi <komið>
- `/tv/:id/season/:id/episode/` <komið>
  - `POST` býr til nýjan þátt í season, aðeins ef notandi er stjórnandi
- `/tv/:id/season/:id/episode/:id` <Bjarni>
  - `GET` skilar upplýsingum um þátt
  - `DELETE`, eyðir þætti, aðeins ef notandi er stjórnandi
- `/genres` <>
  - `GET` skilar síðu af tegundum (genres)
  - `POST` býr til tegund, aðeins ef notandi er stjórnandi

### Notendur

- `/users/` <komið>
  - `GET` skilar síðu af notendum, aðeins ef notandi sem framkvæmir er stjórnandi <komið>
- `/users/:id` <komið>
  - `GET` skilar notanda, aðeins ef notandi sem framkvæmir er stjórnandi <komið>
  - `PATCH` breytir hvort notandi sé stjórnandi eða ekki, aðeins ef notandi sem framkvæmir er stjórnandi og er ekki að breyta sér sjálfum <komið>
- `/users/register` <komið>
  - `POST` staðfestir og býr til notanda. Skilar auðkenni og netfangi. Notandi sem búinn er til skal aldrei vera stjórnandi <komið>
- `/users/login` <komið>
  - `POST` með netfangi (eða notandanafni) og lykilorði skilar token ef gögn rétt <komið>
- `/users/me` <komið>
  - `GET` skilar upplýsingum um notanda sem á token, auðkenni og netfangi, aðeins ef notandi innskráður <komið>
  - `PATCH` uppfærir netfang, lykilorð eða bæði ef gögn rétt, aðeins ef notandi innskráður <komið>

Aldrei skal skila eða sýna hash fyrir lykilorð.

### Sjónvarpsþættir og notendur

- `/tv/:id/rate`
  - `POST`, skráir einkunn innskráðs notanda á sjónvarpsþætti, aðeins fyrir innskráða notendur
  - `PATCH`, uppfærir einkunn innskráðs notanda á sjónvarpsþætti
  - `DELETE`, eyðir einkunn innskráðs notanda á sjónvarpsþætti
- `/tv/:id/state`
  - `POST`, skráir stöðu innskráðs notanda á sjónvarpsþætti, aðeins fyrir innskráða notendur
  - `PATCH`, uppfærir stöðu innskráðs notanda á sjónvarpsþætti
  - `DELETE`, eyðir stöðu innskráðs notanda á sjónvarpsþætti
- `/tv/:id`
  - Ef notandi er innskráður skal sýna einkunn og stöðu viðkomandi á sjónvarpsþætti.
