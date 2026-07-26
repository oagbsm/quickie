import {
  buildAbsoluteAppUrl,
  type AppOriginEnvironment,
} from "./app-url.ts";

export function getSignUpConfirmationRedirect(
  environment?: AppOriginEnvironment,
) {
  return buildAbsoluteAppUrl(
    "/auth/callback?next=/business/continue",
    environment,
  );
}

export function getPasswordRecoveryRedirect(
  environment?: AppOriginEnvironment,
) {
  return buildAbsoluteAppUrl(
    "/auth/callback?next=/business/update-password",
    environment,
  );
}
