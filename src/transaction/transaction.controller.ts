import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  InternalServerErrorException,
  Logger,
  Post,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { ClientTransactionAddFormData } from './entity/transaction.entity';

@Controller('/api/transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}
  private readonly logger = new Logger(TransactionController.name);

  @Get()
  async getTransactionData(@Headers('user-id') userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID dibutuhkan dalam header');
    }

    const transaction = await this.transactionService.getTransaction(userId);
    return { data: transaction };
  }

  @Post()
  async addTransactionData(@Body() data: ClientTransactionAddFormData) {
    try {
      const processData =
        await this.transactionService.addTransactionData(data);
        
      return { success: true, data: processData };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException('Failed to add transaction');
    }
  }
}
