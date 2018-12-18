/*
 |--------------------------------------
 | Dependencies
 |--------------------------------------
 */

const express = require("express");
const bodyParser = require("body-parser"); // Convert incoming req to JSON
const cors = require("cors");
const helmet = require("helmet"); // Secure Express app with various HTTP headers
const morgan = require("morgan"); // Logging
const jwt = require("express-jwt"); // Validates a JSON Web Token
const jwksRsa = require("jwks-rsa"); // Retrieve RSA public keys from JWKS
const mongoose = require("mongoose");
const methodOverride = require("method-override");

/*
 |--------------------------------------
 | App
 |--------------------------------------
 */

const app = express();
app.use(helmet());
app.use(bodyParser.json());
app.use(cors());
app.use(morgan("combined")); // Log HTTP requests
app.use(methodOverride("X-HTTP-Method-Override"));

// Config
const config = require("./config");

/*
 |--------------------------------------
 | MongoDB
 |--------------------------------------
 */

const questions = []; // replace with DB

mongoose.connect(config.MONGO_URI);
const monDb = mongoose.connection;

monDb.on("error", function() {
  console.error(
    "MongoDB Connection Error. Please make sure that",
    config.MONGO_URI,
    "is running."
  );
});

monDb.once("open", function callback() {
  console.info("Connected to MongoDB:", config.MONGO_URI);
});

/*
 |--------------------------------------
 | Authetication 
 |--------------------------------------
 */

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://tour-mapper.auth0.com/.well-known/jwks.json`
  }),

  // Validate the audience and the issuer
  audience: "LrUWUhZTWmwi0ire5GDCN3F4RUaxJJ62",
  issuer: `https://tour-mapper.auth0.com/`,
  algorithms: ["RS256"]
});

/*
 |--------------------------------------
 | Requests
 |--------------------------------------
 */

// Retrieve all questions
const Question = require("./Models/Question");

app.get("/", (req, res) => {
  Question.find(function(err, questions) {
    if (err) {
      res.send(err);
    }
    const qs = questions.map(q => ({
      id: q.id,
      title: q.title,
      description: q.description,
      answers: q.answers.length
    }));
    res.send(qs);
  });

  // const qs = questions.map(q => ({
  //     id: q.id,
  //     title: q.title,
  //     description: q.description,
  //     answers: q.answers.length,
  // }));
  // res.send(qs);
});

app.get("/:id", (req, res) => {
  Question.findById(req.params.id, function(err, question) {
    if (err) res.send(err);
    res.json(question);
  });

  // const question = questions.filter(q => (q.id === parseInt(req.params.id)));
  // if (question.length > 1) return res.status(500).send();
  // if (question.length === 0) return res.status(404).send();
  // res.send(questions[0]);
});

app.post("/", checkJwt, (req, res) => {
  const { title, description } = req.body;

  const newQuestion = new Question({
    id: questions.length + 1,
    title,
    description,
    answers: []
  });
  newQuestion.save(function(err) {
    if (err) {
      return res.status(500).send({ message: err.message });
    }
    res.status(200).send();
  });

  // const newQuestion = {
  //     id: questions.length + 1,
  //     title,
  //     description,
  //     answers: []
  // };
  // questions.push(newQuestion);
  // res.status(200).send();
});

app.post("/answer/:id", checkJwt, (req, res) => {
    console.log(req.params)
    
    Question.findById(req.params.id, function(err, question) {
    if (err) { 
        console.log("-ERROR-" + err.message)
        res.send(err);
        return;
    }
    
    console.log(question)
    const { answer } = req.body;
    question.answers.push({
      answer,
      author: req.user.name
    });

    question.save(function(err) {
      if (err) {
        return res.status(500).send({ message: err.message });
      }
      res.status(200).send();
    });
  });

  //   const question = questions.filter(q => q.id === parseInt(req.params.id));
  //   if (question.length > 1) return res.status(500).send();
  //   if (question.length === 0) return res.status(404).send();

  //   const { answer } = req.body;
  //   question[0].answers.push({
  //     answer,
  //     author: req.user.name
  //   }); // TODO test this, pushing answer in different ways

  //   res.status(200).send();
});

// require('./api')(app, config);

// // Pass routing to Angular app
// // Don't run in dev
// if (process.env.NODE_ENV !== 'dev') {
//   app.get('*', function(req, res) {
//     res.sendFile(path.join(__dirname, '/dist/index.html'));
//   });
// }

/*
 |--------------------------------------
 | Server
 |--------------------------------------
 */

app.listen(process.env.PORT || 8081, () => {
  console.log("Listening on port 8081");
});
