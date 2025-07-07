import express from "express";
import cors from "cors";
import propertyRoutes from "./routes/propertyRoutes";
import pictureRoutes from "./routes/pictureRoutes";

const app = express();
const PORT = 8000;

app.use(cors());

app.use(express.json());

// Routes
app.use("/properties", propertyRoutes);
app.use("/pictures", pictureRoutes);

// Global error handling middleware
app.use(
  (
    err: any,
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
