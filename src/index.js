// console.log('Hello World!');
// const express = require('express');

import express from 'express';
import {dirname,join} from 'path';
import {fileURLToPath} from 'url';
import bodyParser from 'body-parser';

import indexRoutes from './routes/web.js';
// import ejs from 'ejs';
const app = express();

const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(bodyParser.urlencoded({ extended: true }));

app.set('views', join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(indexRoutes);

app.use(express.static(join(__dirname, 'public')));



app.listen(3000)
console.log('Server is running on port 3000');