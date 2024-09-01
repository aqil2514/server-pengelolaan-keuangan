export interface TransactionType {
  id?: string;
  header: string;
  body: TransactionBodyType[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionBodyType {
  uid: string;
  category: string;
  asset: string;
  item: string;
  price: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
