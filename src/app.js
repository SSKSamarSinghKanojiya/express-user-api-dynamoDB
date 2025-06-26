import express from 'express';
import userRoutes from './routes/user.routes.js';

const app = express();

app.use(express.json());
app.use('/users', userRoutes);
app.get('/', (req, res) => res.send('User API Running'));

export default app;
