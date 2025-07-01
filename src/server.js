const express = require('express');
const app = express();

app.use(express.static('public'));

app.listen(8016, () => console.log('Server running on port 8016'));
