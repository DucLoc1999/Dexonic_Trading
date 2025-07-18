import fs from "fs";

export async function POST(request: Request) {
  const { txHash } = await request.json();
  let txnHistory = "";
  try {
    txnHistory = fs.readFileSync("data/txnHistory.txt", "utf8");
    fs.writeFileSync("data/txnHistory.txt", `${txnHistory}\n${txHash}`);
  } catch (e) {
    if (e instanceof Error && 'code' in e && e.code === 'ENOENT') {
      txnHistory = `${txHash}`;
      fs.writeFileSync("data/txnHistory.txt", txnHistory);
    } else {
      throw e;
    }
  }
  return new Response("Transaction saved", { status: 200 });
}