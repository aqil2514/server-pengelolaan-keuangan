import { ClientEndpointType, DefaultData } from "src/@types/Lib";


export const clientEndpoint: ClientEndpointType = {
  github: "https://jubilant-invention-pxjqr94qv94365p5-5173.app.github.dev",
  vercel: "https://pengelolaan-keuangan.vercel.app",
  local: "http://localhost:5173",
};

export const defaultData:DefaultData = {
  asset: [
    {
      name: "Kantong Utama",
      group: "Tunai",
      amount: 0,
      description: "Kantong yang berbagai macam uang",
      color: "#35bd55"
    },
    {
      name: "Bank BRI",
      group: "Rekening",
      amount: 0,
      description: "ATM untuk menyimpang uang",
      color: "#35bd55"
    },
    {
      name: "Dana",
      group: "E-Wallet",
      amount: 0,
      description: "Untuk Jajan",
      color: "##bd356b"
    },
  ]
}