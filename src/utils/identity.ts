import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

export const generateSecretKey = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const generateAnonymousId = (): string => {
  const shortUuid = uuidv4().split("-")[0].toUpperCase();
  return `MESH-${shortUuid}`;
};