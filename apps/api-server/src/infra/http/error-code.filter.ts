import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";

@Catch()
export class ErrorCodeFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<{
      status: (code: number) => { send: (body: unknown) => void };
    }>();
    if (!(exception instanceof HttpException)) {
      console.error(exception);
      response.status(500).send({ code: "INTERNAL" });
      return;
    }
    const body = exception.getResponse();
    const code = typeof body === "object" && body !== null && "code" in body
      ? String(body.code)
      : "UNAUTHENTICATED";
    response.status(exception.getStatus()).send({ code });
  }
}
