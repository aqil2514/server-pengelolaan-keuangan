import { TransactionBodyType, TransactionFormData, TransactionSaveFunctions, TransactionType } from "src/@types/Transaction";
import { encryptTransactionData } from "./misc";
import supabase from "../../lib/db";
import { getSelectedTransactionBodyData } from "./fetching";

export function addNewTransaction(
    dateTransaction: string,
    transactions: TransactionType[],
    bodies: TransactionBodyType | TransactionBodyType[]
  ) {
    const newDate: TransactionType = {
      id: crypto.randomUUID(),
      header: dateTransaction,
      body: [],
    };
  
    if (Array.isArray(bodies)) {
      for (const body of bodies) {
        newDate.body.push(body);
      }
    } else {
      newDate.body.push(bodies);
    }
    transactions.push(newDate);
  
    return transactions;
  }
  
  export function editTransactionData(
    data: TransactionType[],
    body: TransactionFormData
  ) {
    const {
      idTransaction,
      uidTransaction,
      dateTransaction,
      noteTransaction,
      typeTransaction,
      totalTransaction,
      assetsTransaction,
      categoryTransaction,
    } = body;
  
    const selectedData = data.find((d) => d.id === idTransaction);
    const oldSelectedData = data.find((d) => d.id === idTransaction);
    if (!selectedData) throw new Error("Data yang akan diedit tidak ada");
    if (!oldSelectedData) throw new Error("Data lama tidak ada");
  
    const selectedBodyData = getSelectedTransactionBodyData(data, String(idTransaction), String(uidTransaction))
    if (!selectedBodyData) throw new Error("Data body tidak ada");
  
    if (selectedData.header === oldSelectedData.header) {
      selectedBodyData.asset = String(assetsTransaction);
      selectedBodyData.category = String(categoryTransaction);
      selectedBodyData.item = String(categoryTransaction);
      selectedBodyData.price =
        typeTransaction === "Pemasukan"
          ? Number(totalTransaction)
          : Number(totalTransaction) * -1;
      selectedBodyData.item = String(noteTransaction);
  
      return data;
    } else {
      const dateFind = data.find((d) => d.header === String(dateTransaction));
      // * Kasus 1 : Bagaimana jika tanggal data baru belum ada di database?
      if (!dateFind) {
        const newDataTransaction: TransactionType = {
          id: crypto.randomUUID(),
          header: String(dateTransaction),
          body: [],
        };
  
        const newDataTransactionBody: TransactionBodyType = {
          uid: crypto.randomUUID(),
          asset: String(assetsTransaction),
          category: String(categoryTransaction),
          item: String(noteTransaction),
          price:
            typeTransaction === "Pemasukan"
              ? Number(totalTransaction)
              : Number(totalTransaction) * -1,
        };
  
        const dataIndex = data.findIndex((d) => d.id === idTransaction);
  
        newDataTransaction.body.push(newDataTransactionBody);
        data.push(newDataTransaction);
        const filteredData = data[dataIndex].body.filter(
          (d) => d.uid !== uidTransaction
        );
        data[dataIndex].body = filteredData;
  
        const noNullData = data.filter((d) => d.body.length !== 0);
  
        return noNullData;
      }
  
      // * Kasus 2 : Bagaimana jika tanggal data baru sudah ada di database?
      const newDataBody = selectedData.body.filter(
        (d) => d.uid !== selectedBodyData.uid
      );
      dateFind.body.push(selectedBodyData);
      selectedData.body = newDataBody;
  
      const noNullData = data.filter((d) => d.body.length !== 0);
  
      return noNullData;
    }
  }

  export const saveTransaction: TransactionSaveFunctions = {
  async updateData(transaction, userId) {
    const data = encryptTransactionData(JSON.stringify(transaction), userId);

    await supabase
      .from("user_data")
      .update({ user_transaction: data })
      .eq("userId", userId)
      .select();
  },
  async newData(dataBody, finalData, userId) {
    finalData.body.push(dataBody);

    const encryptedData = encryptTransactionData(
      JSON.stringify(finalData),
      userId
    );

    await supabase
      .from("user_data")
      .update({ user_transaction: encryptedData })
      .eq("userId", userId);
  },
};