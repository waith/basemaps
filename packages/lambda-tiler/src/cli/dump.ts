import { Epsg } from '@basemaps/geo';
import { LambdaContext } from '@basemaps/lambda';
import { LogConfig } from '@basemaps/shared';
import { ImageFormat } from '@basemaps/tiler';
import { promises as fs } from 'fs';
import { PrettyTransform } from 'pretty-json-log';
import { tile } from '../routes/tile';
import { TileSet } from '../tile.set';
import { loadTileSet, TileSets } from '../tile.set.cache';
import { TileSetLocal } from './tile.set.local';

if (process.stdout.isTTY) LogConfig.setOutputStream(PrettyTransform.stream());

const xyz = { x: 0, y: 0, z: 0 };
const projection = Epsg.Google;
const tileSetName = 'aerial';
const ext = ImageFormat.PNG;

/** Load a tileset form a file path otherwise default to the hard coded one from AWS */
async function getTileSet(filePath?: string): Promise<TileSet> {
    if (filePath != null) {
        const tileSet = new TileSetLocal('local', projection, filePath);
        await tileSet.load();
        TileSets.set(tileSet.id, tileSet);
        return tileSet;
    }

    const tileSet = await loadTileSet(tileSetName, projection);
    if (tileSet == null) throw new Error('Missing');
    return tileSet;
}

/**
 * Utility to render a single tile then save it as a png
 */
async function main(): Promise<void> {
    const logger = LogConfig.get();

    const filePath = process.argv[2];
    const tileSet = await getTileSet(filePath);

    logger.info({ ...xyz, projection }, 'RenderTile');

    const ctx = new LambdaContext(
        {
            httpMethod: 'get',
            path: `/v1/tiles/${tileSet.name}/${projection.code}/${xyz.z}/${xyz.x}/${xyz.y}.${ext}`,
        } as any,
        logger,
    );

    const tileData = await tile(ctx);

    const headers: Record<string, any> = {};
    for (const [key, value] of tileData.headers) headers[key] = value;

    logger.info({ ...tileData, body: tileData.body?.length, headers }, 'Done');
    if (tileData.body != null) {
        await fs.writeFile(`output_${xyz.x}_${xyz.y}_z${xyz.z}.${ext}`, tileData.body);
    }
}

main().catch(console.error);
