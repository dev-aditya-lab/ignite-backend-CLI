import app from './app.js'; // Using .js extension so that compiled output aligns with Node ESM resolution
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
