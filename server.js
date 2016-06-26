'use strict';

const express = require('express');
const fs = require('fs');
const app = express();
const port = 8000;

app.use(express.static('dist'));

app.get('/userData', (req, res) => {
	let data = fs.readFileSync('./usersData.json');
	res.end(data);
});

app.listen(port);