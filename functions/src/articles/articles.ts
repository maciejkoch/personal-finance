import type { Request } from "firebase-functions/v2/https";
import { HttpResponse, validationError } from "../http/query-validation";
import * as fs from "fs";
import { marked } from "marked";
import * as path from "path";
import { validateArticle } from "./articles.dto";

const CONTENT_PATH = path.join(__dirname, "../../content");

export function execute(request: Request, response: HttpResponse): void {
  const article = validateArticle(request.query);

  if (article.success) {
    try {
      const { slug } = article.data;
      const filePath = path.join(CONTENT_PATH, `${slug}.md`);
      if (!fs.existsSync(filePath)) {
        response.status(404).send("File not found");
        return;
      }

      const markdownContent = fs.readFileSync(filePath, "utf8");
      const htmlContent = marked.parse(markdownContent, { async: false });

      response.status(200).send({ html: htmlContent });
    } catch (error) {
      console.error("Error reading Markdown file:", error);
      response.status(500).send("Internal server error");
    }
  } else {
    response.status(400);
    response.send(validationError(article.error));
  }
}
