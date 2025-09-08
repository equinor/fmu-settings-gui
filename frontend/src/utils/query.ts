import { isAxiosError } from "axios";
import { toast } from "react-toastify";

export const defaultErrorHandling = (error: Error, errorPrefix: string) => {
  const message =
    `${errorPrefix}: ` +
    (isAxiosError(error) &&
    error.response?.data &&
    "detail" in error.response.data
      ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        String(error.response.data.detail)
      : error.message);
  console.error(message);
  toast.error(message);
};
