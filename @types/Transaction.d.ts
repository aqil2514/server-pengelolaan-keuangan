namespace Transaction {
  export interface TransactionBodyType {
    category: string;
    asset: string;
    item: string;
    price: number;
  }

  export interface TransactionType {
    header: string;
    body: TransactionBodyType[];
  }
}
