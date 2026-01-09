import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("MarketProphet is alive");
});

export default app;
