import express from 'express';
import cors from 'cors';
  
const app = express();
app.use(cors())
const PORT:Number=3000;
  
app.get('/', (req, res) => {
    res.send('Welcome to typescript backend Guy!');
})
  
app.listen(PORT,() => {
    console.log('The application is listening '
          + 'on port http://localhost:'+PORT);
})