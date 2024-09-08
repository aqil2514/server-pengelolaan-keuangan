import { Module } from "@nestjs/common";
import { MakeHttpRespons } from "./httpResponse.utils";

@Module({
  providers: [MakeHttpRespons],
  exports: [MakeHttpRespons],
})
export class SharedModule {}
