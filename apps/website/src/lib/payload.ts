import { config } from "payload_app";
import { getPayload } from "payload";
export const payload = async () => {
  const payloadConfig = await config;
  return await getPayload({ config: payloadConfig });
};
