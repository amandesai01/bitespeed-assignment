import { Body, Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateContactDTO } from './create-contact.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('identify')
  public identify(@Body() createContactDTO: CreateContactDTO) {
    return this.appService.identify(createContactDTO);
  }
}
