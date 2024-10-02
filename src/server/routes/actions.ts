import { config } from "#src/config";
import { getDripRequestHandlerInstance } from "#src/dripper/DripRequestHandler";
import polkadotActions from "#src/dripper/polkadot/PolkadotActions";
import { convertAmountToBn, formatAmount } from "#src/dripper/polkadot/utils";
import { logger } from "#src/logger";
import { getNetworkData } from "#src/papi/index";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";

import { BalanceResponse, DripErrorResponse, DripRequestType, DripResponse, FaucetRequestType } from "../../types";

const networkName = config.Get("NETWORK");
const networkData = getNetworkData(networkName);

const router = express.Router();
router.use(cors());
const dripRequestHandler = getDripRequestHandlerInstance(polkadotActions);

router.get<{ asset_id: string }, BalanceResponse>("/balance/:asset_id", (req, res) => {
  const { asset_id } = req.params;
  polkadotActions
    .getFaucetBalance(parseInt(asset_id))
    .then((balance) => res.send({ balance: formatAmount(balance) }))
    .catch((e) => {
      logger.error(e);
      res.send({ balance: "0" });
    });
});

const missingParameterError = (res: Response<DripErrorResponse>, parameter: keyof FaucetRequestType): void => {
  res.status(400).send({ error: `Missing parameter: '${parameter}'` });
};

const addressMiddleware = (
  req: Request<unknown, DripResponse, Partial<DripRequestType>>,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.body.address) {
    return missingParameterError(res, "address");
  }
  next();
};

type PartialDrip<T extends FaucetRequestType> = Partial<T> & Pick<T, "address">;

router.post<unknown, DripResponse, PartialDrip<FaucetRequestType>>("/drip/web", addressMiddleware, async (req, res) => {
  const { address, recaptcha, asset_id } = req.body;

  if (!recaptcha) {
    return missingParameterError(res, "recaptcha");
  }
  if (!asset_id) {
    return missingParameterError(res, "asset_id");
  }
  try {
    const dripResult = await dripRequestHandler.handleRequest({
      address,
      amount: convertAmountToBn(networkData.data.dripAmount),
      asset_id,
      recaptcha,
    });

    if ((dripResult as DripErrorResponse).error) {
      res.status(400).send(dripResult);
    } else {
      res.send(dripResult);
    }
  } catch (e) {
    logger.error(e);
    res.status(500).send({ error: "Operation failed." });
  }
});

export default router;
