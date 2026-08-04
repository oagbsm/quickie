import {
  buildAbsoluteAppUrl,
  type AppOriginEnvironment,
} from "./app-url.ts";

export function getSignUpConfirmationRedirect(
  environment?: AppOriginEnvironment,
) {
  const callback = new URL(buildAbsoluteAppUrl("/auth/callback", environment));
  callback.searchParams.set(
    "next",
    "/business/sign-in?confirmed=1",
  );
  callback.searchParams.set("purpose", "signup_confirmation");
  return callback.toString();
}

export function getPasswordRecoveryRedirect(
  environment?: AppOriginEnvironment,
) {
  return buildAbsoluteAppUrl(
    "/auth/callback?next=/business/update-password",
    environment,
  );
}
