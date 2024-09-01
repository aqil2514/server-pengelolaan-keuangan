import { Controller, Get, Logger, Req, Res } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { Request, Response } from 'express';

@Controller('/api/transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}
  private readonly logger = new Logger(TransactionController.name);

  @Get()
  async testing(@Req() req: Request, @Res() res: Response) {
    const userId = req.headers['user-id'] as string;
    await this.transactionService.getTransaction(userId);

    return res.json({ message: 'OK' });
  }
}
