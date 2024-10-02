import { AppDataSource } from "#src/db/dataSource";
import { Drip } from "#src/db/entity/Drip";
import crypto from "crypto";

const HOURS_SPAN = 20;

const sha256 = (x: string) => crypto.createHash("sha256").update(x, "utf8").digest("hex");

const dripRepository = AppDataSource.getRepository(Drip);

export async function saveDrip(opts: { assetId: number; addr: string }) {
  const freshDrip = new Drip();
  freshDrip.addressSha256 = sha256(opts.addr);
  freshDrip.assetId = opts.assetId;
  await dripRepository.insert(freshDrip);
}

export async function hasDrippedToday(opts: { assetId: number; addr: string }): Promise<boolean> {
  let qb = dripRepository.createQueryBuilder("drip");
  qb = qb.where("(drip.assetId = :assetId and drip.addressSha256 = :addressSha256)", {
    assetId: opts.assetId,
    addressSha256: sha256(opts.addr),
  });
  const res = await qb
    .andWhere("drip.timestamp > :minAllowedTs", {
      minAllowedTs: new Date(Date.now() - HOURS_SPAN * 60 * 60 * 1000).toISOString(),
    })
    .getOne();

  return res !== null;
}
