import express from "express";
import cors from "cors";
import propertyRoutes from "./routes/propertyRoutes";

const app = express();
const PORT = 8000;

app.use(cors());

app.use(express.json());

// Routes
app.use("/properties", propertyRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
