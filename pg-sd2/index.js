//"use strict";

// Include the app.js file.
// This will run the code.
//console.log("entrypoint");
//const app = require("./app.js");

//const app = require("./app");
//app.listen(3000, () => console.log("Server on http://localhost:3000"));

const userRoutes = require("./app/routes/userRoutes");
const intakeRoutes = require("./app/routes/intakeRoutes");

app.use("/", userRoutes);
app.use("/", intakeRoutes);
