import type { Dict } from "./utils";

export interface WithResults<T> {
  results: T;
}

export interface ODataErrorDetail {
  code: string;
  message: string;
  propertyref: string;
  severity: string;
  target: string;
}

export interface ODataErrorResponse {
  error: {
    code: string;
    message: {
      value: string;
    };
    innererror: {
      errordetails: ODataErrorDetail[];
    };
  };
}

export interface ODataError {
  // The request headers
  headers?: Dict;
  // A text that describes the failure.
  message?: string;
  // HTTP status code returned by the request (if available)
  statusCode?: string;
  // The status as a text, details not specified, intended only for diagnosis output
  statusText?: string;
  // Response that has been received for the request, as a text string
  responseText?: string;
}

export interface ODataResponses<D = unknown> {
  results: D;
}

export type ODataResponse<D = unknown> = D;

// Batch response
export interface ODataBatchResponseDetail<T> {
  statusCode: string;
  statusText: string;
  headers: Dict;

  // In case of creating new or getting data
  // The request body response (JSON)
  body: string;
  // The parsed response body
  data: T;

  // Exclude change error
  message?: never;
  response?: never;
  __changeResponses?: never;
}

export interface ODataBatchChangeError {
  message: string;
  response: ODataBatchResponseDetail<never>;
  __changeResponses?: never;
}

export interface ODataBatchChangeSuccess {
  __changeResponses: ODataBatchResponseDetail<unknown>[];
}

export interface ODataBatchChangeResponse {
  __batchResponses: (ODataBatchChangeSuccess | ODataBatchChangeError)[];
}

export interface ODataBatchResponse<T> {
  __batchResponses: ODataBatchResponseDetail<T>[];
}
