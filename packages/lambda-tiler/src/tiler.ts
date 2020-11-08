import { Epsg, EpsgCode } from '@basemaps/geo';
import { GoogleTms } from '@basemaps/geo/build/tms/google';
import { Nztm2000Tms } from '@basemaps/geo/build/tms/nztm2000';
import { Tiler } from '@basemaps/tiler/build/tiler';
import { Nztm2000AgolTms } from '@basemaps/geo/build/tms/nztm2000.agol';

export const DefaultTilers = [new Tiler(GoogleTms), new Tiler(Nztm2000Tms)];

const AgolConversionFactor = 16 / 23;

/**
 * Sub Tiler class to override the convertZ function to map the agol TMS Z values onto the NZTM2000
 * standard TMS so that rules are filtered correctly.
 */
class AgolTiler extends Tiler {
    /**
     * Linear convertion from 1-23 to 1-16
     */
    convertZ(z: number): number {
        return Math.round(z * AgolConversionFactor);
    }
}

export const Nztm2000AgolTiler = new AgolTiler(Nztm2000AgolTms);

export const AltTilers: Record<string, Tiler> = {
    agol: new AgolTiler(Nztm2000AgolTms),
};
/** *
 * This class is to cache the creation of the tilers, while also providing access
 * so that they can be mocked during tests.
 */
export const Tilers = {
    map: new Map<EpsgCode, Tiler>(),
    /** Map of alternative TileMatrixSets by alt-name, EpsgCode */
    alt: new Map<string, Map<EpsgCode, Tiler>>(),
    /** Lookup a tiler by EPSG Code and optional alternative TileMatrixSet */
    get(epsg: Epsg, alt?: string): Tiler | undefined {
        if (alt != null) {
            return Tilers.alt.get(alt)?.get(epsg.code);
        }
        return Tilers.map.get(epsg.code);
    },

    add(tiler: Tiler): void {
        Tilers.map.set(tiler.tms.projection.code, tiler);
    },

    /** Reset the tiler cache */
    reset(): void {
        Tilers.map.clear();
        DefaultTilers.forEach((t) => Tilers.add(t));

        Tilers.alt.clear();
        for (const [key, tiler] of Object.entries(AltTilers)) {
            let map = Tilers.alt.get(key);
            if (map == null) {
                map = new Map<EpsgCode, Tiler>();
                Tilers.alt.set(key, map);
            }
            map.set(tiler.tms.projection.code, tiler);
        }
    },
};

Tilers.reset();
