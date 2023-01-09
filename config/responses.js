const response = {
    200: {
      meta: {
        code: 200,
        status: 'success',
        message: 'the request succeeded',
      }
    },
    201: {
      meta: {
        code: 201,
        status: 'success',
        message: 'resource created',
      }
    },
    202: {
      meta: {
        code: 202,
        status: 'success',
        message: 'resource accepted, but in progress',
      }
    },
    400: {
      meta: {
        code: 400,
        status: 'bad_request',
        message: 'bad request',
      }
    },
    401: {
      meta: {
        code: 401,
        status: 'unauthenticated',
        message: 'unauthenticated',
      }
    },
    404: {
      meta: {
        code: 404,
        status: 'not_found',
        message: 'resource not found',
      }
    },
    422: {
      meta: {
        code: 422,
        status: 'unprocessable_entity',
        message: 'bad input',
      }
    },
    423: {
      meta: {
        code: 423,
        status: 'not_found',
        message: 'seller not found',
      }
    },
    500: {
      meta: {
        code: 500,
        status: 'error',
        message: 'error',
      }
    },
};
  
module.exports = response;