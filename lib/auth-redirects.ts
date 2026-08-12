import {
  buildAbsoluteAppUrl,
  type AppOriginEnvironment,
} from "./app-url.ts";

export function getSignUpConfirmationRedirect(
  environment?: AppOriginEnvironment,
) {
  const callback = new URL(buildAbsoluteAppUrl("/auth/callback", environment));
  callback.searchParams.set("purpose", "signup-confirmation");
  return callback.toString();
}

export function getPasswordRecoveryRedirect(
  environment?: AppOriginEnvironment,
) {
  return buildAbsoluteAppUrl("/sign-in", environment);
}

export function getCustomerSignUpRedirect(draftToken: string, environment?: AppOriginEnvironment) {
  const callback = new URL(buildAbsoluteAppUrl("/auth/callback", environment));
  callback.searchParams.set("draft", draftToken);
  return callback.toString();
}
