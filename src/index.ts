import express from 'express';
import cors from 'cors';
  
const app = express();

app.use(cors())
const PORT = 3000;
  
app.get('/', (req, res) => {
    res.send('Bem vindo à adega!');
})
  
app.listen(PORT,() => {
    console.log('The application is listening '
          + 'on port http://localhost:'+PORT);
})