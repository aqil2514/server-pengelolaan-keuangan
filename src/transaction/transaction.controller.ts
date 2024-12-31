import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { Request } from 'express';
import { ClientTransactionAddFormData } from './entity/transaction.entity';

@Controller('/api/transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}
  private readonly logger = new Logger(TransactionController.name);

  @Get()
  async getTransactionData(@Req() req: Request) {
    const userId = req.headers['user-id'] as string;
    if (!userId) {
      // Menangani kasus jika 'user-id' tidak ada di header
      return {
        userId,
        message: 'user ID dibutuhkan dalam header',
      };
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
