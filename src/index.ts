import express from "express";
import cors from "cors";
import propertyRoutes from "./routes/propertyRoutes";
import pictureRoutes from "./routes/pictureRoutes";
import userRoutes from "./routes/userRoutes";

const app = express();
const PORT = 8000;

app.use(cors());

app.use(express.json());

// Routes
app.use("/properties", propertyRoutes);
app.use("/pictures", pictureRoutes);
app.use("/users", userRoutes);

// Global error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
