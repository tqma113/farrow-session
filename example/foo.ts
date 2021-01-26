import { Response, Router } from "farrow-http";

export const foo = Router();

foo
  .match({
    url: "/",
    method: ["GET", "POST"]
  })
  .use((req, next) => {
    return Response.text('Hello world!')
  })