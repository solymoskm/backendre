import express from "express";
import { google } from "googleapis";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(fs.readFileSync("credentials.json", "utf-8")),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SHEET_ID = process.env.SHEET_ID;

app.post("/register-user", async (req, res) => {
  const { name, position, email } = req.body;
  const formattedHeader = `${name} (${position})`;

  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    const headerRange = "Sheet1!A1:1";
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: headerRange,
    });

    const headers = response.data.values?.[0] || [];

    if (!headers.includes(formattedHeader)) {
      const insertIndex = [...headers, formattedHeader].sort().indexOf(formattedHeader);
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `Sheet1!${String.fromCharCode(65 + insertIndex)}1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [[formattedHeader]],
        },
      });
    }

    res.status(200).send("User added to sheet");
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to add user to sheet");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
