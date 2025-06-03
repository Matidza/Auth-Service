const express = require('express');
const { default: helmet } = require('helmet');
const cors = require ('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 8000
app.use(cors())
app.use(helmet())
app.use(cookieParser())
app.use(express.json())

app.use(express.urlencoded({extended:true}))

const users = [
    {
        id: Date.now(),
        firstName: "Zwichuya",
        lastName: "Mukwevho",
        age: 27,

    },
    {
        id: Date.now(),
        firstName: "Wanga",
        lastName: "Mukwevho",
        age: 25
    }
]

//Routes
app.get('/', (req, res) => {
    res.send(users)
})

app.post('/', (req, res) => {
    const adduser = req.body
    console.log(adduser)
    users.push(adduser)
    res.send(`${adduser.firstName} was added to the DB`)
})



app.listen(PORT, () => { //process.env.PORT
    console.log(`Server running on port: http://localhost:${PORT}`)
})
