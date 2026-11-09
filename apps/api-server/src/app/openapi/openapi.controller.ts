import { Controller, Get } from "@nestjs/common";
import { openApiDocument } from "./openapi-document";

@Controller("openapi.json")
export class OpenApiController {
  @Get()
  document() {
    return openApiDocument;
  }
}
