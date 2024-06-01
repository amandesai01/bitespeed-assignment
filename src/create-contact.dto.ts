import { IsOptional, IsString, MaxLength } from "class-validator";

export class CreateContactDTO {
  @IsString()
  @IsOptional()
  @MaxLength(15)
  phoneNumber: string;

  @IsString()
  @IsOptional()
  @MaxLength(256)
  email: string;
}