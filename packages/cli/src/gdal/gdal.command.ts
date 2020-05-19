import { LogType } from '@basemaps/lambda-shared';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { GdalProgressParser } from './gdal.progress';

/**
 * GDAL uses AWS_DEFAULT_PROFILE while node uses AWS_PROFILE
 * this validates the configuration is sane
 *
 * @param env environment to normalize
 */
export function normalizeAwsEnv(env: Record<string, string | undefined>): Record<string, string | undefined> {
    const awsProfile = env['AWS_PROFILE'];
    const awsDefaultProfile = env['AWS_DEFAULT_PROFILE'];

    if (awsProfile == null) env;
    if (awsDefaultProfile == null) {
        return { ...env, AWS_DEFAULT_PROFILE: awsProfile };
    }
    if (awsDefaultProfile != awsProfile) {
        throw new Error(
            `$AWS_PROFILE: "${awsProfile}" and $AWS_DEFAULT_PROFILE: "${awsDefaultProfile}" are mismatched`,
        );
    }
    return env;
}

export abstract class GdalCommand {
    parser?: GdalProgressParser;
    protected child: ChildProcessWithoutNullStreams;
    protected promise?: Promise<{ stdout: string; stderr: string }>;
    protected startTime: number;
    /** Should log all of stdout/stderr */
    verbose = true;

    /** AWS Access  */
    protected credentials?: AWS.Credentials;

    mount?(mount: string): void;
    env?(): Promise<Record<string, string | undefined>>;

    /** Pass AWS credentials into the container */
    setCredentials(credentials?: AWS.Credentials): void {
        this.credentials = credentials;
    }

    async run(cmd: string, args: string[], log: LogType): Promise<{ stdout: string; stderr: string }> {
        if (this.promise != null) {
            return this.promise;
        }
        this.parser?.reset();
        this.startTime = Date.now();

        const env = normalizeAwsEnv(this.env ? await this.env() : process.env);

        const child = spawn(cmd, args, { env });
        this.child = child;

        const outputBuff: Buffer[] = [];
        const errBuff: Buffer[] = [];
        child.stderr.on('data', (data: Buffer) => {
            const buf = data.toString();
            /**
             * Example error line
             * `ERROR 1: TIFFReadEncodedTile:Read error at row 4294967295, col 4294967295; got 49005 bytes, expected 49152`
             */
            if (buf.includes('ERROR 1')) {
                log.error({ data: buf }, 'GdalError');
            } else {
                log.warn({ data: buf }, 'GdalWarn');
            }
            errBuff.push(data);
        });
        child.stdout.on('data', (data: Buffer) => {
            outputBuff.push(data);
            this.parser?.data(data);
        });

        this.promise = new Promise((resolve, reject) => {
            child.on('exit', (code: number) => {
                const stdout = outputBuff.join('').trim();
                const stderr = errBuff.join('').trim();

                if (code != 0) {
                    log.error({ code, stdout, stderr }, 'GdalFailed');
                    return reject(new Error('Failed to execute GDAL command'));
                }
                if (this.verbose) log.warn({ stdout, stderr }, 'GdalOutput');

                this.promise = undefined;
                return resolve({ stdout, stderr });
            });
            child.on('error', (error: Error) => {
                const stdout = outputBuff.join('').trim();
                const stderr = errBuff.join('').trim();
                log.error({ stdout, stderr }, 'GdalFailed');
                this.promise = undefined;
                reject(error);
            });
        });

        return this.promise;
    }
}