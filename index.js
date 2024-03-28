const express = require('express')
const app = express()
const port = 3000
const route = require('./src/routes')
const morgan = require('morgan')
const db = require('./src/config/connectdb')

//Load .env
require('dotenv').config();

//use middlewares
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({
    extended: true
}))

//connect DB
db.connect()

//routing
route(app);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})