import dotenv from "dotenv";
import app from "./app.js";

// 1. Config environment variables
dotenv.config({ path: ".env" });

const PORT = process.env.PORT || 5000;

try {
  app.on("error", (error) => {
    console.error("Error in app:", error);
    process.exit(1);
  });

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
} catch (error) {
  console.error("Failed to start the server:", error);
  process.exit(1);
}