import type { AxiosError } from "axios";

import type { ValidationError } from "#client";

export const HTTP_STATUS_UNAUTHORIZED = 401;
export const HTTP_STATUS_UNPROCESSABLE_CONTENT = 422;

export function httpValidationErrorToString(
  error: AxiosError,
  maxErrors: number = 2,
) {
  const mainSeparator = ": ";
  const errorSeparator = "; ";

  const validationErrors = (
    error.response?.data &&
    typeof error.response.data === "object" &&
    "detail" in error.response.data
      ? error.response.data.detail
      : []
  ) as ValidationError[];
  const errorCount = validationErrors.length;

  const errorStrings = validationErrors
    .filter((_, idx) => idx < maxErrors)
    .map((valError) => {
      const locString = valError.loc
        .map((l) => String(l))
        .filter((l, idx) => !(idx === 0 && l === "body"))
        .join(".");

      return `${locString}: ${valError.msg}`;
    });

  let message = "Error in API value validation";
  if (errorStrings.length) {
    message += mainSeparator + errorStrings.join(errorSeparator);
  }
  if (errorCount > maxErrors) {
    const additionalCount = errorCount - maxErrors;
    const errorWord = additionalCount === 1 ? "error" : "errors";
    if (maxErrors === 0) {
      message += `${mainSeparator}(... ${String(additionalCount)} ${errorWord} ...)`;
    } else {
      message += `${errorSeparator}(... and ${String(additionalCount)} more ${errorWord} ...)`;
    }
  }

  return message;
}
