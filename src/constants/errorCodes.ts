enum ErrorCodes {
  bad_request = 400,
  unauthenticated = 401, // client identity unknown
  unauthorized = 403, // identity known but unauthorized
  not_found = 404,
  validation_failed = 406,
  locked = 423,
  too_many_requests = 429,
  server_error = 500,
  service_unavailable = 503,
  mongoose_validation = 510,
  mongoose_cast = 511,
  mongoose_mongo = 512,
  mongoose_document_not_found = 513,
  mongoose_unknown = 514,
  axios_response = 520,
  axios_request = 521,
  axios_unknown = 523,
}

export { ErrorCodes };
