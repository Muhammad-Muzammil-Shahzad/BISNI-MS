require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/db/db");

connectDB();

port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log("server is Running");
});
