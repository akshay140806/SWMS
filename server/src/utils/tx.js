import mongoose from 'mongoose';

/**
 * Runs operations within a MongoDB transaction if the deployment supports it
 * (ReplicaSet or Sharded / mongos).
 * On standalone instances (e.g. local single MongoDB 127.0.0.1:27017), transactions
 * are not supported by the MongoDB engine, so this safely executes the callback
 * with session = null, permanently preventing:
 * "Transaction numbers are only allowed on a replica set member or mongos".
 */
let txSupported = null;

export async function withTx(workFn) {
  if (txSupported === false) {
    return await workFn(null);
  }

  const topologyType = mongoose.connection?.client?.topology?.description?.type || '';
  if (topologyType === 'Single') {
    txSupported = false;
    return await workFn(null);
  }

  const supportsTx = topologyType.includes('ReplicaSet') || topologyType === 'Sharded';
  if (!supportsTx && topologyType !== '') {
    txSupported = false;
    return await workFn(null);
  }

  let session = null;
  try {
    session = await mongoose.startSession();
    let result;
    await session.withTransaction(async () => {
      result = await workFn(session);
    });
    txSupported = true;
    return result;
  } catch (err) {
    const isTxError =
      (err.message && (
        err.message.includes('Transaction numbers are only allowed on a replica set member or mongos') ||
        err.message.includes('replica set')
      )) ||
      err.code === 20;

    if (isTxError) {
      txSupported = false;
      return await workFn(null);
    }
    throw err;
  } finally {
    if (session) {
      try {
        await session.endSession();
      } catch {
        // ignore
      }
    }
  }
}
