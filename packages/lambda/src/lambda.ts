import { Callback, Context } from 'aws-lambda';
import { ApplicationJson, HttpHeader } from './header';
import { LambdaContext, LambdaHttpRequestType, LambdaHttpReturnType, LogType } from './lambda.context';
import { LambdaHttpResponse } from './lambda.response';

export interface HttpStatus {
    statusCode: string;
    statusDescription: string;
}

export class LambdaFunction {
    /**
     *  Wrap a lambda function to provide extra functionality
     *
     * - Log metadata about the call on every request
     * - Catch errors and log them before exiting
     */
    public static wrap(
        fn: (req: LambdaContext) => Promise<LambdaHttpResponse>,
        logger: LogType,
    ): (event: LambdaHttpRequestType, context: Context, callback: Callback<LambdaHttpReturnType>) => Promise<void> {
        return async (
            event: LambdaHttpRequestType,
            context: Context,
            callback: Callback<LambdaHttpReturnType>,
        ): Promise<void> => {
            // Log the lambda event for debugging
            if (process.env['DEBUG']) {
                logger.debug({ event }, 'LambdaDebug');
            }

            const ctx = new LambdaContext(event, logger);
            ctx.timer.start('lambda');

            const lambda = {
                name: process.env['AWS_LAMBDA_FUNCTION_NAME'],
                memory: process.env['AWS_LAMBDA_FUNCTION_MEMORY_SIZE'],
                version: process.env['AWS_LAMBDA_FUNCTION_VERSION'],
                region: process.env['AWS_REGION'],
            };

            ctx.log.info({ lambda }, 'LambdaStart');

            let res: LambdaHttpResponse;
            try {
                res = await fn(ctx);
            } catch (error) {
                // If a LambdaHttpResponse was thrown, just reuse it as a response
                if (LambdaHttpResponse.isHttpResponse(error)) {
                    res = error;
                } else {
                    // Unhandled exception was thrown
                    ctx.set('err', error);
                    res = new LambdaHttpResponse(500, 'Internal Server Error');
                }
            }

            ctx.set('lambda', lambda);
            ctx.set('status', res.status);
            ctx.set('description', res.statusDescription);
            ctx.set('metrics', ctx.timer.metrics);

            res.header(HttpHeader.RequestId, ctx.id);
            res.header(HttpHeader.CorrelationId, ctx.correlationId);

            const duration = ctx.timer.end('lambda');
            ctx.set('unfinished', ctx.timer.unfinished);
            ctx.set('duration', duration);

            ctx.log.info(ctx.logContext, 'LambdaDone');

            if (!res.isBase64Encoded && res.header(HttpHeader.ContentType) == null) {
                res.header(HttpHeader.ContentType, ApplicationJson);
            }

            callback(null, LambdaContext.toResponse(ctx, res));
        };
    }
}