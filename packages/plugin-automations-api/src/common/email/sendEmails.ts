import { debugError } from "@erxes/api-utils/src/debuggers";
import { sendCoreMessage } from "../../messageBroker";
import { getEnv } from "../../utils";
import { getConfig } from "./utils";
import { createTransporter } from "./createTransporter";

export const sendEmails = async ({
  subdomain,
  params,
}: {
  subdomain: string;
  params: {
    title: string;
    fromEmail: string;
    toEmails: string[];
    ccEmails: string[];
    customHtml: string;
  };
}) => {
  const { toEmails = [], ccEmails = [], fromEmail, title, customHtml } = params;

  const configs = await sendCoreMessage({
    subdomain,
    action: "getConfigs",
    data: {},
    isRPC: true,
    defaultValue: {},
  });

  const NODE_ENV = getEnv({ name: "NODE_ENV" });

  const DEFAULT_EMAIL_SERVICE = getConfig(
    configs,
    "DEFAULT_EMAIL_SERVICE",
    "SES"
  );
  const COMPANY_EMAIL_FROM = getConfig(configs, "COMPANY_EMAIL_FROM");
  const AWS_SES_CONFIG_SET = getConfig(configs, "AWS_SES_CONFIG_SET");
  const AWS_SES_ACCESS_KEY_ID = getConfig(configs, "AWS_SES_ACCESS_KEY_ID");
  const AWS_SES_SECRET_ACCESS_KEY = getConfig(
    configs,
    "AWS_SES_SECRET_ACCESS_KEY"
  );

  if (!fromEmail && !COMPANY_EMAIL_FROM) {
    throw new Error("From Email is required");
  }

  if (NODE_ENV === "test") {
    throw new Error("Node environment is required");
  }

  let transporter;

  try {
    transporter = await createTransporter(
      { ses: DEFAULT_EMAIL_SERVICE === "SES" },
      configs
    );
  } catch (e) {
    debugError(e.message);
    throw new Error(e.message);
  }

  const responses: any[] = [];
  for (const toEmail of toEmails) {
    const mailOptions: any = {
      from: fromEmail || COMPANY_EMAIL_FROM,
      to: toEmail,
      cc: ccEmails.length ? ccEmails : undefined,
      subject: title,
      html: customHtml,
    };
    let headers: { [key: string]: string } = {};

    if (!!AWS_SES_ACCESS_KEY_ID?.length && !!AWS_SES_SECRET_ACCESS_KEY.length) {
      const emailDelivery = await sendCoreMessage({
        subdomain,
        action: "emailDeliveries.create",
        data: {
          kind: "transaction",
          to: toEmail,
          from: fromEmail,
          subject: title,
          body: customHtml,
          status: "pending",
        },
        isRPC: true,
      });

      headers = {
        "X-SES-CONFIGURATION-SET": AWS_SES_CONFIG_SET || "erxes",
        EmailDeliveryId: emailDelivery && emailDelivery._id,
      };
    } else {
      headers["X-SES-CONFIGURATION-SET"] = "erxes";
    }

    mailOptions.headers = headers;

    if (!mailOptions.from) {
      throw new Error(`"From" email address is missing: ${mailOptions.from}`);
    }

    try {
      const info = await transporter.sendMail(mailOptions);
      responses.push({
        messageId: info.messageId,
        toEmail,
        ccEmails: ccEmails.length ? ccEmails : undefined,
      });
    } catch (error) {
      responses.push({ fromEmail, toEmail, error });
      debugError(error);
    }
  }

  return responses;
};
