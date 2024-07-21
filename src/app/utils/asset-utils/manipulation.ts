import { AssetProcessProps, AssetsData } from "src/@types/Assets";
import {
  STATUS_BAD_REQUEST,
  STATUS_CONFLICT,
  STATUS_NOT_FOUND,
  STATUS_OK,
  STATUS_UNPROCESSABLE_ENTITY,
} from "src/app/lib/httpStatusCodes";
import { getUserData } from "../general-utils";
import {
  assetDeleteOption,
  changeAssetTransaction,
  encryptAssets,
  getDecryptedAssetData,
  saveAssetData,
} from "../asset-utils";
import { BasicResponse } from "src/@types/General";
import { TransactionFormData } from "src/@types/Transaction";

export const processAsset: AssetProcessProps = {
  async createNew(formData, userId) {
    const {
      assetName,
      assetNominal,
      assetCategory,
      newAssetCategory,
      assetDescription,
      assetColor,
    } = formData;

    const userData = await getUserData(userId);
    const userAssetData = getDecryptedAssetData(
      String(userData?.user_assets),
      userId
    );

    let assetGroup = newAssetCategory ? newAssetCategory : assetCategory;

    if (userAssetData.find((asset) => asset.name.trim() === assetName.trim())) {
      const result: BasicResponse<AssetsData> = {
        message: "Nama Aset sudah ada",
        status: "error",
        statusCode: STATUS_UNPROCESSABLE_ENTITY,
        data: {} as AssetsData,
      };
      return result;
    }

    const formTransaction: TransactionFormData = {
      dateTransaction: new Date(),
      noteTransaction: "Modal awal",
      typeTransaction: "Pemasukan",
      totalTransaction: assetNominal,
      assetsTransaction: assetName,
      categoryTransaction: "Modal",
      userId,
    };

    // const transactionBody: TransactionBodyType = {
    //   uid: crypto.randomUUID(),
    //   asset: assetName,
    //   category: "Modal",
    //   item: "Uang awal",
    //   price:
    //     formTransaction.typeTransaction === "Pemasukan"
    //       ? Number(assetNominal)
    //       : Number(assetNominal) * -1,
    // };

    // const transactionFinalData: TransactionType = {
    //   id: crypto.randomUUID(),
    //   header: String(new Date()),
    //   body: [],
    // };

    // transactionFinalData.body.push(transactionBody);

    // await processData(
    //   formTransaction.typeTransaction,
    //   formTransaction,
    //   userData as AccountData,
    //   transactionBody,
    //   formTransaction.dateTransaction.toISOString(),
    //   transactionFinalData
    // );

    const finalData: AssetsData = {
      name: assetName,
      amount: assetNominal,
      description: decodeURIComponent(assetDescription),
      group: assetGroup,
      color: assetColor,
    };

    userAssetData.push(finalData);

    const encAssetData = encryptAssets(userAssetData, userId);

    await saveAssetData(encAssetData, userId);

    const result: BasicResponse<AssetsData> = {
      message: "Asset berhasil dibuat",
      status: "success",
      data: finalData,
      statusCode: STATUS_OK,
    };

    return result;
  },
  async updateData(formData, userId) {
    // Perbaikin di bagian sini nanti. Ada masalah.
    // Jadi, ketika nominal data lama berubah, data baru nominalnya tidak berubah.
    // Kemungkinan masalahnya ada di function synchronize
    const {
      assetCategory,
      assetDescription,
      assetName,
      assetNominal,
      oldAssetName,
      newAssetCategory,
      assetColor,
    } = formData;

    const finalData: AssetsData = {
      name: assetName,
      amount: assetNominal,
      description: decodeURIComponent(assetDescription),
      group: newAssetCategory ? newAssetCategory : assetCategory,
      color: assetColor,
    };

    const userData = await getUserData(userId);

    if (!userData) {
      const result: BasicResponse<AssetsData> = {
        message: "User tidak ditemukan",
        status: "error",
        data: {} as AssetsData,
        statusCode: STATUS_NOT_FOUND,
      };
      return result;
    }

    const userAssetData = getDecryptedAssetData(
      String(userData.user_assets),
      userId
    );

    if (
      assetName !== oldAssetName &&
      userAssetData.find((asset) => asset.name.trim() === assetName.trim())
    ) {
      const result: BasicResponse<AssetsData> = {
        message: "Nama Aset sudah ada",
        status: "error",
        data: {} as AssetsData,
        statusCode: STATUS_CONFLICT,
      };
      return result;
    }

    const selectedIndex = userAssetData.findIndex(
      (d) => d.name === oldAssetName
    );

    if (selectedIndex === -1) {
      const result: BasicResponse<AssetsData> = {
        message: "Data tidak ditemukan",
        status: "error",
        data: {} as AssetsData,
        statusCode: STATUS_NOT_FOUND,
      };
      return result;
    }
    userAssetData[selectedIndex] = finalData;

    if (assetName !== oldAssetName) {
      await changeAssetTransaction(
        oldAssetName,
        assetName,
        String(userData.user_transaction),
        userData.userId
      );
    }

    const encryptAssetData = encryptAssets(userAssetData, userId);

    const saveData = await saveAssetData(encryptAssetData, userId);

    if (saveData.error) {
      const result: BasicResponse<AssetsData> = {
        message: "Nama Aset sudah ada",
        status: "error",
        data: {} as AssetsData,
        statusCode: STATUS_BAD_REQUEST,
      };
      return result;
    }

    const result: BasicResponse<AssetsData> = {
      message: "Data berhasil diubah",
      status: "success",
      data: finalData,
      statusCode: STATUS_OK,
    };
    return result;
  },
  async deleteData(assetName, clientId, deleteOption) {
    const userData = await getUserData(String(clientId));

    if (!userData) {
      const result: BasicResponse<null> = {
        message: "User tidak ditemukan",
        statusCode: STATUS_NOT_FOUND,
        status: "error",
        data: null,
      };

      return result;
    }

    const userAssetData = getDecryptedAssetData(
      String(userData.user_assets),
      String(clientId)
    );

    const filteredAsset = userAssetData.filter((d) => d.name !== assetName);
    const encryptAssetData = encryptAssets(filteredAsset, String(clientId));

    if (deleteOption === "delete-transaction") {
      await assetDeleteOption.deleteTransaction(
        userData.userId,
        String(userData.user_transaction),
        String(assetName)
      );
    } else if (
      deleteOption &&
      String(deleteOption).includes("move-transaction")
    ) {
      await assetDeleteOption.moveTransaction(
        String(deleteOption),
        userData.userId,
        String(userData.user_transaction),
        String(assetName)
      );
    }

    const saveData = await saveAssetData(encryptAssetData, String(clientId));
    if (saveData.error) {
      const result: BasicResponse<null> = {
        message: "Terjadi kesalahan saat menyimpan data",
        status: "error",
        data: null,
        statusCode: STATUS_BAD_REQUEST,
      };
      return result;
    }

    const result: BasicResponse<null> = {
      message: "Aset berhasil dihapus",
      status: "success",
      data: null,
      statusCode: STATUS_OK,
    };

    return result;
  },
};
