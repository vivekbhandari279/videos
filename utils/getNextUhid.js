import { UhidCounter } from "../models/uhidCounter.model.js";

export async function getNextUhid(sequenceName) {
  const sequenceDocument = await UhidCounter.findByIdAndUpdate(
    sequenceName,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return sequenceDocument.seq;
}
